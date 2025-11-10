package openai

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/priyanshujain/balancewise/server/internal/dietsvc/domain"
)

type VisionClient struct {
	client *openai.Client
}

func NewVisionClient(apiKey string) *VisionClient {
	client := openai.NewClient(option.WithAPIKey(apiKey))
	return &VisionClient{client: &client}
}

func (v *VisionClient) AnalyzeFood(ctx context.Context, imageData []byte, mimeType string) (*domain.DietAnalysis, error) {
	base64Image := base64.StdEncoding.EncodeToString(imageData)
	dataURL := fmt.Sprintf("data:%s;base64,%s", mimeType, base64Image)

	prompt := `Analyze this food image and provide nutritional estimates in JSON format.
Return ONLY a JSON object with these exact fields:
{
  "food_name": "Brief description of the food items",
  "calories": estimated total calories (number),
  "protein": estimated protein in grams (number),
  "fat": estimated fat in grams (number),
  "carbs": estimated carbohydrates in grams (number)
}

Provide your best estimates based on typical portion sizes. Do not include any explanation, only return the JSON object.`

	messages := []openai.ChatCompletionMessageParamUnion{
		openai.UserMessage([]openai.ChatCompletionContentPartUnionParam{
			openai.TextContentPart(prompt),
			openai.ImageContentPart(openai.ChatCompletionContentPartImageImageURLParam{
				URL: dataURL,
			}),
		}),
	}

	params := openai.ChatCompletionNewParams{
		Messages:            messages,
		Model:               openai.ChatModelGPT5Mini,
		MaxCompletionTokens: openai.Int(500),
	}

	response, err := v.client.Chat.Completions.New(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("openai api request failed: %w", err)
	}

	if len(response.Choices) == 0 {
		return nil, fmt.Errorf("no response from openai")
	}

	content := response.Choices[0].Message.Content

	var result struct {
		FoodName string  `json:"food_name"`
		Calories float64 `json:"calories"`
		Protein  float64 `json:"protein"`
		Fat      float64 `json:"fat"`
		Carbs    float64 `json:"carbs"`
	}

	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse openai response: %w", err)
	}

	return &domain.DietAnalysis{
		FoodName: result.FoodName,
		Calories: result.Calories,
		Protein:  result.Protein,
		Fat:      result.Fat,
		Carbs:    result.Carbs,
	}, nil
}
