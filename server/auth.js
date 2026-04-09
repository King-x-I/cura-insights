const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cura-secret-key-change-in-production';
const JWT_EXPIRY = '7d';

function generateToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      user_type: user.user_type,
      user_metadata: JSON.parse(user.user_metadata || '{}')
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Express middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    req.user = null;
    return next();
  }

  req.user = {
    id: decoded.sub,
    email: decoded.email,
    user_type: decoded.user_type,
    user_metadata: decoded.user_metadata || {}
  };
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

module.exports = { generateToken, verifyToken, authMiddleware, requireAuth, JWT_SECRET };
