package domain

import "github.com/priyanshujain/balancewise/server/internal/generic/httperrors"

var (
	ErrImageTooLarge   = httperrors.New(400, "IMAGE_TOO_LARGE", "image size must not exceed 5MB")
	ErrInvalidImage    = httperrors.New(400, "INVALID_IMAGE", "image format not supported, please upload JPEG, PNG, or WebP")
	ErrAnalysisFailed  = httperrors.New(500, "ANALYSIS_FAILED", "failed to analyze food image")
	ErrNoImageProvided = httperrors.New(400, "NO_IMAGE_PROVIDED", "no image file provided")
)

func WrapError(msg string, err error) error {
	if err == nil {
		return nil
	}

	if _, ok := err.(*httperrors.Error); ok {
		return err
	}

	return httperrors.New(500, "INTERNAL_ERROR", msg+": "+err.Error())
}
