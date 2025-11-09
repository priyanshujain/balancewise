package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/priyanshujain/balancewise/server/internal/authapi"
	"github.com/priyanshujain/balancewise/server/internal/authsvc"
	"github.com/priyanshujain/balancewise/server/internal/authsvc/supporting/google"
	"github.com/priyanshujain/balancewise/server/internal/authsvc/supporting/postgres"
	"github.com/priyanshujain/balancewise/server/internal/config"
	"github.com/priyanshujain/balancewise/server/internal/dietapi"
	"github.com/priyanshujain/balancewise/server/internal/dietsvc"
	"github.com/priyanshujain/balancewise/server/internal/dietsvc/supporting/openai"
	"github.com/priyanshujain/balancewise/server/internal/generic/httplog"
	"github.com/priyanshujain/balancewise/server/internal/jwt"
)

func main() {
	// Setup structured logging
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	// Load configuration
	cfg, err := config.LoadFromEnv()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	slog.Info("server starting",
		"port", cfg.Port,
		"server_url", cfg.ServerURL,
		"db_host", cfg.Database.Host,
		"db_port", cfg.Database.Port,
		"db_name", cfg.Database.DBName,
	)

	// Create root context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize database
	dbConfig := postgres.Config{Config: cfg.Database}
	authDB, err := dbConfig.New(ctx)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer authDB.Close()

	slog.Info("database connection established")

	// Initialize repositories
	userRepo := postgres.NewUserRepository(authDB.DB())
	stateRepo := postgres.NewStateRepository(authDB.DB())
	tokenRepo := postgres.NewTokenRepository(authDB.DB())

	// Initialize Google OAuth service
	oauthService := google.NewOAuthService(google.Config{
		ClientID:     cfg.GoogleConfig.ClientID,
		ClientSecret: cfg.GoogleConfig.ClientSecret,
		RedirectURL:  cfg.ServerURL + "/auth/callback",
	})

	// Initialize JWT service
	jwtService := jwt.NewService(cfg.JWTSecret)

	// Initialize auth service
	authService := authsvc.NewService(authsvc.ServiceConfig{
		UserRepository:  userRepo,
		StateRepository: stateRepo,
		TokenRepository: tokenRepo,
		OAuthService:    oauthService,
		JWTService:      jwtService,
	})

	// Initialize OpenAI vision client
	visionClient := openai.NewVisionClient(cfg.OpenAIAPIKey)

	// Initialize diet service
	dietService := dietsvc.NewService(visionClient)

	// Initialize HTTP handlers
	authHandler := authapi.NewHandler(authService)
	dietHandler := dietapi.NewHandler(dietService)

	// Create main mux and mount handlers
	mux := http.NewServeMux()
	mux.Handle("/", authHandler)
	mux.Handle("/diet/", dietHandler)

	// Wrap with middleware
	handler := httplog.Middleware(cfg.HTTPLog)(mux)

	// Add panic recovery
	handler = recoveryMiddleware(handler)

	// Create HTTP server
	httpServer := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		BaseContext:  func(net.Listener) context.Context { return ctx },
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Setup error group for goroutines
	g, gCtx := errgroup.WithContext(ctx)

	// Start HTTP server
	g.Go(func() error {
		slog.Info("http server listening", "port", cfg.Port)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			return fmt.Errorf("http server error: %w", err)
		}
		return nil
	})

	// Start cleanup goroutine
	g.Go(func() error {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-gCtx.Done():
				return nil
			case <-ticker.C:
				slog.Info("running cleanup task")
				if err := authService.CleanupExpired(gCtx); err != nil {
					slog.Error("cleanup error", "error", err)
				}
			}
		}
	})

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	select {
	case <-gCtx.Done():
		slog.Info("context cancelled, shutting down")
	case sig := <-sigChan:
		slog.Info("received signal, shutting down", "signal", sig)
		cancel()
	}

	// Shutdown HTTP server
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		slog.Error("http server shutdown error", "error", err)
	}

	// Wait for all goroutines to finish
	if err := g.Wait(); err != nil {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped gracefully")
}

// recoveryMiddleware recovers from panics and logs them
func recoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("panic recovered",
					"panic", rec,
					"method", r.Method,
					"path", r.URL.Path,
				)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
