const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for a given user ID.
 * @param {string} userId - The MongoDB user _id
 * @returns {string} Signed JWT token
 */
function generateJWT(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifies and decodes a JWT token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws If token is invalid or expired
 */
function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateJWT, verifyJWT };
