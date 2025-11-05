package google

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	googleOAuth2 "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

const (
	ScopeDriveFile = "https://www.googleapis.com/auth/drive.file"
)

type Config struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

type OAuthService struct {
	config *oauth2.Config
}

type UserInfo struct {
	ID      string
	Email   string
	Name    string
	Picture string
}

func NewOAuthService(cfg Config) *OAuthService {
	return &OAuthService{
		config: &oauth2.Config{
			ClientID:     cfg.ClientID,
			ClientSecret: cfg.ClientSecret,
			RedirectURL:  cfg.RedirectURL,
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		},
	}
}

// GenerateAuthURL generates a Google OAuth URL for the given state
func (s *OAuthService) GenerateAuthURL(state string) string {
	return s.config.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func (s *OAuthService) GenerateDriveAuthURL(state string, userEmail string) string {
	driveConfig := &oauth2.Config{
		ClientID:     s.config.ClientID,
		ClientSecret: s.config.ClientSecret,
		RedirectURL:  s.config.RedirectURL + "-drive",
		Scopes: []string{
			ScopeDriveFile,
		},
		Endpoint: google.Endpoint,
	}

	return driveConfig.AuthCodeURL(
		state,
		oauth2.AccessTypeOffline,
		oauth2.ApprovalForce,
		oauth2.SetAuthURLParam("login_hint", userEmail),
		oauth2.SetAuthURLParam("include_granted_scopes", "true"),
	)
}

// ExchangeCode exchanges an authorization code for a token
func (s *OAuthService) ExchangeCode(ctx context.Context, code string) (*oauth2.Token, error) {
	token, err := s.config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	return token, nil
}

func (s *OAuthService) ExchangeDriveCode(ctx context.Context, code string) (*oauth2.Token, error) {
	driveConfig := &oauth2.Config{
		ClientID:     s.config.ClientID,
		ClientSecret: s.config.ClientSecret,
		RedirectURL:  s.config.RedirectURL + "-drive",
		Scopes: []string{
			ScopeDriveFile,
		},
		Endpoint: google.Endpoint,
	}

	token, err := driveConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange drive code: %w", err)
	}
	return token, nil
}

// GetUserInfo fetches user information from Google using the access token
func (s *OAuthService) GetUserInfo(ctx context.Context, token *oauth2.Token) (*UserInfo, error) {
	oauth2Service, err := googleOAuth2.NewService(ctx, option.WithTokenSource(s.config.TokenSource(ctx, token)))
	if err != nil {
		return nil, fmt.Errorf("failed to create oauth2 service: %w", err)
	}

	userInfo, err := oauth2Service.Userinfo.Get().Do()
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	return &UserInfo{
		ID:      userInfo.Id,
		Email:   userInfo.Email,
		Name:    userInfo.Name,
		Picture: userInfo.Picture,
	}, nil
}

// GenerateRandomState generates a random state string for OAuth flow
func GenerateRandomState(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random state: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
}
