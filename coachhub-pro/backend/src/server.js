/**
 * CoachHub Pro - Backend API Server
 * Powered by Autonomous Robotics JavaScript Framework
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import Stripe from 'stripe';
import cron from 'cron';

// Import our autonomous framework
import { AutonomousRoboticsFramework } from '../../../frameworks/javascript/src/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import coachRoutes, { setCoachService } from './routes/coaches.js';
import studentRoutes, { setStudentService } from './routes/students.js';
import subscriptionRoutes, { setSubscriptionService } from './routes/subscriptions.js';
import sessionRoutes, { setSessionService } from './routes/sessions.js';
import paymentRoutes from './routes/payments.js';
import reviewRoutes from './routes/reviews.js';
import dashboardRoutes, { setServices as setDashboardServices } from './routes/dashboard.js';
import messageRoutes from './routes/messages.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

// Import services
import { CoachService } from './services/CoachService.js';
import { StudentService } from './services/StudentService.js';
import { SubscriptionService } from './services/SubscriptionService.js';
import { SessionService } from './services/SessionService.js';
import { MatchingOrchestrator } from './services/MatchingOrchestrator.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 8000;

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Stripe webhook - must be before express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle webhook events
    await subscriptionService.handleStripeWebhook(event);

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coachhub', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ==================== REDIS CONNECTION ====================
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis connected successfully'));

// ==================== INITIALIZE AUTONOMOUS FRAMEWORK ====================
let autonomousFramework;
let coachService;
let studentService;
let subscriptionService;
let sessionService;
let matchingOrchestrator;

const initializeAutonomousSystem = async () => {
  console.log('🤖 Initializing Autonomous Framework...');

  // Initialize the autonomous framework
  autonomousFramework = new AutonomousRoboticsFramework({
    mode: 'autonomous',
    evolutionRate: 'balanced',
    learningEnabled: true,
    autoDeployment: true
  });

  await autonomousFramework.initialize();

  // Initialize services with autonomous framework
  coachService = new CoachService(autonomousFramework);
  studentService = new StudentService(autonomousFramework);
  subscriptionService = new SubscriptionService(autonomousFramework, io, stripe);
  sessionService = new SessionService(autonomousFramework, io);
  matchingOrchestrator = new MatchingOrchestrator(
    autonomousFramework,
    coachService,
    studentService,
    io
  );

  // Start autonomous operations
  await autonomousFramework.start();

  console.log('✅ Autonomous system initialized and running');

  // Inject services into routes
  setCoachService(coachService);
  setStudentService(studentService);
  setSubscriptionService(subscriptionService);
  setSessionService(sessionService);
  setDashboardServices({ coachService, studentService, subscriptionService, sessionService });

  // Start matching orchestrator
  matchingOrchestrator.start();

  // Start cron jobs
  startCronJobs();
};

// ==================== CRON JOBS ====================
const startCronJobs = () => {
  // Check for subscription renewals every hour
  const renewalJob = new cron.CronJob('0 * * * *', async () => {
    console.log('🔄 Running subscription renewal check...');
    await subscriptionService.processRenewals();
  });
  renewalJob.start();

  // Send session reminders every 15 minutes
  const reminderJob = new cron.CronJob('*/15 * * * *', async () => {
    console.log('📧 Sending session reminders...');
    await sessionService.sendReminders();
  });
  reminderJob.start();

  // Process pending payments every 30 minutes
  const paymentJob = new cron.CronJob('*/30 * * * *', async () => {
    console.log('💳 Processing pending payments...');
    await subscriptionService.processPendingPayments();
  });
  paymentJob.start();

  console.log('✅ Cron jobs started');
};

// ==================== ROUTES ====================
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    autonomousSystem: autonomousFramework?.getStatus() || 'not initialized',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    redis: redisClient.isOpen ? 'connected' : 'disconnected'
  });
});

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/coaches', authMiddleware, coachRoutes);
app.use('/api/students', authMiddleware, studentRoutes);
app.use('/api/subscriptions', authMiddleware, subscriptionRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/reviews', authMiddleware, reviewRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);

// Autonomous system endpoints
app.post('/api/autonomous/match', authMiddleware, async (req, res, next) => {
  try {
    const matches = await matchingOrchestrator.findMatches(req.user.userId, req.body);
    res.json({ success: true, matches });
  } catch (error) {
    next(error);
  }
});

app.get('/api/autonomous/status', authMiddleware, (req, res) => {
  const status = autonomousFramework.getStatus();
  res.json({ success: true, status });
});

// Error handling
app.use(errorHandler);

// ==================== WEBSOCKET HANDLERS ====================
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join:dashboard', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined dashboard`);
  });

  socket.on('join:chat', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`User joined chat ${chatId}`);
  });

  socket.on('send:message', async (data) => {
    io.to(`chat:${data.chatId}`).emit('new:message', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Export io for use in services
export { io };

// ==================== START SERVER ====================
const startServer = async () => {
  try {
    // Connect to databases
    await connectDB();
    await redisClient.connect();

    // Initialize autonomous system
    await initializeAutonomousSystem();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         🎓 CoachHub Pro Backend Server 🎓           ║
║                                                       ║
║  Server:     http://localhost:${PORT}                  ║
║  Mode:       Autonomous                              ║
║  Framework:  JavaScript SDK                          ║
║  Database:   MongoDB                                 ║
║  Cache:      Redis                                   ║
║  Payments:   Stripe                                  ║
║  Real-time:  WebSockets                              ║
║                                                       ║
║  Status:     🟢 ONLINE & AUTONOMOUS                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (autonomousFramework) {
    await autonomousFramework.stop();
  }
  if (matchingOrchestrator) {
    matchingOrchestrator.stop();
  }
  await mongoose.connection.close();
  await redisClient.quit();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

export default app;
