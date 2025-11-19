/**
 * Authentication Middleware
 */

import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'roboguard-secret-key-change-in-production';

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

export const generateToken = (userId, email, role = 'user') => {
  return jwt.sign(
    {
      userId,
      email,
      role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new ApiError('Admin access required', 403));
  }
  next();
};
