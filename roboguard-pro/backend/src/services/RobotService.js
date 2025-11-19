/**
 * Robot Service - Manages robot fleet operations
 * Integrates with Autonomous Robotics Framework
 */

import { Robot } from '../../../database/mongodb-schema.js';
import { io } from '../server.js';

export class RobotService {
  constructor(autonomousFramework) {
    this.framework = autonomousFramework;
    this.robots = new Map();
  }

  /**
   * Get all robots
   */
  async getAllRobots(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.location) {
      // Geospatial query - find robots within radius
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: filters.location.coordinates
          },
          $maxDistance: filters.location.radius || 1000 // meters
        }
      };
    }

    return await Robot.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get robot by ID
   */
  async getRobotById(robotId) {
    const robot = await Robot.findById(robotId);
    if (!robot) {
      throw new Error('Robot not found');
    }
    return robot;
  }

  /**
   * Create new robot
   */
  async createRobot(robotData) {
    const robot = new Robot(robotData);
    await robot.save();

    // Broadcast to dashboard
    io.to('dashboard').emit('robot:update', robot);

    return robot;
  }

  /**
   * Update robot status and location
   */
  async updateRobot(robotId, updates) {
    const robot = await Robot.findByIdAndUpdate(
      robotId,
      {
        ...updates,
        lastUpdate: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!robot) {
      throw new Error('Robot not found');
    }

    // Broadcast real-time update
    io.to('dashboard').emit('robot:update', robot);
    io.to(`robot:${robotId}`).emit('robot:update', robot);

    return robot;
  }

  /**
   * Update robot telemetry (battery, sensors, etc.)
   */
  async updateTelemetry(robotId, telemetryData) {
    const robot = await Robot.findById(robotId);

    if (!robot) {
      throw new Error('Robot not found');
    }

    // Update telemetry fields
    if (telemetryData.batteryLevel !== undefined) {
      robot.batteryLevel = telemetryData.batteryLevel;
    }

    if (telemetryData.location) {
      robot.location = {
        type: 'Point',
        coordinates: telemetryData.location.coordinates
      };
    }

    if (telemetryData.sensors) {
      robot.sensors = { ...robot.sensors, ...telemetryData.sensors };
    }

    robot.lastUpdate = new Date();
    await robot.save();

    // Check battery level and make autonomous decision
    if (robot.batteryLevel < 20 && robot.status !== 'charging') {
      await this.handleLowBattery(robot);
    }

    // Broadcast update
    io.to('dashboard').emit('robot:update', robot);

    return robot;
  }

  /**
   * Assign task to robot using autonomous framework
   */
  async assignTask(robotId, taskData) {
    const robot = await Robot.findById(robotId);

    if (!robot) {
      throw new Error('Robot not found');
    }

    if (robot.status === 'offline' || robot.status === 'emergency') {
      throw new Error('Robot is not available for tasks');
    }

    // Use autonomous framework to make decision
    const decision = await this.framework.makeDecision({
      type: 'task_assignment',
      robot: {
        id: robot._id,
        batteryLevel: robot.batteryLevel,
        location: robot.location,
        capabilities: robot.capabilities
      },
      task: taskData
    });

    // Update robot with task
    robot.currentTask = taskData.type;
    robot.status = 'online';
    await robot.save();

    io.to('dashboard').emit('robot:update', robot);

    return { robot, decision };
  }

  /**
   * Handle low battery autonomously
   */
  async handleLowBattery(robot) {
    console.log(`🔋 Low battery detected for ${robot.name}`);

    // Use autonomous framework to decide action
    const decision = await this.framework.makeDecision({
      type: 'low_battery',
      robot: {
        id: robot._id,
        batteryLevel: robot.batteryLevel,
        location: robot.location
      }
    });

    // Autonomous decision: send to charging station
    robot.status = 'charging';
    robot.currentTask = 'Returning to charging station';
    await robot.save();

    io.to('dashboard').emit('robot:update', robot);
    io.to('dashboard').emit('notification', {
      type: 'warning',
      message: `${robot.name} is returning to charging station (Battery: ${robot.batteryLevel}%)`
    });
  }

  /**
   * Get robot analytics
   */
  async getRobotAnalytics() {
    const total = await Robot.countDocuments();
    const online = await Robot.countDocuments({ status: 'online' });
    const offline = await Robot.countDocuments({ status: 'offline' });
    const charging = await Robot.countDocuments({ status: 'charging' });
    const emergency = await Robot.countDocuments({ status: 'emergency' });

    const avgBattery = await Robot.aggregate([
      { $group: { _id: null, avgBattery: { $avg: '$batteryLevel' } } }
    ]);

    return {
      total,
      online,
      offline,
      charging,
      emergency,
      averageBattery: avgBattery[0]?.avgBattery || 0
    };
  }

  /**
   * Emergency stop for robot
   */
  async emergencyStop(robotId) {
    const robot = await Robot.findByIdAndUpdate(
      robotId,
      {
        status: 'emergency',
        currentTask: null
      },
      { new: true }
    );

    io.to('dashboard').emit('robot:update', robot);
    io.to('dashboard').emit('alert', {
      type: 'emergency',
      message: `Emergency stop activated for ${robot.name}`,
      robotId: robot._id
    });

    return robot;
  }
}
