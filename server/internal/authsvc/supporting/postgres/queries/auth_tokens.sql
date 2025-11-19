-- name: UpsertAuthToken :one
INSERT INTO auth_tokens (
    user_id,
    refresh_token,
    expires_at
) VALUES (
    $1, $2, $3
) ON CONFLICT (user_id) DO UPDATE SET
    refresh_token = COALESCE(NULLIF($2, ''), auth_tokens.refresh_token),
    expires_at = $3
RETURNING *;

-- name: GetAuthTokenByUserID :one
SELECT * FROM auth_tokens
WHERE user_id = $1;

-- name: DeleteExpiredAuthTokens :exec
DELETE FROM auth_tokens
WHERE expires_at < NOW();

-- name: UpdateAuthTokenRefreshToken :exec
UPDATE auth_tokens
SET refresh_token = $2
WHERE user_id = $1;

-- name: DeleteAuthTokenByUserID :exec
DELETE FROM auth_tokens
WHERE user_id = $1;
