package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AuthToken struct {
	UserID       uuid.UUID
	RefreshToken *string
	ExpiresAt    time.Time
	CreatedAt    time.Time
}

type TokenRepository interface {
	Upsert(ctx context.Context, token AuthToken) (*AuthToken, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*AuthToken, error)
	UpdateRefreshToken(ctx context.Context, userID uuid.UUID, refreshToken string) error
	DeleteByUserID(ctx context.Context, userID uuid.UUID) error
	DeleteExpired(ctx context.Context) error
}
