package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type GoogleToken struct {
	UserID       uuid.UUID
	AccessToken  *string
	RefreshToken *string
	ExpiresAt    time.Time
	CreatedAt    time.Time
}

type GoogleTokenRepository interface {
	SetToken(ctx context.Context, token GoogleToken) (*GoogleToken, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*GoogleToken, error)
	UpdateRefreshToken(ctx context.Context, userID uuid.UUID, refreshToken string) error
	DeleteByUserID(ctx context.Context, userID uuid.UUID) error
	DeleteExpired(ctx context.Context) error
}
