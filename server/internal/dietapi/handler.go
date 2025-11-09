package dietapi

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/priyanshujain/balancewise/server/internal/dietsvc"
	"github.com/priyanshujain/balancewise/server/internal/dietsvc/domain"
	"github.com/priyanshujain/balancewise/server/internal/generic/httperrors"
)

type httpHandler struct {
	http.ServeMux
	svc *dietsvc.Service
}

type AnalyzeResponse struct {
	FoodName string  `json:"food_name"`
	Calories float64 `json:"calories"`
	Protein  float64 `json:"protein"`
	Fat      float64 `json:"fat"`
	Carbs    float64 `json:"carbs"`
}

func NewHandler(svc *dietsvc.Service) http.Handler {
	h := &httpHandler{
		svc: svc,
	}
	h.init()
	return h
}

func (h *httpHandler) init() {
	h.HandleFunc("/diet/analyze", corsMiddleware(h.handleAnalyze))
}

func (h *httpHandler) handleAnalyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Failed to parse multipart form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		httpErr := httperrors.From(domain.ErrNoImageProvided)
		w.WriteHeader(httpErr.HttpStatus)
		json.NewEncoder(w).Encode(httpErr)
		return
	}
	defer file.Close()

	imageData, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Failed to read image", http.StatusBadRequest)
		return
	}

	mimeType := header.Header.Get("Content-Type")

	ctx := r.Context()
	analysis, err := h.svc.AnalyzeFood(ctx, imageData, mimeType)
	if err != nil {
		slog.Error("failed to analyze food", "error", err)
		httpErr := httperrors.From(err)
		w.WriteHeader(httpErr.HttpStatus)
		json.NewEncoder(w).Encode(httpErr)
		return
	}

	response := AnalyzeResponse{
		FoodName: analysis.FoodName,
		Calories: analysis.Calories,
		Protein:  analysis.Protein,
		Fat:      analysis.Fat,
		Carbs:    analysis.Carbs,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)

	slog.Info("analyzed food image", "food", analysis.FoodName)
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
