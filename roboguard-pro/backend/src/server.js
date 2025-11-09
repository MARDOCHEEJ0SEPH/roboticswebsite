/**
 * RoboGuard Pro - Backend API Server
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

// Import our autonomous framework
import { AutonomousRoboticsFramework } from '../../../frameworks/javascript/src/index.js';

// Import routes
import robotRoutes, { setRobotService } from './routes/robots.js';
import threatRoutes, { setThreatService } from './routes/threats.js';
import patrolRoutes from './routes/patrols.js';
import dashboardRoutes, { setServices } from './routes/dashboard.js';
import authRoutes from './routes/auth.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';

// Import services
import { RobotService } from './services/RobotService.js';
import { ThreatDetectionService } from './services/ThreatDetectionService.js';
import { AutonomousOrchestrator } from './services/AutonomousOrchestrator.js';

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

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roboguard', {
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
let robotService;
let threatDetectionService;
let autonomousOrchestrator;

const initializeAutonomousSystem = async () => {
  console.log('🤖 Initializing Autonomous Framework...');

  // Initialize the autonomous framework
  autonomousFramework = new AutonomousRoboticsFramework({
    mode: 'autonomous',
    evolutionRate: 'aggressive',
    learningEnabled: true,
    autoDeployment: true
  });

  await autonomousFramework.initialize();

  // Initialize services with autonomous framework
  robotService = new RobotService(autonomousFramework);
  threatDetectionService = new ThreatDetectionService(autonomousFramework);
  autonomousOrchestrator = new AutonomousOrchestrator(
    autonomousFramework,
    robotService,
    threatDetectionService,
    io
  );

  // Start autonomous operations
  await autonomousFramework.start();

  console.log('✅ Autonomous system initialized and running');

  // Inject services into routes
  setRobotService(robotService);
  setThreatService(threatDetectionService);
  setServices({ robotService, threatService: threatDetectionService });

  // Start autonomous orchestration
  autonomousOrchestrator.start();
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
app.use('/api/robots', authMiddleware, robotRoutes);
app.use('/api/threats', authMiddleware, threatRoutes);
app.use('/api/patrols', authMiddleware, patrolRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Autonomous system endpoints
app.post('/api/autonomous/decision', authMiddleware, async (req, res, next) => {
  try {
    const decision = await autonomousFramework.makeDecision(req.body);
    res.json({ success: true, decision });
  } catch (error) {
    next(error);
  }
});

app.post('/api/autonomous/generate-content', authMiddleware, async (req, res, next) => {
  try {
    const content = await autonomousFramework.generateContent(req.body);
    res.json({ success: true, content });
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

  socket.on('robot:subscribe', (robotId) => {
    socket.join(`robot:${robotId}`);
    console.log(`Client ${socket.id} subscribed to robot ${robotId}`);
  });

  socket.on('threat:subscribe', () => {
    socket.join('threats');
    console.log(`Client ${socket.id} subscribed to threats`);
  });

  socket.on('dashboard:subscribe', () => {
    socket.join('dashboard');
    console.log(`Client ${socket.id} subscribed to dashboard`);
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
║         🤖 RoboGuard Pro Backend Server 🤖          ║
║                                                       ║
║  Server:     http://localhost:${PORT}                  ║
║  Mode:       Autonomous                              ║
║  Framework:  JavaScript SDK                          ║
║  Database:   MongoDB                                 ║
║  Cache:      Redis                                   ║
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
  await mongoose.connection.close();
  await redisClient.quit();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();

export default app;
