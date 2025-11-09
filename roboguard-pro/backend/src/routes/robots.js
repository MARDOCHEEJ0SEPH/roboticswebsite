/**
 * Robot Routes
 */

import express from 'express';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

// This will be injected from server.js
let robotService;

export const setRobotService = (service) => {
  robotService = service;
};

/**
 * GET /api/robots
 * Get all robots with optional filters
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.lat && req.query.lng && req.query.radius) {
      filters.location = {
        coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)],
        radius: parseInt(req.query.radius)
      };
    }

    const robots = await robotService.getAllRobots(filters);

    res.json({
      success: true,
      count: robots.length,
      data: robots
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/robots/:id
 * Get robot by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const robot = await robotService.getRobotById(req.params.id);

    res.json({
      success: true,
      data: robot
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/robots
 * Create new robot
 */
router.post('/', async (req, res, next) => {
  try {
    const robotData = {
      name: req.body.name,
      model: req.body.model,
      serialNumber: req.body.serialNumber,
      status: req.body.status || 'offline',
      batteryLevel: req.body.batteryLevel || 100,
      location: req.body.location,
      capabilities: req.body.capabilities || [],
      sensors: req.body.sensors || {}
    };

    const robot = await robotService.createRobot(robotData);

    res.status(201).json({
      success: true,
      data: robot
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/robots/:id
 * Update robot
 */
router.put('/:id', async (req, res, next) => {
  try {
    const updates = {};

    // Only allow certain fields to be updated
    const allowedUpdates = ['name', 'status', 'currentTask', 'sensors'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const robot = await robotService.updateRobot(req.params.id, updates);

    res.json({
      success: true,
      data: robot
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/robots/:id/telemetry
 * Update robot telemetry
 */
router.post('/:id/telemetry', async (req, res, next) => {
  try {
    const telemetryData = {
      batteryLevel: req.body.batteryLevel,
      location: req.body.location,
      sensors: req.body.sensors,
      temperature: req.body.temperature,
      speed: req.body.speed
    };

    const robot = await robotService.updateTelemetry(req.params.id, telemetryData);

    res.json({
      success: true,
      data: robot
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/robots/:id/task
 * Assign task to robot
 */
router.post('/:id/task', async (req, res, next) => {
  try {
    const taskData = {
      type: req.body.type,
      priority: req.body.priority || 'normal',
      location: req.body.location,
      parameters: req.body.parameters || {}
    };

    const result = await robotService.assignTask(req.params.id, taskData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/robots/:id/emergency-stop
 * Emergency stop for robot
 */
router.post('/:id/emergency-stop', async (req, res, next) => {
  try {
    const robot = await robotService.emergencyStop(req.params.id);

    res.json({
      success: true,
      message: 'Emergency stop activated',
      data: robot
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/robots/analytics/summary
 * Get robot analytics
 */
router.get('/analytics/summary', async (req, res, next) => {
  try {
    const analytics = await robotService.getRobotAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

export default router;
