package httplog

import (
	"bytes"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	statusCode int
	body       *bytes.Buffer
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	rw.body.Write(b)
	return rw.ResponseWriter.Write(b)
}

func Middleware(enabled bool) func(http.Handler) http.Handler {
	if !enabled {
		return func(h http.Handler) http.Handler { return h }
	}

	return func(h http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Capture request body
			var requestBody []byte
			var requestBodyLog string
			if r.Body != nil {
				requestBody, _ = io.ReadAll(r.Body)
				r.Body = io.NopCloser(bytes.NewBuffer(requestBody))

				if len(requestBody) > 1024 || r.Header.Get("Content-Type")[:19] == "multipart/form-data" {
					requestBodyLog = fmt.Sprintf("[%d bytes]", len(requestBody))
				} else {
					requestBodyLog = string(requestBody)
				}
			}

			// Wrap response writer to capture status and body
			rw := &responseWriter{
				ResponseWriter: w,
				statusCode:     http.StatusOK,
				body:           &bytes.Buffer{},
			}

			// Log request start
			slog.Info(fmt.Sprintf("%s %s started", r.Method, r.URL.Path),
				"remote_addr", r.RemoteAddr,
				"auth_header_present", r.Header.Get("Authorization") != "",
				"request_body", requestBodyLog,
			)

			h.ServeHTTP(rw, r)

			// Log response completion with timing
			duration := time.Since(start)
			slog.Info(fmt.Sprintf("%s %s completed %d in %dms",
				r.Method, r.URL.Path, rw.statusCode, duration.Milliseconds()),
				"response_body", rw.body.String(),
			)
		})
	}
}
