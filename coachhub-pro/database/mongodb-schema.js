/**
 * CoachHub Pro - MongoDB Schema
 * Mongoose models for coaching marketplace
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ==================== USER SCHEMA ====================
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'coach', 'admin'],
    default: 'student'
  },
  avatar: String,
  bio: String,
  phone: String,
  timezone: {
    type: String,
    default: 'UTC'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: String,
  stripeAccountId: String, // For coaches receiving payments
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date
});

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// ==================== COACH PROFILE SCHEMA ====================
const CoachProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tagline: String,
  expertise: [{
    type: String // e.g., 'Business', 'Career', 'Life', 'Health', 'Fitness'
  }],
  certifications: [{
    name: String,
    issuer: String,
    year: Number,
    credentialUrl: String
  }],
  experience: {
    years: Number,
    description: String
  },
  languages: [String],
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  subscriptionTiers: [{
    name: {
      type: String,
      enum: ['Basic', 'Pro', 'Premium']
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    sessionsPerMonth: Number,
    sessionDuration: Number, // minutes
    features: [String],
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  availability: {
    monday: [String],    // ['09:00-12:00', '14:00-17:00']
    tuesday: [String],
    wednesday: [String],
    thursday: [String],
    friday: [String],
    saturday: [String],
    sunday: [String]
  },
  videoUrl: String, // Introduction video
  socialLinks: {
    linkedin: String,
    twitter: String,
    website: String
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    paid: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CoachProfileSchema.index({ userId: 1 });
CoachProfileSchema.index({ expertise: 1 });
CoachProfileSchema.index({ rating: -1 });
CoachProfileSchema.index({ isActive: 1, isFeatured: -1 });

// ==================== STUDENT PROFILE SCHEMA ====================
const StudentProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  interests: [String],
  goals: String,
  currentSubscriptions: [{
    type: Schema.Types.ObjectId,
    ref: 'Subscription'
  }],
  completedSessions: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  preferences: {
    sessionReminders: {
      type: Boolean,
      default: true
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

StudentProfileSchema.index({ userId: 1 });

// ==================== SUBSCRIPTION SCHEMA ====================
const SubscriptionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coachId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tier: {
    type: String,
    enum: ['Basic', 'Pro', 'Premium'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  stripeSubscriptionId: String,
  stripePaymentIntentId: String,
  sessionsPerMonth: Number,
  sessionsRemaining: Number,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  nextBillingDate: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  cancelledAt: Date,
  cancellationReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

SubscriptionSchema.index({ studentId: 1, status: 1 });
SubscriptionSchema.index({ coachId: 1, status: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 });
SubscriptionSchema.index({ nextBillingDate: 1 });

// ==================== SESSION SCHEMA ====================
const SessionSchema = new Schema({
  coachId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true // minutes
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['1-on-1', 'group', 'workshop'],
    default: '1-on-1'
  },
  meetingLink: String,
  meetingId: String,
  notes: {
    coach: String,
    student: String
  },
  recordingUrl: String,
  materials: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    createdAt: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

SessionSchema.index({ coachId: 1, scheduledAt: 1 });
SessionSchema.index({ studentId: 1, scheduledAt: 1 });
SessionSchema.index({ scheduledAt: 1, status: 1 });
SessionSchema.index({ subscriptionId: 1 });

// ==================== PAYMENT SCHEMA ====================
const PaymentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'paypal']
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  metadata: Schema.Types.Mixed,
  failureReason: String,
  refundedAmount: Number,
  refundedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
PaymentSchema.index({ status: 1 });

// ==================== REVIEW SCHEMA ====================
const ReviewSchema = new Schema({
  coachId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: String,
  isPublic: {
    type: Boolean,
    default: true
  },
  coachResponse: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ReviewSchema.index({ coachId: 1, createdAt: -1 });
ReviewSchema.index({ studentId: 1 });
ReviewSchema.index({ sessionId: 1 });

// ==================== NOTIFICATION SCHEMA ====================
const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'session_reminder',
      'session_cancelled',
      'session_rescheduled',
      'subscription_renewed',
      'subscription_cancelled',
      'payment_failed',
      'new_message',
      'new_review'
    ],
    required: true
  },
  title: String,
  message: String,
  link: String,
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// ==================== MESSAGE SCHEMA ====================
const MessageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, isRead: 1 });

// ==================== EXPORTS ====================
module.exports = {
  User: mongoose.model('User', UserSchema),
  CoachProfile: mongoose.model('CoachProfile', CoachProfileSchema),
  StudentProfile: mongoose.model('StudentProfile', StudentProfileSchema),
  Subscription: mongoose.model('Subscription', SubscriptionSchema),
  Session: mongoose.model('Session', SessionSchema),
  Payment: mongoose.model('Payment', PaymentSchema),
  Review: mongoose.model('Review', ReviewSchema),
  Notification: mongoose.model('Notification', NotificationSchema),
  Message: mongoose.model('Message', MessageSchema)
};
