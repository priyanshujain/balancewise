package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	googleOAuth2 "google.golang.org/api/oauth2/v2"
	"google.golang.org/api/option"
)

var (
	jwtSecret    = []byte(getEnv("JWT_SECRET", "your-secret-key-change-this-in-production"))
	port         = getEnv("PORT", "8080")
	serverURL    = getEnv("SERVER_URL", "http://localhost:8080")
	clientID     = getEnv("GOOGLE_CLIENT_ID", "")
	clientSecret = getEnv("GOOGLE_CLIENT_SECRET", "")
	stateStore   = NewStateStore()
	googleConfig *oauth2.Config
)

// AuthState represents the state of an authentication attempt
type AuthState struct {
	State         string    `json:"state"`
	Authenticated bool      `json:"authenticated"`
	User          *User     `json:"user,omitempty"`
	Token         string    `json:"token,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	ExpiresAt     time.Time `json:"expiresAt"`
}

// StateStore manages authentication states
type StateStore struct {
	mu     sync.RWMutex
	states map[string]*AuthState
}

func NewStateStore() *StateStore {
	store := &StateStore{
		states: make(map[string]*AuthState),
	}
	// Cleanup expired states every 5 minutes
	go store.cleanupExpiredStates()
	return store
}

func (s *StateStore) Create(state string) *AuthState {
	s.mu.Lock()
	defer s.mu.Unlock()

	authState := &AuthState{
		State:         state,
		Authenticated: false,
		CreatedAt:     time.Now(),
		ExpiresAt:     time.Now().Add(10 * time.Minute), // State expires in 10 minutes
	}
	s.states[state] = authState
	return authState
}

func (s *StateStore) Get(state string) (*AuthState, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	authState, exists := s.states[state]
	if !exists || time.Now().After(authState.ExpiresAt) {
		return nil, false
	}
	return authState, true
}

func (s *StateStore) Update(state string, user *User, token string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	authState, exists := s.states[state]
	if !exists || time.Now().After(authState.ExpiresAt) {
		return false
	}

	authState.Authenticated = true
	authState.User = user
	authState.Token = token
	return true
}

func (s *StateStore) Delete(state string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.states, state)
}

func (s *StateStore) cleanupExpiredStates() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for state, authState := range s.states {
			if now.After(authState.ExpiresAt) {
				delete(s.states, state)
			}
		}
		s.mu.Unlock()
	}
}

type InitiateRequest struct{}

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
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture,omitempty"`
}

type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: .env file not found, using environment variables")
	}

	// Re-read environment variables after loading .env
	clientID = getEnv("GOOGLE_CLIENT_ID", "")
	clientSecret = getEnv("GOOGLE_CLIENT_SECRET", "")
	serverURL = getEnv("SERVER_URL", "http://localhost:8080")
	port = getEnv("PORT", "8080")

	// Initialize Google OAuth2 config
	googleConfig = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  serverURL + "/auth/callback",
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	// Log configuration for debugging
	log.Printf("Server starting on port %s", port)
	log.Printf("Callback URL: %s/auth/callback", serverURL)
	log.Printf("Google Client ID: %s", clientID)
	if clientID == "" || clientSecret == "" {
		log.Fatal("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables")
	}

	http.HandleFunc("/auth/initiate", corsMiddleware(handleInitiate))
	http.HandleFunc("/auth/callback", handleCallback)
	http.HandleFunc("/auth/poll", corsMiddleware(handlePoll))
	http.HandleFunc("/auth/verify", corsMiddleware(handleVerifyToken))
	http.HandleFunc("/health", handleHealth)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func handleInitiate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Generate random state token
	state, err := generateRandomString(32)
	if err != nil {
		log.Printf("Failed to generate state: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Store state
	stateStore.Create(state)

	// Generate Google OAuth URL
	authURL := googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)

	response := InitiateResponse{
		AuthURL: authURL,
		State:   state,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)

	log.Printf("Initiated auth with state: %s", state)
}

func handleCallback(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	state := r.URL.Query().Get("state")
	code := r.URL.Query().Get("code")
	errorParam := r.URL.Query().Get("error")

	if errorParam != "" {
		log.Printf("OAuth error: %s", errorParam)
		http.Error(w, fmt.Sprintf("OAuth error: %s", errorParam), http.StatusBadRequest)
		return
	}

	if state == "" || code == "" {
		http.Error(w, "Missing state or code parameter", http.StatusBadRequest)
		return
	}

	// Verify state exists
	authState, exists := stateStore.Get(state)
	if !exists {
		http.Error(w, "Invalid or expired state", http.StatusBadRequest)
		return
	}
	slog.Info("Received callback", "state", state, "authState", authState)

	// Exchange code for token
	ctx := context.Background()
	token, err := googleConfig.Exchange(ctx, code)
	if err != nil {
		log.Printf("Failed to exchange code: %v", err)
		http.Error(w, "Failed to exchange authorization code", http.StatusInternalServerError)
		return
	}

	// Get user info from Google
	oauth2Service, err := googleOAuth2.NewService(ctx, option.WithTokenSource(googleConfig.TokenSource(ctx, token)))
	if err != nil {
		log.Printf("Failed to create oauth2 service: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	userInfo, err := oauth2Service.Userinfo.Get().Do()
	if err != nil {
		log.Printf("Failed to get user info: %v", err)
		http.Error(w, "Failed to get user info", http.StatusInternalServerError)
		return
	}

	// Create user object
	user := &User{
		ID:      userInfo.Id,
		Email:   userInfo.Email,
		Name:    userInfo.Name,
		Picture: userInfo.Picture,
	}

	// Generate JWT
	jwtToken, err := generateJWT(user.ID, user.Email, user.Name)
	if err != nil {
		log.Printf("Failed to generate JWT: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Update state as authenticated
	stateStore.Update(state, user, jwtToken)

	log.Printf("Successfully authenticated user: %s (state: %s)", user.Email, state)

	// Return a success page
	w.Header().Set("Content-Type", "text/html")
	fmt.Fprintf(w, `
		<!DOCTYPE html>
		<html>
		<head>
			<title>Authentication Successful</title>
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<style>
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
				.checkmark {
					font-size: 64px;
					color: #4CAF50;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="checkmark">✓</div>
				<h1>Authentication Successful!</h1>
				<p>You can now close this window and return to the app.</p>
			</div>
		</body>
		</html>
	`)
}

func handlePoll(w http.ResponseWriter, r *http.Request) {
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

	// Get state from store
	authState, exists := stateStore.Get(req.State)
	if !exists {
		response := PollResponse{
			Authenticated: false,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Check if authenticated
	if authState.Authenticated {
		response := PollResponse{
			Authenticated: true,
			Token:         authState.Token,
			User:          authState.User,
		}

		// Clean up state after successful poll
		stateStore.Delete(req.State)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	// Not authenticated yet
	response := PollResponse{
		Authenticated: false,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleVerifyToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get token from Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Missing authorization header", http.StatusUnauthorized)
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		http.Error(w, "Invalid authorization header format", http.StatusUnauthorized)
		return
	}

	// Parse and validate JWT
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Return user info
	response := map[string]interface{}{
		"valid": true,
		"user": map[string]string{
			"id":    claims.UserID,
			"email": claims.Email,
			"name":  claims.Name,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func generateJWT(userID, email, name string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Name:   name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour * 30)), // 30 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func generateRandomString(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes)[:length], nil
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

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
