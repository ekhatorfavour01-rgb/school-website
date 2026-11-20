'use strict';

const ApiError = require('../Utils/ApiError');

/** Turns zod's list of problems into [{ field, message }], one message per field. */
function formatIssues(issues, part) {
  const seen = new Set();
  const errors = [];
  issues.forEach((issue) => {
    const field = issue.path.length ? issue.path.join('.') : part;
    if (seen.has(field)) return;
    seen.add(field);
    errors.push({ field, message: issue.message });
  });
  return errors;
}

/**
 * Checks req.params, req.query and req.body against zod schemas.
 * On success the cleaned values are in req.valid.params / req.valid.query / req.valid.body.
 * Controllers read ONLY from req.valid, so unknown or dirty input never gets through.
 *
 *   router.post('/', validate({ body: createSchema }), controller.create);
 */
function validate(schemas = {}) {
  return (req, res, next) => {
    const errors = [];
    const valid = {};

    ['params', 'query', 'body'].forEach((part) => {
      const schema = schemas[part];
      if (!schema) return;
      const result = schema.safeParse(req[part] === undefined ? {} : req[part]);
      if (result.success) valid[part] = result.data;
      else errors.push(...formatIssues(result.error.issues, part));
    });

    if (errors.length) {
      return next(ApiError.unprocessable('Please check the form and try again', { errors }));
    }
    req.valid = { params: {}, query: {}, body: {}, ...valid };
    return next();
  };
}

module.exports = { validate, formatIssues };