package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID         uuid.UUID
	Email      string
	Name       string
	ProfilePic string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type UserRepository interface {
	Create(ctx context.Context, user User) (*User, error)
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	Update(ctx context.Context, id uuid.UUID, name *string, profilePic *string) (*User, error)
	UpdateByEmail(ctx context.Context, email string, name *string, profilePic *string) (*User, error)
}
