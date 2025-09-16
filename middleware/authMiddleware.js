import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware to protect routes:
 * - Verifies JWT token in Authorization header (Bearer token)
 * - Attaches authenticated user object to req.user (excluding sensitive fields)
 * - Responds with 401 Unauthorized on failure or missing token
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'Not authorized, token missing' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        error: isExpired ? 'Token expired, please login again' : 'Invalid token',
      });
    }

    // Fetch user by ID from decoded token, exclude sensitive fields
    const user = await User.findById(decoded.id).select('-password -__v');
    if (!user) {
      return res.status(401).json({ error: 'User not found, token invalid' });
    }

    // Optional: If user model includes "active" flag, uncomment below to enforce active accounts
    // if (!user.active) {
    //   return res.status(403).json({ error: 'User account is inactive' });
    // }

    req.user = user;

    next();
  } catch (error) {
    console.error(`[AuthMiddleware Error] Path: ${req.path}`, error);
    return res.status(401).json({ error: 'Authorization failed, please login again' });
  }
};

/**
 * Middleware factory to authorize roles:
 * - Accepts list of allowed roles
 * - Returns 403 Forbidden if user role not in allowed roles
 * - Assumes protect middleware was run before to set req.user
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      // This shouldn't happen if protect middleware is used
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden: insufficient permissions' });
    }

    next();
  };
};
