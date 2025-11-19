/**
 * Threat Routes
 */

import express from 'express';

const router = express.Router();

// This will be injected from server.js
let threatService;

export const setThreatService = (service) => {
  threatService = service;
};

/**
 * GET /api/threats
 * Get all threats with optional filters
 */
router.get('/', async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.threatLevel) {
      filters.threatLevel = req.query.threatLevel;
    }

    if (req.query.limit) {
      filters.limit = parseInt(req.query.limit);
    }

    if (req.query.lat && req.query.lng && req.query.radius) {
      filters.location = {
        coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)],
        radius: parseInt(req.query.radius)
      };
    }

    const threats = await threatService.getAllThreats(filters);

    res.json({
      success: true,
      count: threats.length,
      data: threats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/threats/:id
 * Get threat by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const threat = await threatService.getThreatById(req.params.id);

    res.json({
      success: true,
      data: threat
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/threats/detect
 * Detect threat from sensor data
 */
router.post('/detect', async (req, res, next) => {
  try {
    const detectionData = {
      imageData: req.body.imageData,
      sensorData: req.body.sensorData,
      location: req.body.location,
      robotId: req.body.robotId
    };

    const result = await threatService.detectThreat(detectionData);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/threats/:id/status
 * Update threat status
 */
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status, resolution } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const threat = await threatService.updateThreatStatus(
      req.params.id,
      status,
      resolution
    );

    res.json({
      success: true,
      data: threat
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/threats/analytics/summary
 * Get threat analytics
 */
router.get('/analytics/summary', async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const analytics = await threatService.getThreatAnalytics(timeRange);

    res.json({
      success: true,
      timeRange,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

export default router;
