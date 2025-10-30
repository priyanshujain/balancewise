package postgres

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/priyanshujain/balancewise/server/internal/authsvc/domain"
)

type stateRepository struct {
	queries *Queries
}

func NewStateRepository(db *sql.DB) domain.StateRepository {
	return &stateRepository{
		queries: New(db),
	}
}

func (r *stateRepository) Create(ctx context.Context, state string, authURL string, expiresAt time.Time) (*domain.AuthState, error) {
	dbState, err := r.queries.CreateAuthState(ctx, CreateAuthStateParams{
		State:     state,
		AuthUrl:   sql.NullString{String: authURL, Valid: true},
		ExpiresAt: expiresAt,
	})
	if err != nil {
		return nil, err
	}

	return toDomainAuthState(dbState), nil
}

func (r *stateRepository) Get(ctx context.Context, state string) (*domain.AuthState, error) {
	dbState, err := r.queries.GetAuthState(ctx, state)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainAuthState(dbState), nil
}

func (r *stateRepository) Update(ctx context.Context, state string, userID uuid.UUID, authenticated bool) (*domain.AuthState, error) {
	dbState, err := r.queries.UpdateAuthState(ctx, UpdateAuthStateParams{
		State:         state,
		UserID:        uuid.NullUUID{UUID: userID, Valid: true},
		Authenticated: authenticated,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}

	return toDomainAuthState(dbState), nil
}

func (r *stateRepository) Delete(ctx context.Context, state string) error {
	return r.queries.DeleteAuthState(ctx, state)
}

func (r *stateRepository) DeleteExpired(ctx context.Context) error {
	return r.queries.DeleteExpiredAuthStates(ctx)
}

func toDomainAuthState(dbState AuthState) *domain.AuthState {
	state := &domain.AuthState{
		State:         dbState.State,
		Authenticated: dbState.Authenticated,
		ExpiresAt:     dbState.ExpiresAt,
		CreatedAt:     dbState.CreatedAt,
	}

	if dbState.UserID.Valid {
		state.UserID = &dbState.UserID.UUID
	}

	if dbState.AuthUrl.Valid {
		state.AuthURL = dbState.AuthUrl.String
	}

	return state
}
