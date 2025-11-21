-- Migration: Simplify auth_tokens table
-- Description: Remove id and jwt_token columns, make user_id primary key

DROP INDEX IF EXISTS idx_auth_tokens_user_id;
DROP INDEX IF EXISTS idx_auth_tokens_jwt_token;
DROP INDEX IF EXISTS idx_auth_tokens_expires_at;

DROP TABLE IF EXISTS auth_tokens;

CREATE TABLE auth_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);
