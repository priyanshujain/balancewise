package domain

import (
	"fmt"
	"net/http"

	"github.com/priyanshujain/balancewise/server/internal/generic/httperrors"
)

var (
	ErrNotFound = httperrors.New(
		http.StatusNotFound,
		"NOT_FOUND",
		"resource not found",
	)

	ErrDuplicateKey = httperrors.New(
		http.StatusConflict,
		"DUPLICATE_KEY",
		"resource already exists",
	)

	ErrInvalidState = httperrors.New(
		http.StatusBadRequest,
		"INVALID_STATE",
		"invalid or expired state",
	)

	ErrUnauthorized = httperrors.New(
		http.StatusUnauthorized,
		"UNAUTHORIZED",
		"unauthorized",
	)

	ErrInvalidToken = httperrors.New(
		http.StatusUnauthorized,
		"INVALID_TOKEN",
		"invalid or expired token",
	)

	ErrExpiredToken = httperrors.New(
		http.StatusUnauthorized,
		"EXPIRED_TOKEN",
		"token has expired",
	)
)

func WrapError(msg string, err error) error {
	return fmt.Errorf("%s: %w", msg, err)
}
