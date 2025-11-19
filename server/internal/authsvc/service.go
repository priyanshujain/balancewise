package authsvc

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/priyanshujain/balancewise/server/internal/authsvc/domain"
	"github.com/priyanshujain/balancewise/server/internal/authsvc/supporting/google"
	"github.com/priyanshujain/balancewise/server/internal/jwt"
)

type Service struct {
	userRepo  domain.UserRepository
	stateRepo domain.StateRepository
	tokenRepo domain.TokenRepository
	oauth     *google.OAuthService
	jwtSvc    *jwt.Service
}

type ServiceConfig struct {
	UserRepository  domain.UserRepository
	StateRepository domain.StateRepository
	TokenRepository domain.TokenRepository
	OAuthService    *google.OAuthService
	JWTService      *jwt.Service
}

func NewService(cfg ServiceConfig) *Service {
	return &Service{
		userRepo:  cfg.UserRepository,
		stateRepo: cfg.StateRepository,
		tokenRepo: cfg.TokenRepository,
		oauth:     cfg.OAuthService,
		jwtSvc:    cfg.JWTService,
	}
}

// InitiateAuth starts the OAuth flow and returns the auth URL and state
func (s *Service) InitiateAuth(ctx context.Context) (authURL string, state string, err error) {
	// Generate random state
	state, err = google.GenerateRandomState(32)
	if err != nil {
		return "", "", domain.WrapError("failed to generate state", err)
	}

	// Generate auth URL
	authURL = s.oauth.GenerateAuthURL(state)

	// Store state in database
	_, err = s.stateRepo.Create(ctx, state, authURL, time.Now().Add(10*time.Minute))
	if err != nil {
		return "", "", domain.WrapError("failed to create auth state", err)
	}

	slog.Info("initiated auth", "state", state)
	return authURL, state, nil
}

// HandleCallback processes the OAuth callback
func (s *Service) HandleCallback(ctx context.Context, state, code string) (*domain.User, string, error) {
	// Verify state exists and is valid
	authState, err := s.stateRepo.Get(ctx, state)
	if err != nil {
		return nil, "", domain.WrapError("invalid or expired state", err)
	}

	if time.Now().After(authState.ExpiresAt) {
		return nil, "", domain.ErrInvalidState
	}

	// Exchange code for token
	token, err := s.oauth.ExchangeCode(ctx, code)
	if err != nil {
		return nil, "", domain.WrapError("failed to exchange code", err)
	}

	// Get user info from Google
	userInfo, err := s.oauth.GetUserInfo(ctx, token)
	if err != nil {
		return nil, "", domain.WrapError("failed to get user info", err)
	}

	// Download and encode profile picture
	profilePicBase64, err := s.downloadAndEncodeImage(userInfo.Picture)
	if err != nil {
		slog.Warn("failed to download profile picture", "error", err)
		profilePicBase64 = "" // Continue without profile picture
	}

	// Create or update user
	user, err := s.userRepo.GetByEmail(ctx, userInfo.Email)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			// Create new user
			user = &domain.User{
				Email:      userInfo.Email,
				Name:       userInfo.Name,
				ProfilePic: profilePicBase64,
			}
			user, err = s.userRepo.Create(ctx, *user)
			if err != nil {
				return nil, "", domain.WrapError("failed to create user", err)
			}
			slog.Info("created new user", "email", user.Email)
		} else {
			return nil, "", domain.WrapError("failed to get user", err)
		}
	} else {
		// Update existing user
		user, err = s.userRepo.UpdateByEmail(ctx, userInfo.Email, &userInfo.Name, &profilePicBase64)
		if err != nil {
			return nil, "", domain.WrapError("failed to update user", err)
		}
		slog.Info("updated existing user", "email", user.Email)
	}

	// Store refresh token in database
	authToken := domain.AuthToken{
		UserID:       user.ID,
		RefreshToken: &token.RefreshToken,
		ExpiresAt:    time.Now().Add(30 * 24 * time.Hour), // 30 days
	}
	_, err = s.tokenRepo.Upsert(ctx, authToken)
	if err != nil {
		return nil, "", domain.WrapError("failed to store token", err)
	}

	// Update state as authenticated
	_, err = s.stateRepo.Update(ctx, state, user.ID, true)
	if err != nil {
		return nil, "", domain.WrapError("failed to update state", err)
	}

	// Generate JWT
	jwtToken, err := s.jwtSvc.GenerateToken(user.ID, user.Email, user.Name)
	if err != nil {
		return nil, "", domain.WrapError("failed to generate JWT", err)
	}

	slog.Info("successfully authenticated user", "email", user.Email, "state", state)
	return user, jwtToken, nil
}

// PollAuth checks if authentication is complete for a given state
func (s *Service) PollAuth(ctx context.Context, state string) (authenticated bool, user *domain.User, token string, err error) {
	authState, err := s.stateRepo.Get(ctx, state)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return false, nil, "", nil
		}
		return false, nil, "", domain.WrapError("failed to get state", err)
	}

	if time.Now().After(authState.ExpiresAt) {
		return false, nil, "", nil
	}

	if !authState.Authenticated || authState.UserID == nil {
		return false, nil, "", nil
	}

	user, err = s.userRepo.GetByID(ctx, *authState.UserID)
	if err != nil {
		return false, nil, "", domain.WrapError("failed to get user", err)
	}

	jwtToken, err := s.jwtSvc.GenerateToken(user.ID, user.Email, user.Name)
	if err != nil {
		return false, nil, "", domain.WrapError("failed to generate JWT", err)
	}

	_ = s.stateRepo.Delete(ctx, state)

	return true, user, jwtToken, nil
}

// VerifyToken validates a JWT token and returns the user
func (s *Service) VerifyToken(ctx context.Context, tokenString string) (*domain.User, error) {
	claims, err := s.jwtSvc.VerifyToken(tokenString)
	if err != nil {
		return nil, domain.ErrInvalidToken
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, domain.ErrInvalidToken
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrUnauthorized
		}
		return nil, domain.WrapError("failed to get user", err)
	}

	return user, nil
}

// CleanupExpired removes expired states and tokens
func (s *Service) CleanupExpired(ctx context.Context) error {
	if err := s.stateRepo.DeleteExpired(ctx); err != nil {
		slog.Error("failed to delete expired states", "error", err)
	}

	if err := s.tokenRepo.DeleteExpired(ctx); err != nil {
		slog.Error("failed to delete expired tokens", "error", err)
	}

	return nil
}

func (s *Service) InitiateDriveAuth(ctx context.Context, userID uuid.UUID) (authURL string, state string, err error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", "", domain.WrapError("failed to get user", err)
	}

	state, err = google.GenerateRandomState(32)
	if err != nil {
		return "", "", domain.WrapError("failed to generate state", err)
	}

	authURL = s.oauth.GenerateDriveAuthURL(state, user.Email)

	_, err = s.stateRepo.Create(ctx, state, authURL, time.Now().Add(10*time.Minute))
	if err != nil {
		return "", "", domain.WrapError("failed to create auth state", err)
	}

	_, err = s.stateRepo.Update(ctx, state, userID, false)
	if err != nil {
		return "", "", domain.WrapError("failed to update state with user ID", err)
	}

	slog.Info("initiated Drive auth", "state", state, "user_id", userID)
	return authURL, state, nil
}

func (s *Service) HandleDriveCallback(ctx context.Context, state, code string) (*domain.User, error) {
	authState, err := s.stateRepo.Get(ctx, state)
	if err != nil {
		return nil, domain.WrapError("invalid or expired state", err)
	}

	if time.Now().After(authState.ExpiresAt) {
		return nil, domain.ErrInvalidState
	}

	if authState.UserID == nil {
		return nil, fmt.Errorf("state does not have associated user")
	}

	token, err := s.oauth.ExchangeDriveCode(ctx, code)
	if err != nil {
		return nil, domain.WrapError("failed to exchange drive code", err)
	}

	user, err := s.userRepo.GetByID(ctx, *authState.UserID)
	if err != nil {
		return nil, domain.WrapError("failed to get user", err)
	}

	authToken := domain.AuthToken{
		UserID:       user.ID,
		RefreshToken: &token.RefreshToken,
		ExpiresAt:    time.Now().Add(30 * 24 * time.Hour),
	}
	_, err = s.tokenRepo.Upsert(ctx, authToken)
	if err != nil {
		return nil, domain.WrapError("failed to store token", err)
	}

	_ = s.stateRepo.Delete(ctx, state)

	user, err = s.userRepo.UpdateGDriveAllowed(ctx, user.ID, true)
	if err != nil {
		return nil, domain.WrapError("failed to update gdrive_allowed", err)
	}

	slog.Info("successfully granted Drive permissions", "email", user.Email, "user_id", user.ID)
	return user, nil
}

// downloadAndEncodeImage downloads an image from a URL and returns it as base64
func (s *Service) downloadAndEncodeImage(url string) (string, error) {
	if url == "" {
		return "", nil
	}

	resp, err := http.Get(url)
	if err != nil {
		return "", fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to download image: status %d", resp.StatusCode)
	}

	imageData, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read image data: %w", err)
	}

	// Encode to base64
	encoded := base64.StdEncoding.EncodeToString(imageData)
	return encoded, nil
}
