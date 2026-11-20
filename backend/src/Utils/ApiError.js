'use strict';

class ApiError extends Error {
    constructor(statusCode, message, options = {}) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = options.code;
        this.errors = options.errors;
        this.isOperational = true;
        if (Error.captureStackTrace)
            Error.captureStackTrace(this.constructor);
    }

static badRequest(message = 'Bad Request', options) {
    return new ApiError(400, message, options);
}

static unauthorized(message = 'Please log in to continue', options) {
    return new ApiError(401, message, options);
}

static forbidden(message = 'You do not have permission to do that', options) {
    return new ApiError(403, message, options);
}

static notFound(message = 'Not Found', options) {
    return new ApiError(404, message, options);
}

static conflict(message = 'This already exists', options) {
    return new ApiError(409, message, options);
}

static payloadTooLarge(message = 'This file is too large', options) {
    return new ApiError(413, message, options);
}

static unsupportedMedia(message = 'This file type is not allowed', options) {
    return new ApiError(415, message, options);
}

static unprocessable(message = 'Please check the form and try again', options) {
    return new ApiError(422, message, options);
}

static tooManyRequests(message = 'Too many requests, please try again later', options) {
    return new ApiError(429, message, options);
}

}

module.exports = ApiError;