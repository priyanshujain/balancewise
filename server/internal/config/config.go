package config

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"github.com/priyanshujain/balancewise/server/internal/generic/postgresconfig"
)

type Config struct {
	Port         string
	ServerURL    string
	JWTSecret    string
	HTTPLog      bool
	OpenAIAPIKey string
	Database     postgresconfig.Config
	GoogleConfig GoogleConfig
}

type GoogleConfig struct {
	ClientID     string
	ClientSecret string
}

// LoadFromEnv loads configuration from environment variables and .env file
func LoadFromEnv() (*Config, error) {
	// Load .env file if it exists
	if err := loadEnvFile(".env"); err != nil {
		// .env file is optional, just log a warning
		fmt.Printf("Warning: .env file not found, using environment variables only\n")
	}

	cfg := &Config{
		Port:         getEnv("PORT", "8080"),
		ServerURL:    getEnv("SERVER_URL", "http://localhost:8080"),
		JWTSecret:    getEnv("JWT_SECRET", ""),
		HTTPLog:      getEnv("HTTP_LOG", "true") == "true",
		OpenAIAPIKey: getEnv("OPENAI_API_KEY", ""),
		Database: postgresconfig.Config{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvInt("DB_PORT", 5432),
			DBName:   getEnv("DB_NAME", "balancewise"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
		},
		GoogleConfig: GoogleConfig{
			ClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
			ClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		},
	}

	// Validate required fields
	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	if cfg.GoogleConfig.ClientID == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_ID is required")
	}
	if cfg.GoogleConfig.ClientSecret == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_SECRET is required")
	}
	if cfg.Database.Password == "" {
		return nil, fmt.Errorf("DB_PASSWORD is required")
	}
	if cfg.OpenAIAPIKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY is required")
	}

	return cfg, nil
}

// loadEnvFile loads environment variables from a .env file
func loadEnvFile(filename string) error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		// Parse KEY=VALUE
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		// Remove quotes if present
		value = strings.Trim(value, "\"'")

		// Only set if not already in environment
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}

	return scanner.Err()
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var intValue int
		if _, err := fmt.Sscanf(value, "%d", &intValue); err == nil {
			return intValue
		}
	}
	return defaultValue
}
