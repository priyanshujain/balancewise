package httperrors

import (
	"errors"
	"strings"
)

type Error struct {
	Code       string   `json:"code"`
	Message    string   `json:"message"`
	Fields     []string `json:"fields"`
	HttpStatus int      `json:"-"`
}

func (e Error) Error() string {
	return e.Message
}

func New(httpStatus int, code string, message string, fields ...string) Error {
	return Error{
		HttpStatus: httpStatus,
		Code:       code,
		Message:    message,
		Fields:     fields,
	}
}

func From(err error) Error {
	var e Error
	if ok := errors.As(err, &e); !ok {
		httpStatus := 400
		msg := ""
		if err != nil {
			msg = err.Error()
		}
		if err == nil {
			httpStatus = 200
		}
		if err != nil && (strings.Contains(strings.ToLower(msg), "internal") ||
			strings.Contains(err.Error(), "panic")) {
			httpStatus = 500
		}
		return Error{
			HttpStatus: httpStatus,
			Code:       "",
			Fields:     []string{},
			Message:    msg,
		}
	}
	return e
}
