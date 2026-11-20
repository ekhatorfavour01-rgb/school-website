'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../Config/env');
const ApiError = require('../Utils/ApiError');

const MINUTE = 60 * 1000;

function limiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: () => !config.rateLimit.enabled,
    handler: (req, res, next) => next(ApiError.tooManyRequests(message)),
  });
}

/** Everything under /api: a generous limit that only stops obvious abuse. */
const apiLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 600,
  message: 'Too many requests. Please slow down and try again in a few minutes.',
});

/** Login and password reset: slows down anyone guessing passwords. */
const authLimiter = limiter({
  windowMs: 15 * MINUTE,
  limit: 20,
  skipSuccessfulRequests: true,
  message: 'Too many attempts. Please wait 15 minutes and try again.',
});

/** Public forms (contact, admission, newsletter): stops spam floods. */
const formLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 15,
  message: 'You have sent too many forms. Please try again later.',
});

/** Payment confirmations and status checks. */
const paymentLimiter = limiter({
  windowMs: 60 * MINUTE,
  limit: 20,
  message: 'Too many payment requests. Please try again later.',
});

module.exports = { apiLimiter, authLimiter, formLimiter, paymentLimiter };