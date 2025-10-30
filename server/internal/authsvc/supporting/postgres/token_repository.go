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

func NewTokenRepository(db *sql.DB) domain.TokenRepository {
	return &tokenRepository{
		queries: New(db),
	}
}

func (r *tokenRepository) Create(ctx context.Context, token domain.AuthToken) (*domain.AuthToken, error) {
	var refreshToken sql.NullString
	if token.RefreshToken != nil {
		refreshToken = sql.NullString{String: *token.RefreshToken, Valid: true}
	}

	dbToken, err := r.queries.CreateAuthToken(ctx, CreateAuthTokenParams{
		UserID:       token.UserID,
		JwtToken:     token.JWTToken,
		RefreshToken: refreshToken,
		ExpiresAt:    token.ExpiresAt,
	})
	if err != nil {
		return nil, err
	}

	return toDomainAuthToken(dbToken), nil
}

func (r *tokenRepository) GetByJWT(ctx context.Context, jwtToken string) (*domain.AuthToken, error) {
	dbToken, err := r.queries.GetAuthTokenByJWT(ctx, jwtToken)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainAuthToken(dbToken), nil
}

func (r *tokenRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]domain.AuthToken, error) {
	dbTokens, err := r.queries.GetAuthTokensByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	tokens := make([]domain.AuthToken, len(dbTokens))
	for i, dbToken := range dbTokens {
		tokens[i] = *toDomainAuthToken(dbToken)
	}

	return tokens, nil
}

func (r *tokenRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteAuthToken(ctx, id)
}

func (r *tokenRepository) DeleteByJWT(ctx context.Context, jwtToken string) error {
	return r.queries.DeleteAuthTokenByJWT(ctx, jwtToken)
}

func (r *tokenRepository) DeleteExpired(ctx context.Context) error {
	return r.queries.DeleteExpiredAuthTokens(ctx)
}

func toDomainAuthToken(dbToken AuthToken) *domain.AuthToken {
	token := &domain.AuthToken{
		ID:        dbToken.ID,
		UserID:    dbToken.UserID,
		JWTToken:  dbToken.JwtToken,
		ExpiresAt: dbToken.ExpiresAt,
		CreatedAt: dbToken.CreatedAt,
	}

	if dbToken.RefreshToken.Valid {
		token.RefreshToken = &dbToken.RefreshToken.String
	}

	return token
}
