'use strict';

/**
 * Lets browsers and CDNs keep public content for a short time.
 * Anything an admin asks for (they may see drafts) is never cached.
 */
const cachePublic = (seconds = 60) => (req, res, next) => {
  res.vary('Authorization');
  if (req.headers.authorization) res.set('Cache-Control', 'private, no-store');
  else res.set('Cache-Control', `public, max-age=${seconds}`);
  next();
};

/** For responses that must never be stored. */
const noStore = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

module.exports = { cachePublic, noStore };