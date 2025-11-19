/**
 * Coach Service - Manages coach profiles and operations
 */

import { CoachProfile, User, Review } from '../../../database/mongodb-schema.js';
import { ApiError } from '../middleware/errorHandler.js';

export class CoachService {
  constructor(autonomousFramework) {
    this.framework = autonomousFramework;
  }

  async getAllCoaches(filters = {}) {
    const query = { isActive: true };

    if (filters.expertise) {
      query.expertise = { $in: [filters.expertise] };
    }

    if (filters.minRating) {
      query.rating = { $gte: parseFloat(filters.minRating) };
    }

    const coaches = await CoachProfile.find(query)
      .populate('userId', 'name email avatar')
      .sort({ isFeatured: -1, rating: -1 })
      .limit(filters.limit || 50);

    return coaches;
  }

  async getCoachById(coachId) {
    const coach = await CoachProfile.findOne({ userId: coachId })
      .populate('userId', 'name email avatar bio');

    if (!coach) {
      throw new ApiError('Coach not found', 404);
    }

    return coach;
  }

  async createCoachProfile(userId, profileData) {
    const existingProfile = await CoachProfile.findOne({ userId });
    if (existingProfile) {
      throw new ApiError('Coach profile already exists', 400);
    }

    const profile = new CoachProfile({
      userId,
      ...profileData
    });

    await profile.save();

    // Update user role
    await User.findByIdAndUpdate(userId, { role: 'coach' });

    return profile;
  }

  async updateCoachProfile(userId, updates) {
    const profile = await CoachProfile.findOneAndUpdate(
      { userId },
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!profile) {
      throw new ApiError('Coach profile not found', 404);
    }

    return profile;
  }

  async getCoachAnalytics(coachId) {
    const profile = await CoachProfile.findOne({ userId: coachId });

    return {
      totalStudents: profile.totalStudents,
      totalSessions: profile.totalSessions,
      rating: profile.rating,
      totalReviews: profile.totalReviews,
      earnings: profile.earnings
    };
  }
}
