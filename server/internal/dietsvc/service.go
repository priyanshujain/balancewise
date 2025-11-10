package dietsvc

import (
	"context"
	"strings"

	"github.com/priyanshujain/balancewise/server/internal/dietsvc/domain"
	"github.com/priyanshujain/balancewise/server/internal/dietsvc/supporting/openai"
)

const maxImageSize = 5 * 1024 * 1024

type Service struct {
	visionClient *openai.VisionClient
}

func NewService(visionClient *openai.VisionClient) *Service {
	return &Service{
		visionClient: visionClient,
	}
}

func (s *Service) AnalyzeFood(ctx context.Context, imageData []byte, mimeType string) (*domain.DietAnalysis, error) {
	if len(imageData) > maxImageSize {
		return nil, domain.ErrImageTooLarge
	}

	if !isValidImageType(mimeType) {
		return nil, domain.ErrInvalidImage
	}

	analysis, err := s.visionClient.AnalyzeFood(ctx, imageData, mimeType)
	if err != nil {
		return nil, domain.WrapError("failed to analyze food image", err)
	}

	return analysis, nil
}

func isValidImageType(mimeType string) bool {
	validTypes := []string{
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/webp",
	}

	mimeType = strings.ToLower(mimeType)
	for _, validType := range validTypes {
		if mimeType == validType {
			return true
		}
	}

	return false
}
