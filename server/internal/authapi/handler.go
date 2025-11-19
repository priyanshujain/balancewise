package authapi

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/priyanshujain/balancewise/server/internal/authsvc"
	"github.com/priyanshujain/balancewise/server/internal/generic/httperrors"
	"github.com/priyanshujain/balancewise/server/internal/jwt"
)

type httpHandler struct {
	http.ServeMux
	svc *authsvc.Service
}

type InitiateResponse struct {
	AuthURL string `json:"authUrl"`
	State   string `json:"state"`
}

type PollRequest struct {
	State string `json:"state"`
}

type PollResponse struct {
	Authenticated bool   `json:"authenticated"`
	Token         string `json:"token,omitempty"`
	User          *User  `json:"user,omitempty"`
}

type User struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture,omitempty"`
	GDriveAllowed bool   `json:"gdrive_allowed"`
}

type VerifyResponse struct {
	Valid bool  `json:"valid"`
	User  *User `json:"user,omitempty"`
}

type HealthResponse struct {
	Status string `json:"status"`
}

func NewHandler(svc *authsvc.Service) http.Handler {
	h := &httpHandler{
		svc: svc,
	}
	h.init()
	return h
}

func (h *httpHandler) init() {
	h.HandleFunc("/auth/initiate", corsMiddleware(h.handleInitiate))
	h.HandleFunc("/auth/callback", h.handleCallback)
	h.HandleFunc("/auth/poll", corsMiddleware(h.handlePoll))
	h.HandleFunc("/auth/verify", corsMiddleware(h.handleVerifyToken))
	h.HandleFunc("/auth/profile", corsMiddleware(h.handleProfile))
	h.HandleFunc("/auth/request-drive-permission", corsMiddleware(h.handleRequestDrivePermission))
	h.HandleFunc("/auth/callback-drive", h.handleDriveCallback)
	h.HandleFunc("/health", h.handleHealth)
}

func (h *httpHandler) handleInitiate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()
	authURL, state, err := h.svc.InitiateAuth(ctx)
	if err != nil {
		httpErr := httperrors.From(err)
		w.WriteHeader(httpErr.HttpStatus)
		json.NewEncoder(w).Encode(httpErr)
		return
	}

	response := InitiateResponse{
		AuthURL: authURL,
		State:   state,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)

	slog.Info("initiated auth", "state", state)
}

func (h *httpHandler) handleCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	code := r.URL.Query().Get("code")
	errorParam := r.URL.Query().Get("error")

	if errorParam != "" {
		slog.Error("oauth error", "error", errorParam)
		http.Error(w, fmt.Sprintf("OAuth error: %s", errorParam), http.StatusBadRequest)
		return
	}

	if state == "" || code == "" {
		http.Error(w, "Missing state or code parameter", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	user, _, err := h.svc.HandleCallback(ctx, state, code)
	if err != nil {
		slog.Error("callback error", "error", err)
		httpErr := httperrors.From(err)
		http.Error(w, httpErr.Message, httpErr.HttpStatus)
		return
	}

	slog.Info("successfully authenticated user", "email", user.Email, "state", state)

	// Return success HTML page
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprintf(w, `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Authentication Successful</title>
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
					display: flex;
					justify-content: center;
					align-items: center;
					min-height: 100vh;
					margin: 0;
				}
				.container {
					background: white;
					padding: 2rem;
					border-radius: 10px;
					box-shadow: 0 10px 40px rgba(0,0,0,0.1);
					text-align: center;
					max-width: 400px;
				}
				h1 {
					color: #333;
					margin-bottom: 1rem;
				}
				p {
					color: #666;
					margin-bottom: 1.5rem;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<h1>Authentication Successful!</h1>
				<p>You can now close this window and return to the app.</p>
			</div>
		</body>
		</html>
	`)
}

func (h *httpHandler) handlePoll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PollRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.State == "" {
		http.Error(w, "State is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	authenticated, user, token, err := h.svc.PollAuth(ctx, req.State)
	if err != nil {
		httpErr := httperrors.From(err)
		w.WriteHeader(httpErr.HttpStatus)
		json.NewEncoder(w).Encode(httpErr)
		return
	}

	response := PollResponse{
		Authenticated: authenticated,
	}

	if authenticated && user != nil {
		response.Token = token
		response.User = &User{
			ID:            user.ID.String(),
			Email:         user.Email,
			Name:          user.Name,
			Picture:       user.ProfilePic,
			GDriveAllowed: user.GDriveAllowed,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (h *httpHandler) handleVerifyToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	authHeader := r.Header.Get("Authorization")
	tokenString, err := jwt.ExtractToken(authHeader)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	user, err := h.svc.VerifyToken(ctx, tokenString)
	if err != nil {
		httpErr := httperrors.From(err)
		http.Error(w, httpErr.Message, httpErr.HttpStatus)
		return
	}

	response := VerifyResponse{
		Valid: true,
		User: &User{
			ID:            user.ID.String(),
			Email:         user.Email,
			Name:          user.Name,
			Picture:       user.ProfilePic,
			GDriveAllowed: user.GDriveAllowed,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (h *httpHandler) handleProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	authHeader := r.Header.Get("Authorization")
	tokenString, err := jwt.ExtractToken(authHeader)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	user, err := h.svc.VerifyToken(ctx, tokenString)
	if err != nil {
		httpErr := httperrors.From(err)
		http.Error(w, httpErr.Message, httpErr.HttpStatus)
		return
	}

	response := &User{
		ID:            user.ID.String(),
		Email:         user.Email,
		Name:          user.Name,
		Picture:       user.ProfilePic,
		GDriveAllowed: user.GDriveAllowed,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func (h *httpHandler) handleRequestDrivePermission(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	authHeader := r.Header.Get("Authorization")
	tokenString, err := jwt.ExtractToken(authHeader)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	ctx := r.Context()
	user, err := h.svc.VerifyToken(ctx, tokenString)
	if err != nil {
		httpErr := httperrors.From(err)
		http.Error(w, httpErr.Message, httpErr.HttpStatus)
		return
	}

	authURL, state, err := h.svc.InitiateDriveAuth(ctx, user.ID)
	if err != nil {
		httpErr := httperrors.From(err)
		w.WriteHeader(httpErr.HttpStatus)
		json.NewEncoder(w).Encode(httpErr)
		return
	}

	response := InitiateResponse{
		AuthURL: authURL,
		State:   state,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)

	slog.Info("initiated Drive permission request", "state", state, "user_id", user.ID)
}

func (h *httpHandler) handleDriveCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	code := r.URL.Query().Get("code")
	errorParam := r.URL.Query().Get("error")

	if errorParam != "" {
		slog.Error("Drive oauth error", "error", errorParam)
		http.Error(w, fmt.Sprintf("OAuth error: %s", errorParam), http.StatusBadRequest)
		return
	}

	if state == "" || code == "" {
		http.Error(w, "Missing state or code parameter", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	user, err := h.svc.HandleDriveCallback(ctx, state, code)
	if err != nil {
		slog.Error("Drive callback error", "error", err)
		httpErr := httperrors.From(err)
		http.Error(w, httpErr.Message, httpErr.HttpStatus)
		return
	}

	slog.Info("successfully granted Drive permissions", "email", user.Email, "user_id", user.ID)

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprintf(w, `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Drive Permission Granted</title>
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
					display: flex;
					justify-content: center;
					align-items: center;
					min-height: 100vh;
					margin: 0;
				}
				.container {
					background: white;
					padding: 2rem;
					border-radius: 10px;
					box-shadow: 0 10px 40px rgba(0,0,0,0.1);
					text-align: center;
					max-width: 400px;
				}
				h1 {
					color: #333;
					margin-bottom: 1rem;
				}
				p {
					color: #666;
					margin-bottom: 1.5rem;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<h1>Drive Permission Granted!</h1>
				<p>You can now upload files to Google Drive. You can close this window and return to the app.</p>
			</div>
		</body>
		</html>
	`)
}

func (h *httpHandler) handleHealth(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status: "ok",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// ApiHandlerFunc is a generic handler wrapper for consistent error handling
func ApiHandlerFunc[T any, R any](handler func(context.Context, T) (R, error)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		var request T
		if r.Method == http.MethodPost && r.Body != nil {
			if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
				http.Error(w, "Invalid JSON", http.StatusBadRequest)
				return
			}
		}

		response, err := handler(ctx, request)
		if err != nil {
			slog.Error("error in api handler", "path", r.URL, "err", err)
			httpError := httperrors.From(err)
			w.WriteHeader(httpError.HttpStatus)
			_ = json.NewEncoder(w).Encode(httpError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(response)
	}
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
