const { verifyJWT } = require('../services/authService');
const User = require('../models/User');

/**
 * Authenticate middleware — validates Bearer JWT, attaches req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = verifyJWT(token);

    const user = await User.findById(decoded.userId).select('-accessToken');

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
