/**
 * Patrol Routes
 */

import express from 'express';
import { Patrol } from '../../../database/mongodb-schema.js';

const router = express.Router();

/**
 * GET /api/patrols
 * Get all patrols
 */
router.get('/', async (req, res, next) => {
  try {
    const query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    const patrols = await Patrol.find(query)
      .populate('assignedRobots', 'name status batteryLevel')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: patrols.length,
      data: patrols
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/patrols/:id
 * Get patrol by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const patrol = await Patrol.findById(req.params.id)
      .populate('assignedRobots', 'name status location batteryLevel');

    if (!patrol) {
      return res.status(404).json({
        success: false,
        error: 'Patrol not found'
      });
    }

    res.json({
      success: true,
      data: patrol
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/patrols
 * Create new patrol
 */
router.post('/', async (req, res, next) => {
  try {
    const patrolData = {
      name: req.body.name,
      route: req.body.route,
      schedule: req.body.schedule,
      priority: req.body.priority || 'normal',
      assignedRobots: req.body.assignedRobots || [],
      status: 'scheduled'
    };

    const patrol = new Patrol(patrolData);
    await patrol.save();

    res.status(201).json({
      success: true,
      data: patrol
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/patrols/:id
 * Update patrol
 */
router.put('/:id', async (req, res, next) => {
  try {
    const updates = {};

    const allowedUpdates = ['name', 'route', 'schedule', 'priority', 'status', 'assignedRobots'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const patrol = await Patrol.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!patrol) {
      return res.status(404).json({
        success: false,
        error: 'Patrol not found'
      });
    }

    res.json({
      success: true,
      data: patrol
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/patrols/:id
 * Delete patrol
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const patrol = await Patrol.findByIdAndDelete(req.params.id);

    if (!patrol) {
      return res.status(404).json({
        success: false,
        error: 'Patrol not found'
      });
    }

    res.json({
      success: true,
      message: 'Patrol deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/patrols/:id/start
 * Start patrol
 */
router.post('/:id/start', async (req, res, next) => {
  try {
    const patrol = await Patrol.findByIdAndUpdate(
      req.params.id,
      {
        status: 'active',
        startedAt: new Date()
      },
      { new: true }
    );

    if (!patrol) {
      return res.status(404).json({
        success: false,
        error: 'Patrol not found'
      });
    }

    res.json({
      success: true,
      message: 'Patrol started',
      data: patrol
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/patrols/:id/complete
 * Complete patrol
 */
router.post('/:id/complete', async (req, res, next) => {
  try {
    const patrol = await Patrol.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        completedAt: new Date()
      },
      { new: true }
    );

    if (!patrol) {
      return res.status(404).json({
        success: false,
        error: 'Patrol not found'
      });
    }

    res.json({
      success: true,
      message: 'Patrol completed',
      data: patrol
    });
  } catch (error) {
    next(error);
  }
});

export default router;
