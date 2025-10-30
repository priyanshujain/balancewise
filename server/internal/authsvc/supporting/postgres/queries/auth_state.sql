-- name: CreateAuthState :one
INSERT INTO auth_state (
    state,
    auth_url,
    expires_at
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetAuthState :one
SELECT * FROM auth_state
WHERE state = $1;

-- name: UpdateAuthState :one
UPDATE auth_state
SET
    user_id = $2,
    authenticated = $3
WHERE state = $1
RETURNING *;

-- name: DeleteExpiredAuthStates :exec
DELETE FROM auth_state
WHERE expires_at < NOW();

-- name: DeleteAuthState :exec
DELETE FROM auth_state
WHERE state = $1;
