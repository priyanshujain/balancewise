package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AuthToken struct {
	ID           uuid.UUID
	UserID       uuid.UUID
	JWTToken     string
	RefreshToken *string
	ExpiresAt    time.Time
	CreatedAt    time.Time
}

type TokenRepository interface {
	Create(ctx context.Context, token AuthToken) (*AuthToken, error)
	GetByJWT(ctx context.Context, jwtToken string) (*AuthToken, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]AuthToken, error)
	UpdateRefreshToken(ctx context.Context, id uuid.UUID, refreshToken string) error
	Delete(ctx context.Context, id uuid.UUID) error
	DeleteByJWT(ctx context.Context, jwtToken string) error
	DeleteExpired(ctx context.Context) error
}
