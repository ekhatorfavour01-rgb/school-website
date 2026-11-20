'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../Config/env');

const ISSUER = 'school-website-api';

/** Creates the login token an admin sends back with every request. */
function signAccessToken(adminId) {
  return jwt.sign({}, config.jwt.secret, {
    subject: String(adminId),
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256',
    issuer: ISSUER,
  });
}

/** Throws if the token is fake, changed or expired. */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'], issuer: ISSUER });
}

/** A random value for password reset links. Send the token, store only the hash. */
function createRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

module.exports = { signAccessToken, verifyAccessToken, createRandomToken, hashToken };