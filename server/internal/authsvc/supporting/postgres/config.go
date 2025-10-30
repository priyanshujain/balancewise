package postgres

import (
	"context"
	"database/sql"

	"github.com/priyanshujain/balancewise/server/internal/generic/postgresconfig"
)

type Config struct {
	postgresconfig.Config
}

type AuthDB struct {
	db *sql.DB
	*Queries
}

func (c Config) New(ctx context.Context) (*AuthDB, error) {
	db, err := c.Init(ctx)
	if err != nil {
		return nil, err
	}

	return &AuthDB{
		db:      db,
		Queries: New(db),
	}, nil
}

func (db *AuthDB) DB() *sql.DB {
	return db.db
}

func (db *AuthDB) Close() error {
	return db.db.Close()
}
