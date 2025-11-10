/**
 * Session Service - Manages coaching sessions and scheduling
 */

import { Session, Subscription, Notification } from '../../../database/mongodb-schema.js';
import { ApiError } from '../middleware/errorHandler.js';

export class SessionService {
  constructor(autonomousFramework, io) {
    this.framework = autonomousFramework;
    this.io = io;
  }

  async createSession(studentId, coachId, subscriptionId, scheduledAt, duration) {
    // Verify subscription has sessions remaining
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || subscription.sessionsRemaining <= 0) {
      throw new ApiError('No sessions remaining in subscription', 400);
    }

    const session = new Session({
      studentId,
      coachId,
      subscriptionId,
      scheduledAt: new Date(scheduledAt),
      duration,
      status: 'scheduled',
      meetingLink: `https://meet.coachhub.pro/${Date.now()}`
    });

    await session.save();

    // Decrement sessions remaining
    subscription.sessionsRemaining -= 1;
    await subscription.save();

    // Notify both parties
    this.io.to(`user:${coachId}`).emit('session:booked', session);
    this.io.to(`user:${studentId}`).emit('session:confirmed', session);

    return session;
  }

  async getUserSessions(userId, role, filters = {}) {
    const query = role === 'coach' ? { coachId: userId } : { studentId: userId };

    if (filters.status) {
      query.status = filters.status;
    }

    return await Session.find(query)
      .populate('coachId studentId', 'name email avatar')
      .sort({ scheduledAt: -1 })
      .limit(filters.limit || 50);
  }

  async updateSessionStatus(sessionId, status, userId) {
    const session = await Session.findById(sessionId);

    if (!session) {
      throw new ApiError('Session not found', 404);
    }

    session.status = status;
    if (status === 'completed') {
      session.completedAt = new Date();
    }
    await session.save();

    return session;
  }

  async sendReminders() {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const sessions = await Session.find({
      scheduledAt: { $lte: oneHourFromNow, $gte: new Date() },
      status: 'scheduled',
      reminderSent: false
    });

    for (const session of sessions) {
      // Send notifications
      this.io.to(`user:${session.coachId}`).emit('session:reminder', session);
      this.io.to(`user:${session.studentId}`).emit('session:reminder', session);

      session.reminderSent = true;
      await session.save();
    }

    console.log(`📧 Sent ${sessions.length} session reminders`);
  }
}
