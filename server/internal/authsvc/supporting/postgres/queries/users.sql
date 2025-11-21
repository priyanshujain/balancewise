-- name: CreateUser :one
INSERT INTO users (
    email,
    name,
    profile_pic
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: UpdateUser :one
UPDATE users
SET
    name = COALESCE(sqlc.narg('name'), name),
    profile_pic = COALESCE(sqlc.narg('profile_pic'), profile_pic),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;

-- name: UpdateUserByEmail :one
UPDATE users
SET
    name = COALESCE(sqlc.narg('name'), name),
    profile_pic = COALESCE(sqlc.narg('profile_pic'), profile_pic),
    updated_at = NOW()
WHERE email = sqlc.arg('email')
RETURNING *;

-- name: UpdateGDriveAllowed :one
UPDATE users
SET
    gdrive_allowed = sqlc.arg('gdrive_allowed'),
    updated_at = NOW()
WHERE id = sqlc.arg('id')
RETURNING *;
