'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const config = require('./Config/env');
const ApiError = require('./Utils/ApiError');
const routes = require('./routes');
const notFound = require('./Middleware/notFound');
const errorHandler = require('./Middleware/errorHandler');
const { apiLimiter } = require('./Middleware/rateLimiters');

const app = express();

app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', config.trustProxy);

// Security headers. Photos and PDFs may be shown on the school website, which lives on another address.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Only the school website and admin screens may call this API from a browser.
app.use(
  cors({
    origin(origin, callback) {
      // No origin means a tool like Postman, curl, or a server: allow it. Browsers always send one.
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, 'This website is not allowed to use the API', { code: 'CORS_NOT_ALLOWED' }));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

app.use(compression());
if (!config.isTest) app.use(morgan(config.isProd ? 'combined' : 'dev'));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(mongoSanitize()); // removes "$" and "." tricks from input
app.use(hpp()); // ?page=1&page=2 cannot confuse the filters

// Local file storage is served here. With Cloudinary, files are served by Cloudinary instead.
if (config.storage.driver === 'local') {
  app.use(
    '/uploads',
    express.static(config.storage.localDir, {
      maxAge: '7d',
      index: false,
      dotfiles: 'deny',
      setHeaders(res) {
        res.set('X-Content-Type-Options', 'nosniff');
      },
    })
  );
}

app.get('/', (req, res) => res.json({ success: true, data: { name: 'School API', docs: '/api/v1/health' } }));

app.use('/api/v1', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;