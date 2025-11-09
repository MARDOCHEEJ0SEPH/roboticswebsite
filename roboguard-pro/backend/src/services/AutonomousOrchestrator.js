/**
 * Autonomous Orchestrator
 * Coordinates all autonomous operations and decision-making
 */

import { Robot } from '../../../database/mongodb-schema.js';
import { Patrol } from '../../../database/mongodb-schema.js';

export class AutonomousOrchestrator {
  constructor(autonomousFramework, robotService, threatDetectionService, io) {
    this.framework = autonomousFramework;
    this.robotService = robotService;
    this.threatService = threatDetectionService;
    this.io = io;
    this.isRunning = false;
    this.intervals = [];
  }

  /**
   * Start autonomous orchestration
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Autonomous Orchestrator already running');
      return;
    }

    console.log('🎯 Starting Autonomous Orchestrator...');
    this.isRunning = true;

    // Monitor fleet health every 30 seconds
    this.intervals.push(
      setInterval(() => this.monitorFleetHealth(), 30000)
    );

    // Optimize patrol routes every 5 minutes
    this.intervals.push(
      setInterval(() => this.optimizePatrolRoutes(), 5 * 60 * 1000)
    );

    // Broadcast system status every 10 seconds
    this.intervals.push(
      setInterval(() => this.broadcastSystemStatus(), 10000)
    );

    // Autonomous decision-making cycle every minute
    this.intervals.push(
      setInterval(() => this.autonomousDecisionCycle(), 60000)
    );

    console.log('✅ Autonomous Orchestrator started');
  }

  /**
   * Stop orchestration
   */
  stop() {
    console.log('🛑 Stopping Autonomous Orchestrator...');
    this.isRunning = false;
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }

  /**
   * Monitor fleet health and take autonomous actions
   */
  async monitorFleetHealth() {
    try {
      const robots = await Robot.find({ status: { $ne: 'offline' } });

      for (const robot of robots) {
        // Check battery level
        if (robot.batteryLevel < 15 && robot.status !== 'charging') {
          console.log(`🔋 Critical battery for ${robot.name}: ${robot.batteryLevel}%`);
          await this.robotService.handleLowBattery(robot);
        }

        // Check if robot hasn't reported in 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (robot.lastUpdate < fiveMinutesAgo && robot.status === 'online') {
          console.log(`⚠️ No update from ${robot.name} - marking as offline`);
          await this.robotService.updateRobot(robot._id, { status: 'offline' });

          this.io.to('dashboard').emit('alert', {
            type: 'warning',
            message: `Lost connection with ${robot.name}`,
            robotId: robot._id
          });
        }

        // Check sensor health
        if (robot.sensors && Object.keys(robot.sensors).length > 0) {
          const failedSensors = Object.entries(robot.sensors)
            .filter(([_, status]) => status === 'failed' || status === 'degraded');

          if (failedSensors.length > 0) {
            console.log(`🔧 Sensor issues detected on ${robot.name}`);
            // Autonomous decision: send to maintenance
            const decision = await this.framework.makeDecision({
              type: 'sensor_failure',
              robot: { id: robot._id, sensors: robot.sensors }
            });

            if (decision.action.includes('maintenance')) {
              await this.robotService.updateRobot(robot._id, {
                status: 'maintenance',
                currentTask: 'Sensor diagnostics'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error monitoring fleet health:', error);
    }
  }

  /**
   * Optimize patrol routes using autonomous framework
   */
  async optimizePatrolRoutes() {
    try {
      const activePatrols = await Patrol.find({ status: 'active' });
      const availableRobots = await Robot.find({
        status: 'online',
        batteryLevel: { $gt: 30 }
      });

      if (activePatrols.length === 0 || availableRobots.length === 0) {
        return;
      }

      console.log('🗺️ Optimizing patrol routes...');

      for (const patrol of activePatrols) {
        // Use autonomous framework to optimize route
        const decision = await this.framework.makeDecision({
          type: 'patrol_optimization',
          patrol: {
            id: patrol._id,
            route: patrol.route,
            priority: patrol.priority,
            assignedRobots: patrol.assignedRobots
          },
          availableRobots: availableRobots.map(r => ({
            id: r._id,
            location: r.location,
            batteryLevel: r.batteryLevel
          }))
        });

        console.log(`Patrol ${patrol.name}: ${decision.action}`);
      }

    } catch (error) {
      console.error('Error optimizing patrol routes:', error);
    }
  }

  /**
   * Broadcast system status to dashboard
   */
  async broadcastSystemStatus() {
    try {
      const frameworkStatus = this.framework.getStatus();
      const robotAnalytics = await this.robotService.getRobotAnalytics();
      const threatAnalytics = await this.threatService.getThreatAnalytics('1h');

      const systemStatus = {
        mode: frameworkStatus.mode,
        running: frameworkStatus.running,
        evolution: frameworkStatus.evolution,
        learning: frameworkStatus.learning,
        neuralCore: frameworkStatus.neuralCore,
        robots: robotAnalytics,
        threats: threatAnalytics,
        timestamp: new Date()
      };

      this.io.to('dashboard').emit('system:status', systemStatus);

    } catch (error) {
      console.error('Error broadcasting system status:', error);
    }
  }

  /**
   * Autonomous decision-making cycle
   */
  async autonomousDecisionCycle() {
    try {
      console.log('🤖 Running autonomous decision cycle...');

      // Get current system state
      const [robots, threats, patrols] = await Promise.all([
        Robot.find(),
        this.threatService.getAllThreats({ status: 'active', limit: 50 }),
        Patrol.find({ status: 'active' })
      ]);

      // Make high-level autonomous decision
      const decision = await this.framework.makeDecision({
        type: 'system_optimization',
        state: {
          robotCount: robots.length,
          activeThreats: threats.length,
          activePatrols: patrols.length,
          avgBattery: robots.reduce((sum, r) => sum + r.batteryLevel, 0) / robots.length
        }
      });

      console.log('📊 Autonomous system decision:', decision.action);

      // Execute decision
      if (decision.action.includes('increase_patrol')) {
        console.log('🚨 Increasing patrol coverage due to threat activity');
        // Implementation: Auto-create or extend patrols
      } else if (decision.action.includes('optimize_energy')) {
        console.log('⚡ Optimizing energy consumption across fleet');
        // Implementation: Reduce patrol frequency, consolidate routes
      } else if (decision.action.includes('redistribute')) {
        console.log('🔄 Redistributing robot assignments');
        // Implementation: Re-assign robots based on threat hotspots
      }

    } catch (error) {
      console.error('Error in autonomous decision cycle:', error);
    }
  }

  /**
   * Handle emergency situation autonomously
   */
  async handleEmergency(emergencyData) {
    console.log('🚨 EMERGENCY DETECTED:', emergencyData);

    // Use autonomous framework for emergency response
    const decision = await this.framework.makeDecision({
      type: 'emergency_response',
      emergency: emergencyData
    });

    // Execute emergency protocol
    this.io.to('dashboard').emit('emergency', {
      type: emergencyData.type,
      location: emergencyData.location,
      response: decision.action,
      timestamp: new Date()
    });

    // Dispatch nearest available robots
    const nearbyRobots = await Robot.find({
      status: { $in: ['online', 'charging'] },
      batteryLevel: { $gt: 20 },
      location: {
        $near: {
          $geometry: emergencyData.location,
          $maxDistance: 500 // 500 meters
        }
      }
    }).limit(3);

    for (const robot of nearbyRobots) {
      await this.robotService.assignTask(robot._id, {
        type: 'emergency_response',
        priority: 'critical',
        location: emergencyData.location
      });
    }

    return decision;
  }
}
