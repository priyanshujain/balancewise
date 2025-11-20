package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/priyanshujain/balancewise/server/internal/authsvc/domain"
)

type tokenRepository struct {
	queries *Queries
}

func NewTokenRepository(db *sql.DB) domain.GoogleTokenRepository {
	return &tokenRepository{
		queries: New(db),
	}
}

func (r *tokenRepository) SetToken(ctx context.Context, token domain.GoogleToken) (*domain.GoogleToken, error) {
	var accessToken sql.NullString
	if token.AccessToken != nil && *token.AccessToken != "" {
		accessToken = sql.NullString{String: *token.AccessToken, Valid: true}
	}

	var refreshToken sql.NullString
	if token.RefreshToken != nil && *token.RefreshToken != "" {
		refreshToken = sql.NullString{String: *token.RefreshToken, Valid: true}
	}

	dbToken, err := r.queries.UpsertAuthToken(ctx, UpsertAuthTokenParams{
		UserID:       token.UserID,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    token.ExpiresAt,
	})
	if err != nil {
		return nil, err
	}

	return toDomainGoogleToken(dbToken), nil
}

func (r *tokenRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.GoogleToken, error) {
	dbToken, err := r.queries.GetAuthTokenByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainGoogleToken(dbToken), nil
}

func (r *tokenRepository) UpdateRefreshToken(ctx context.Context, userID uuid.UUID, refreshToken string) error {
	return r.queries.UpdateAuthTokenRefreshToken(ctx, UpdateAuthTokenRefreshTokenParams{
		UserID:       userID,
		RefreshToken: sql.NullString{String: refreshToken, Valid: true},
	})
}

func (r *tokenRepository) DeleteByUserID(ctx context.Context, userID uuid.UUID) error {
	return r.queries.DeleteAuthTokenByUserID(ctx, userID)
}

func (r *tokenRepository) DeleteExpired(ctx context.Context) error {
	return r.queries.DeleteExpiredAuthTokens(ctx)
}

func toDomainGoogleToken(dbToken GoogleToken) *domain.GoogleToken {
	token := &domain.GoogleToken{
		UserID:    dbToken.UserID,
		ExpiresAt: dbToken.ExpiresAt,
		CreatedAt: dbToken.CreatedAt,
	}

	if dbToken.AccessToken.Valid {
		token.AccessToken = &dbToken.AccessToken.String
	}

	if dbToken.RefreshToken.Valid {
		token.RefreshToken = &dbToken.RefreshToken.String
	}

	return token
}
