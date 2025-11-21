package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/priyanshujain/balancewise/server/internal/authsvc/domain"
)

type userRepository struct {
	queries *Queries
}

func NewUserRepository(db *sql.DB) domain.UserRepository {
	return &userRepository{
		queries: New(db),
	}
}

func (r *userRepository) Create(ctx context.Context, user domain.User) (*domain.User, error) {
	var profilePic sql.NullString
	if user.ProfilePic != "" {
		profilePic = sql.NullString{String: user.ProfilePic, Valid: true}
	}

	dbUser, err := r.queries.CreateUser(ctx, CreateUserParams{
		Email:      user.Email,
		Name:       user.Name,
		ProfilePic: profilePic,
	})
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return nil, domain.ErrDuplicateKey
		}
		return nil, err
	}

	return toDomainUser(dbUser), nil
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	dbUser, err := r.queries.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainUser(dbUser), nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	dbUser, err := r.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainUser(dbUser), nil
}

func (r *userRepository) Update(ctx context.Context, id uuid.UUID, name *string, profilePic *string) (*domain.User, error) {
	var nameParam sql.NullString
	var profilePicParam sql.NullString

	if name != nil {
		nameParam = sql.NullString{String: *name, Valid: true}
	}
	if profilePic != nil {
		profilePicParam = sql.NullString{String: *profilePic, Valid: true}
	}

	dbUser, err := r.queries.UpdateUser(ctx, UpdateUserParams{
		ID:         id,
		Name:       nameParam,
		ProfilePic: profilePicParam,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainUser(dbUser), nil
}

func (r *userRepository) UpdateByEmail(ctx context.Context, email string, name *string, profilePic *string) (*domain.User, error) {
	var nameParam sql.NullString
	var profilePicParam sql.NullString

	if name != nil {
		nameParam = sql.NullString{String: *name, Valid: true}
	}
	if profilePic != nil {
		profilePicParam = sql.NullString{String: *profilePic, Valid: true}
	}

	dbUser, err := r.queries.UpdateUserByEmail(ctx, UpdateUserByEmailParams{
		Email:      email,
		Name:       nameParam,
		ProfilePic: profilePicParam,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainUser(dbUser), nil
}

func (r *userRepository) UpdateGDriveAllowed(ctx context.Context, id uuid.UUID, allowed bool) (*domain.User, error) {
	dbUser, err := r.queries.UpdateGDriveAllowed(ctx, UpdateGDriveAllowedParams{
		ID:            id,
		GdriveAllowed: allowed,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainUser(dbUser), nil
}

func toDomainUser(dbUser User) *domain.User {
	user := &domain.User{
		ID:            dbUser.ID,
		Email:         dbUser.Email,
		Name:          dbUser.Name,
		GDriveAllowed: dbUser.GdriveAllowed,
		CreatedAt:     dbUser.CreatedAt,
		UpdatedAt:     dbUser.UpdatedAt,
	}

	if dbUser.ProfilePic.Valid {
		user.ProfilePic = dbUser.ProfilePic.String
	}

	return user
}
