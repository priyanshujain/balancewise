-- Migration: Rename auth_tokens to google_tokens and add access_token
-- Description: Rename table to clarify purpose, add Google OAuth access_token field

ALTER TABLE auth_tokens RENAME TO google_tokens;

ALTER INDEX IF EXISTS idx_auth_tokens_expires_at RENAME TO idx_google_tokens_expires_at;

ALTER TABLE google_tokens ADD COLUMN access_token TEXT;
