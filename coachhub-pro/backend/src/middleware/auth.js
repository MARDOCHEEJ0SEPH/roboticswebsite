import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'coachhub-secret-change-in-production';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const generateToken = (userId, email, role = 'student') => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '30d' });
};

export const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return next(new ApiError(`${role} access required`, 403));
  }
  next();
};
