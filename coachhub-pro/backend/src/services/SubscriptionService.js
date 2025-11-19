/**
 * Subscription Service
 * Manages subscription creation, billing, renewals with Stripe
 */

import { Subscription, Payment, CoachProfile, StudentProfile, User } from '../../../database/mongodb-schema.js';
import { ApiError } from '../middleware/errorHandler.js';

export class SubscriptionService {
  constructor(autonomousFramework, io, stripe) {
    this.framework = autonomousFramework;
    this.io = io;
    this.stripe = stripe;
  }

  /**
   * Create new subscription
   */
  async createSubscription(studentId, coachId, tierName) {
    try {
      console.log(`💳 Creating subscription: Student ${studentId} -> Coach ${coachId}, Tier: ${tierName}`);

      // Get coach profile and tier details
      const coachProfile = await CoachProfile.findOne({ userId: coachId });
      if (!coachProfile) {
        throw new ApiError('Coach not found', 404);
      }

      const tier = coachProfile.subscriptionTiers.find(t => t.name === tierName && t.isActive);
      if (!tier) {
        throw new ApiError('Subscription tier not available', 400);
      }

      // Get student user for Stripe customer
      const student = await User.findById(studentId);
      if (!student) {
        throw new ApiError('Student not found', 404);
      }

      // Create or get Stripe customer
      let stripeCustomerId = student.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          email: student.email,
          name: student.name,
          metadata: { userId: studentId.toString() }
        });
        stripeCustomerId = customer.id;
        student.stripeCustomerId = stripeCustomerId;
        await student.save();
      }

      // Create Stripe subscription
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price_data: {
            currency: tier.currency.toLowerCase(),
            product_data: {
              name: `${tierName} Coaching - ${coachProfile.userId}`,
              description: `Monthly coaching subscription - ${tier.sessionsPerMonth} sessions`
            },
            recurring: {
              interval: 'month'
            },
            unit_amount: tier.price * 100 // Convert to cents
          }
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          studentId: studentId.toString(),
          coachId: coachId.toString(),
          tier: tierName
        }
      });

      // Create subscription in database
      const subscription = new Subscription({
        studentId,
        coachId,
        tier: tierName,
        status: 'pending',
        price: tier.price,
        currency: tier.currency,
        stripeSubscriptionId: stripeSubscription.id,
        stripePaymentIntentId: stripeSubscription.latest_invoice.payment_intent.id,
        sessionsPerMonth: tier.sessionsPerMonth,
        sessionsRemaining: tier.sessionsPerMonth,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        nextBillingDate: new Date(stripeSubscription.current_period_end * 1000)
      });

      await subscription.save();

      // Update student profile
      await StudentProfile.findOneAndUpdate(
        { userId: studentId },
        { $push: { currentSubscriptions: subscription._id } }
      );

      // Return client secret for payment
      return {
        subscription,
        clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
      };

    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event) {
    console.log(`🎣 Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSucceeded(invoice) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (!subscription) {
      console.error('Subscription not found for invoice:', invoice.id);
      return;
    }

    // Update subscription status
    subscription.status = 'active';
    subscription.sessionsRemaining = subscription.sessionsPerMonth; // Reset sessions
    await subscription.save();

    // Record payment
    const payment = new Payment({
      userId: subscription.studentId,
      subscriptionId: subscription._id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'succeeded',
      paymentMethod: 'card',
      stripePaymentIntentId: invoice.payment_intent,
      stripeChargeId: invoice.charge
    });
    await payment.save();

    // Update student profile
    await StudentProfile.findOneAndUpdate(
      { userId: subscription.studentId },
      { $inc: { totalSpent: payment.amount } }
    );

    // Update coach earnings
    const platformFee = payment.amount * 0.15; // 15% platform fee
    const coachEarnings = payment.amount - platformFee;

    await CoachProfile.findOneAndUpdate(
      { userId: subscription.coachId },
      {
        $inc: {
          'earnings.total': coachEarnings,
          'earnings.pending': coachEarnings
        }
      }
    );

    // Send notifications
    this.io.to(`user:${subscription.studentId}`).emit('subscription:activated', {
      subscriptionId: subscription._id,
      message: 'Your subscription is now active!'
    });

    console.log(`✅ Payment succeeded for subscription ${subscription._id}`);
  }

  /**
   * Handle failed payment
   */
  async handlePaymentFailed(invoice) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (!subscription) return;

    // Mark subscription as past_due or cancelled
    subscription.status = 'expired';
    await subscription.save();

    // Record failed payment
    const payment = new Payment({
      userId: subscription.studentId,
      subscriptionId: subscription._id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'failed',
      failureReason: 'Payment failed'
    });
    await payment.save();

    // Notify student
    this.io.to(`user:${subscription.studentId}`).emit('payment:failed', {
      subscriptionId: subscription._id,
      message: 'Your payment failed. Please update your payment method.'
    });

    console.log(`❌ Payment failed for subscription ${subscription._id}`);
  }

  /**
   * Handle subscription updated
   */
  async handleSubscriptionUpdated(stripeSubscription) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (!subscription) return;

    subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    subscription.nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);
    subscription.status = stripeSubscription.status === 'active' ? 'active' : 'paused';

    await subscription.save();
  }

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(stripeSubscription) {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (!subscription) return;

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    // Remove from student's active subscriptions
    await StudentProfile.findOneAndUpdate(
      { userId: subscription.studentId },
      { $pull: { currentSubscriptions: subscription._id } }
    );

    console.log(`🚫 Subscription ${subscription._id} cancelled`);
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, userId, immediate = false) {
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      throw new ApiError('Subscription not found', 404);
    }

    if (subscription.studentId.toString() !== userId) {
      throw new ApiError('Unauthorized', 403);
    }

    // Cancel in Stripe
    if (immediate) {
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
    } else {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      subscription.cancelAtPeriodEnd = true;
    }

    await subscription.save();

    return subscription;
  }

  /**
   * Get all subscriptions for a user
   */
  async getUserSubscriptions(userId, role) {
    const query = role === 'coach' ? { coachId: userId } : { studentId: userId };

    return await Subscription.find(query)
      .populate('coachId studentId', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  /**
   * Process subscription renewals (called by cron)
   */
  async processRenewals() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const subscriptionsToRenew = await Subscription.find({
      status: 'active',
      nextBillingDate: { $lte: tomorrow }
    });

    console.log(`Found ${subscriptionsToRenew.length} subscriptions to renew`);

    // Stripe handles automatic billing, we just reset session counts
    for (const subscription of subscriptionsToRenew) {
      subscription.sessionsRemaining = subscription.sessionsPerMonth;
      await subscription.save();
    }
  }

  /**
   * Process pending payments
   */
  async processPendingPayments() {
    const pendingSubscriptions = await Subscription.find({ status: 'pending' });

    for (const subscription of pendingSubscriptions) {
      // Check if payment succeeded in Stripe
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      if (stripeSubscription.status === 'active') {
        subscription.status = 'active';
        await subscription.save();
      }
    }
  }

  /**
   * Use a session from subscription
   */
  async useSession(subscriptionId) {
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      throw new ApiError('Subscription not found', 404);
    }

    if (subscription.status !== 'active') {
      throw new ApiError('Subscription is not active', 400);
    }

    if (subscription.sessionsRemaining <= 0) {
      throw new ApiError('No sessions remaining', 400);
    }

    subscription.sessionsRemaining -= 1;
    await subscription.save();

    return subscription;
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats(userId, role) {
    const query = role === 'coach' ? { coachId: userId } : { studentId: userId };

    const [total, active, revenue] = await Promise.all([
      Subscription.countDocuments(query),
      Subscription.countDocuments({ ...query, status: 'active' }),
      Subscription.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ])
    ]);

    return {
      total,
      active,
      revenue: revenue[0]?.total || 0
    };
  }
}
