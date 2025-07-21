// middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract token
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Attach user to request (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists.' });
      }

      next(); // ✅ Proceed to the protected route
    } catch (error) {
      console.error('❌ JWT Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
  }

  // 5. If no token was provided
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }
};
