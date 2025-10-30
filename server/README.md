# BalanceWise Server

A clean architecture Go server for BalanceWise authentication service using Google OAuth 2.0.

## Architecture

The server follows clean architecture principles with the following layers:

```
cmd/                              # Application entry points
  └── main.go                     # Server bootstrap and wiring

internal/                         # Internal packages (unexported)
  ├── config/                     # Configuration management
  ├── authsvc/                    # Authentication service
  │   ├── service.go              # Business logic
  │   ├── domain/                 # Domain models & interfaces
  │   └── supporting/             # Infrastructure implementations
  │       ├── google/             # Google OAuth implementation
  │       └── postgres/           # PostgreSQL repositories
  ├── authapi/                    # HTTP handlers
  ├── jwt/                        # JWT utilities
  └── generic/                    # Shared utilities
      ├── postgresconfig/         # Database configuration
      ├── httperrors/             # Error handling
      └── httplog/                # HTTP logging middleware
```

## Features

- **Google OAuth 2.0**: Poll-based authentication flow
- **PostgreSQL**: Persistent storage using lib/pq driver for users, auth states, and tokens
- **JWT Tokens**: 30-day expiration with secure signing
- **Clean Architecture**: Domain-driven design with dependency injection
- **Type-Safe Queries**: SQLC-generated database code with database/sql
- **Structured Logging**: JSON logging with slog
- **Graceful Shutdown**: Context-based cancellation
- **Automatic Cleanup**: Background goroutine for expired states/tokens

## Database Schema

### Users Table
- Stores user profiles with email, name, and base64-encoded profile picture

### Auth State Table
- Manages OAuth flow state for poll-based authentication
- Automatically cleaned up after 10 minutes

### Auth Tokens Table
- Stores JWT tokens and refresh tokens
- Links tokens to users
- Supports token expiration

## Prerequisites

- Go 1.21+
- PostgreSQL 14+
- Google OAuth 2.0 credentials

## Setup

### 1. Database Setup

Create a PostgreSQL database:

```bash
createdb balancewise
```

Run migrations:

```bash
psql -U postgres -d balancewise -f migrations/001_init.sql
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `JWT_SECRET`: Secret key for JWT signing
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `DB_PASSWORD`: PostgreSQL password

### 3. Build

```bash
go build -o bin/server ./cmd/main.go
```

### 4. Run

```bash
./bin/server
```

Or directly:

```bash
go run ./cmd/main.go
```

## API Endpoints

### POST /auth/initiate
Initiates OAuth flow and returns auth URL and state.

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/...",
  "state": "random-state-token"
}
```

### GET /auth/callback
OAuth callback endpoint (called by Google). Returns HTML success page.

### POST /auth/poll
Polls for authentication completion.

**Request:**
```json
{
  "state": "random-state-token"
}
```

**Response:**
```json
{
  "authenticated": true,
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "base64-encoded-image"
  }
}
```

### GET /auth/verify
Verifies JWT token validity.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "base64-encoded-image"
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Development

### Generate SQLC Code

After modifying SQL queries:

```bash
sqlc generate
```

### Run Tests

```bash
go test ./...
```

### Code Organization

- **Domain Layer** (`domain/`): Pure Go interfaces and models, no external dependencies
- **Infrastructure Layer** (`supporting/`): Implementations of domain interfaces
- **Application Layer** (`service.go`): Business logic orchestration
- **API Layer** (`authapi/`): HTTP handlers and request/response models

## Configuration

All configuration is loaded from environment variables or `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | HTTP server port |
| `SERVER_URL` | `http://localhost:8080` | Server base URL |
| `JWT_SECRET` | - | JWT signing secret (required) |
| `GOOGLE_CLIENT_ID` | - | Google OAuth client ID (required) |
| `GOOGLE_CLIENT_SECRET` | - | Google OAuth client secret (required) |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `balancewise` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | - | Database password (required) |
| `HTTP_LOG` | `true` | Enable HTTP request/response logging |

## Logging

The server uses structured JSON logging with the following log levels:
- **Info**: Normal operations
- **Error**: Errors and failures
- **Warn**: Warnings

Logs include:
- Request/response details (when `HTTP_LOG=true`)
- Authentication events
- Database operations
- Cleanup operations

## Cleanup

Background goroutine runs every 5 minutes to:
- Delete expired auth states (> 10 minutes old)
- Delete expired auth tokens

## License

MIT
