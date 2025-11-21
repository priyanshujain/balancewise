-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    profile_pic TEXT,
    gdrive_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Auth state table (for OAuth poll flow)
CREATE TABLE IF NOT EXISTS auth_state (
    state TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    authenticated BOOLEAN NOT NULL DEFAULT FALSE,
    auth_url TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_state_expires_at ON auth_state(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_state_authenticated ON auth_state(authenticated);

-- Google OAuth tokens table (stores Google access and refresh tokens, one per user)
CREATE TABLE IF NOT EXISTS google_tokens (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_tokens_expires_at ON google_tokens(expires_at);
