'use strict';

const { ZodError } = require('zod');
const config = require('../Config/env');
const logger = require('../Utils/logger');
const ApiError = require('../Utils/ApiError');
const { formatIssues } = require('./validate');

/** Turns any error we know about into an ApiError. Unknown errors stay as they are. */
function normalize(error) {
  if (error instanceof ApiError) return error;

  if (error instanceof ZodError) {
    return ApiError.unprocessable('Please check the form and try again', {
      errors: formatIssues(error.issues, 'body'),
    });
  }

  switch (error.name) {
    case 'ValidationError': {
      const errors = Object.values(error.errors || {}).map((item) => ({
        field: item.path,
        message: item.message,
      }));
      return ApiError.unprocessable('Please check the form and try again', { errors });
    }
    case 'CastError':
      return ApiError.badRequest(`Invalid value for "${error.path}"`);
    case 'TokenExpiredError':
      return ApiError.unauthorized('Your session has expired. Please log in again.');
    case 'JsonWebTokenError':
    case 'NotBeforeError':
      return ApiError.unauthorized('Please log in to continue');
    default:
      break;
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'value';
    return ApiError.conflict(`This ${field} is already in use`);
  }

  if (error.type === 'entity.parse.failed') return ApiError.badRequest('The request body is not valid JSON');
  if (error.type === 'entity.too.large') return ApiError.payloadTooLarge('The request is too large');
  if (error.message === 'CORS_NOT_ALLOWED') return ApiError.forbidden('This website is not allowed to use the API');

  return error;
}

// Express needs all four arguments to treat this as an error handler.
// eslint-disable-next-line no-unused-vars
module.exports = (error, req, res, next) => {
  const normalized = normalize(error);
  const isKnown = normalized instanceof ApiError;
  const statusCode = isKnown ? normalized.statusCode : 500;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode}: ${error.stack || error.message}`);
  }

  if (res.headersSent) return;

  const body = {
    success: false,
    message: isKnown ? normalized.message : config.isProd ? 'Something went wrong on our side' : error.message,
  };
  if (isKnown && normalized.code) body.code = normalized.code;
  if (isKnown && normalized.errors && normalized.errors.length) body.errors = normalized.errors;
  if (!config.isProd && !isKnown && error.stack) body.stack = error.stack;

  res.status(statusCode).json(body);
};