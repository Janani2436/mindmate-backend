// middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Get token from header
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token

      // Attach user info (excluding password) to the request object
      req.user = await User.findById(decoded.id).select('-password');
      return next(); // Proceed to next middleware/route handler
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token was found
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};
