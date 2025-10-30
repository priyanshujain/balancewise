-- name: CreateAuthToken :one
INSERT INTO auth_tokens (
    user_id,
    jwt_token,
    refresh_token,
    expires_at
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetAuthTokenByJWT :one
SELECT * FROM auth_tokens
WHERE jwt_token = $1;

-- name: GetAuthTokensByUserID :many
SELECT * FROM auth_tokens
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: DeleteExpiredAuthTokens :exec
DELETE FROM auth_tokens
WHERE expires_at < NOW();

-- name: DeleteAuthToken :exec
DELETE FROM auth_tokens
WHERE id = $1;

-- name: DeleteAuthTokenByJWT :exec
DELETE FROM auth_tokens
WHERE jwt_token = $1;
