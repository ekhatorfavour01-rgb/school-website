'use strict';

/**
 * Reads and checks every setting from the environment (.env file) once, at start-up.
 * If something is missing or wrong, the app stops immediately with a clear message
 * instead of failing later in a confusing way.
 */
const path = require('path');
require('dotenv').config();
const { z } = require('zod');

const flag = (defaultValue) =>
  z.preprocess((value) => {
    if (value === undefined || value === '') return defaultValue;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
  }, z.boolean());

const blankToUndefined = (value) => (value === '' ? undefined : value);

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_EXPIRES_IN: z.string().min(1).default('8h'),
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

    CLIENT_URL: z.string().default('http://localhost:5500,http://127.0.0.1:5500'),
    ADMIN_APP_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
    PUBLIC_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),

    STORAGE_DRIVER: z.enum(['local', 'cloudinary']).default('local'),
    CLOUDINARY_CLOUD_NAME: z.preprocess(blankToUndefined, z.string().optional()),
    CLOUDINARY_API_KEY: z.preprocess(blankToUndefined, z.string().optional()),
    CLOUDINARY_API_SECRET: z.preprocess(blankToUndefined, z.string().optional()),
    CLOUDINARY_FOLDER: z.string().default('school-website'),
    MAX_UPLOAD_MB: z.coerce.number().min(0.1).max(25).default(5),

    SMTP_HOST: z.preprocess(blankToUndefined, z.string().optional()),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: flag(false),
    SMTP_USER: z.preprocess(blankToUndefined, z.string().optional()),
    SMTP_PASS: z.preprocess(blankToUndefined, z.string().optional()),
    EMAIL_FROM: z.string().default('School Website <no-reply@example.com>'),
    SCHOOL_NOTIFY_EMAIL: z.preprocess(blankToUndefined, z.string().email().optional()),

    RATE_LIMIT_ENABLED: flag(true),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER === 'cloudinary') {
      ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach((key) => {
        if (!env[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when STORAGE_DRIVER=cloudinary`,
          });
        }
      });
    }
    if (env.NODE_ENV === 'production') {
      if (/change-me|secret|password/i.test(env.JWT_SECRET)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'JWT_SECRET looks like a placeholder. Generate a real random one for production',
        });
      }
      if (env.BCRYPT_ROUNDS < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['BCRYPT_ROUNDS'],
          message: 'BCRYPT_ROUNDS must be at least 10 in production',
        });
      }
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`);
  throw new Error(`Invalid environment configuration. Fix your .env file:\n${lines.join('\n')}`);
}

const env = parsed.data;
const corsOrigins = env.CLIENT_URL.split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

module.exports = Object.freeze({
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  isDev: env.NODE_ENV === 'development',
  port: env.PORT,
  mongoUri: env.MONGODB_URI,
  jwt: Object.freeze({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN }),
  bcryptRounds: env.BCRYPT_ROUNDS,
  corsOrigins,
  adminAppUrl: env.ADMIN_APP_URL || `${corsOrigins[0] || 'http://localhost:5500'}/admin`,
  publicUrl: (env.PUBLIC_URL || `http://localhost:${env.PORT}`).replace(/\/+$/, ''),
  trustProxy: env.TRUST_PROXY,
  storage: Object.freeze({
    driver: env.STORAGE_DRIVER,
    localDir: path.join(__dirname, '..', '..', 'uploads'),
    cloudinary: Object.freeze({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
      folder: env.CLOUDINARY_FOLDER,
    }),
  }),
  uploads: Object.freeze({ maxBytes: Math.round(env.MAX_UPLOAD_MB * 1024 * 1024), maxMb: env.MAX_UPLOAD_MB }),
  smtp: Object.freeze({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  }),
  email: Object.freeze({ from: env.EMAIL_FROM, notifyTo: env.SCHOOL_NOTIFY_EMAIL }),
  rateLimit: Object.freeze({ enabled: env.RATE_LIMIT_ENABLED }),
});