/**
 * Authentication Routes
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../../../database/mongodb-schema.js';
import { generateToken } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    // Validate input
    if (!email || !password || !name) {
      throw new ApiError('Email, password, and name are required', 400);
    }

    if (password.length < 8) {
      throw new ApiError('Password must be at least 8 characters', 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError('User already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'user'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.email, user.role);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/demo
 * Generate demo token for testing
 */
router.post('/demo', async (req, res, next) => {
  try {
    // Create or find demo user
    let demoUser = await User.findOne({ email: 'demo@roboguard.com' });

    if (!demoUser) {
      const hashedPassword = await bcrypt.hash('demo1234', 10);
      demoUser = new User({
        email: 'demo@roboguard.com',
        password: hashedPassword,
        name: 'Demo User',
        role: 'admin'
      });
      await demoUser.save();
    }

    // Generate token
    const token = generateToken(demoUser._id, demoUser.email, demoUser.role);

    res.json({
      success: true,
      message: 'Demo account created/accessed',
      data: {
        token,
        user: {
          id: demoUser._id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
