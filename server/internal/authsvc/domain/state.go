package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AuthState struct {
	State         string
	UserID        *uuid.UUID
	Authenticated bool
	AuthURL       string
	ExpiresAt     time.Time
	CreatedAt     time.Time
}

type StateRepository interface {
	Create(ctx context.Context, state string, authURL string, expiresAt time.Time) (*AuthState, error)
	Get(ctx context.Context, state string) (*AuthState, error)
	Update(ctx context.Context, state string, userID uuid.UUID, authenticated bool) (*AuthState, error)
	Delete(ctx context.Context, state string) error
	DeleteExpired(ctx context.Context) error
}
