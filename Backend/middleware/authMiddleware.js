const { verifyToken } = require('../utils/auth');

/**
 * Middleware to authenticate a user based on JWT
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: No token provided', code: 'NO_TOKEN' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid or expired token', code: 'INVALID_TOKEN' });
  }

  // Attach payload to request object
  req.user = decoded;
  next();
};

/**
 * Middleware to restrict access to specific roles
 * @param {Array|String} roles - Allowed roles (e.g., 'ADMIN' or ['ADMIN', 'OFFICER'])
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: No token provided', code: 'NO_TOKEN' });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: Insufficient permissions', code: 'FORBIDDEN_ROLE' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  requireRole
};
