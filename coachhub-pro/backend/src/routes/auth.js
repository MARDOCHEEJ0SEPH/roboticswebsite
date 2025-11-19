import express from 'express';
import bcrypt from 'bcryptjs';
import { User, CoachProfile, StudentProfile } from '../../../database/mongodb-schema.js';
import { generateToken } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      throw new ApiError('Email, password, and name are required', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError('User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      name,
      role: role || 'student'
    });

    await user.save();

    // Create profile based on role
    if (user.role === 'student') {
      const studentProfile = new StudentProfile({ userId: user._id });
      await studentProfile.save();
    }

    const token = generateToken(user._id, user.email, user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user._id, email: user.email, name: user.name, role: user.role }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError('Invalid credentials', 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.email, user.role);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, email: user.email, name: user.name, role: user.role }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
