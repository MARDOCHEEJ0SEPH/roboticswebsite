/**
 * Student Service - Manages student profiles and operations
 */

import { StudentProfile, User } from '../../../database/mongodb-schema.js';
import { ApiError } from '../middleware/errorHandler.js';

export class StudentService {
  constructor(autonomousFramework) {
    this.framework = autonomousFramework;
  }

  async getStudentProfile(userId) {
    const profile = await StudentProfile.findOne({ userId })
      .populate('currentSubscriptions');

    if (!profile) {
      throw new ApiError('Student profile not found', 404);
    }

    return profile;
  }

  async createStudentProfile(userId, profileData) {
    const profile = new StudentProfile({
      userId,
      ...profileData
    });

    await profile.save();
    return profile;
  }

  async updateStudentProfile(userId, updates) {
    const profile = await StudentProfile.findOneAndUpdate(
      { userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      throw new ApiError('Student profile not found', 404);
    }

    return profile;
  }

  async getStudentAnalytics(userId) {
    const profile = await StudentProfile.findOne({ userId });

    return {
      completedSessions: profile.completedSessions,
      totalSpent: profile.totalSpent,
      activeSubscriptions: profile.currentSubscriptions.length
    };
  }
}
