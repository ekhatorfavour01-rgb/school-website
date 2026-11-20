'use strict';

const ApiError = require('../Utils/ApiError');

module.exports = (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl.split('?')[0]}`));
};