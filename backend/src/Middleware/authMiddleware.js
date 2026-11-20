'use strict';

const ApiError = require('../Utils/ApiError');
const asyncHandler = require('../Utils/asyncHandler');
const { verifyAccessToken } = require('../Utils/token');
const Admin = require('../Models/Admin');

const SESSION_EXPIRED = 'Your session has expired. Please log in again.';

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme && scheme.toLowerCase() === 'bearer' && token ? token : null;
}

/** Checks the token and loads the admin. Returns null when the token is missing or not valid. */
async function loadAdminFromRequest(req) {
  const token = readBearerToken(req);
  if (!token) return null;

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    return null; // fake, changed or expired token
  }

  const admin = await Admin.findById(decoded.sub).select('+passwordChangedAt');
  if (!admin || !admin.isActive) return null;
  if (admin.changedPasswordAfter(decoded.iat)) return null; // password changed: old tokens stop working
  return admin;
}

/** Use on routes only a logged-in admin may use. */
const protect = asyncHandler(async (req, res, next) => {
  const hadToken = Boolean(readBearerToken(req));
  const admin = await loadAdminFromRequest(req);
  if (!admin) {
    throw ApiError.unauthorized(hadToken ? SESSION_EXPIRED : 'Please log in to continue');
  }
  req.admin = admin;
  next();
});

/**
 * Use on routes anyone can read, where an admin sees a little more
 * (for example drafts). A bad token simply means "not an admin".
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const admin = await loadAdminFromRequest(req);
  if (admin) req.admin = admin;
  next();
});

/** Use after protect: only these roles may continue. */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return next(ApiError.forbidden('Only a main admin can do this'));
  }
  return next();
};

module.exports = { protect, optionalAuth, restrictTo, readBearerToken };