-- name: UpsertAuthToken :one
INSERT INTO google_tokens (
    user_id,
    access_token,
    refresh_token,
    expires_at
) VALUES (
    $1, $2, $3, $4
) ON CONFLICT (user_id) DO UPDATE SET
    access_token = COALESCE(NULLIF($2, ''), google_tokens.access_token),
    refresh_token = COALESCE(NULLIF($3, ''), google_tokens.refresh_token),
    expires_at = $4
RETURNING *;

-- name: GetAuthTokenByUserID :one
SELECT * FROM google_tokens
WHERE user_id = $1;

-- name: DeleteExpiredAuthTokens :exec
DELETE FROM google_tokens
WHERE expires_at < NOW();

-- name: UpdateAuthTokenRefreshToken :exec
UPDATE google_tokens
SET refresh_token = $2
WHERE user_id = $1;

-- name: DeleteAuthTokenByUserID :exec
DELETE FROM google_tokens
WHERE user_id = $1;
