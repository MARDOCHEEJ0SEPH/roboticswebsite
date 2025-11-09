/**
 * Dashboard Routes
 * Provides aggregated data for dashboard views
 */

import express from 'express';
import { Robot } from '../../../database/mongodb-schema.js';
import { Threat } from '../../../database/mongodb-schema.js';
import { Patrol } from '../../../database/mongodb-schema.js';

const router = express.Router();

// Services will be injected
let robotService;
let threatService;

export const setServices = (services) => {
  robotService = services.robotService;
  threatService = services.threatService;
};

/**
 * GET /api/dashboard/overview
 * Get dashboard overview with key metrics
 */
router.get('/overview', async (req, res, next) => {
  try {
    const [
      robotAnalytics,
      threatAnalytics,
      activePatrols,
      recentThreats
    ] = await Promise.all([
      robotService.getRobotAnalytics(),
      threatService.getThreatAnalytics('24h'),
      Patrol.countDocuments({ status: 'active' }),
      Threat.find({ status: 'active' })
        .sort({ detectedAt: -1 })
        .limit(5)
        .select('threatType threatLevel description detectedAt location')
    ]);

    res.json({
      success: true,
      data: {
        robots: robotAnalytics,
        threats: threatAnalytics,
        activePatrols,
        recentThreats
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/map-data
 * Get all data needed for map visualization
 */
router.get('/map-data', async (req, res, next) => {
  try {
    const [robots, activeThreats, activePatrols] = await Promise.all([
      Robot.find({ status: { $ne: 'offline' } })
        .select('name status location batteryLevel currentTask'),
      Threat.find({ status: 'active' })
        .select('threatType threatLevel location detectedAt'),
      Patrol.find({ status: 'active' })
        .select('name route assignedRobots')
        .populate('assignedRobots', 'name location')
    ]);

    res.json({
      success: true,
      data: {
        robots,
        threats: activeThreats,
        patrols: activePatrols
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/activity
 * Get recent activity feed
 */
router.get('/activity', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const [recentThreats, recentPatrols] = await Promise.all([
      Threat.find()
        .sort({ detectedAt: -1 })
        .limit(limit / 2)
        .select('threatType threatLevel description detectedAt status'),
      Patrol.find()
        .sort({ createdAt: -1 })
        .limit(limit / 2)
        .select('name status startedAt completedAt')
    ]);

    // Combine and sort by timestamp
    const activities = [
      ...recentThreats.map(t => ({
        type: 'threat',
        timestamp: t.detectedAt,
        data: t
      })),
      ...recentPatrols.map(p => ({
        type: 'patrol',
        timestamp: p.startedAt || p.createdAt,
        data: p
      }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/stats/hourly
 * Get hourly statistics for charts
 */
router.get('/stats/hourly', async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const now = new Date();
    const since = new Date(now - hours * 60 * 60 * 1000);

    const threatStats = await Threat.aggregate([
      { $match: { detectedAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d %H:00',
              date: '$detectedAt'
            }
          },
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ['$threatLevel', 'critical'] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ['$threatLevel', 'high'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        threats: threatStats
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/heatmap
 * Get threat heatmap data
 */
router.get('/heatmap', async (req, res, next) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const threats = await Threat.find({
      detectedAt: { $gte: since },
      location: { $exists: true }
    }).select('location threatLevel');

    const heatmapData = threats.map(t => ({
      lat: t.location.coordinates[1],
      lng: t.location.coordinates[0],
      intensity: t.threatLevel === 'critical' ? 4 : t.threatLevel === 'high' ? 3 : t.threatLevel === 'medium' ? 2 : 1
    }));

    res.json({
      success: true,
      count: heatmapData.length,
      data: heatmapData
    });
  } catch (error) {
    next(error);
  }
});

export default router;
