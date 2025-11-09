/**
 * Threat Detection Service
 * Integrates with Autonomous Framework and Python AI Engine
 */

import { Threat } from '../../../database/mongodb-schema.js';
import { io } from '../server.js';
import axios from 'axios';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8001';

export class ThreatDetectionService {
  constructor(autonomousFramework) {
    this.framework = autonomousFramework;
    this.activeThreats = new Map();
  }

  /**
   * Detect threat using AI engine
   */
  async detectThreat(detectionData) {
    try {
      // Call Python AI Engine for threat analysis
      const response = await axios.post(`${AI_ENGINE_URL}/api/ai/detect-threat`, {
        imageData: detectionData.imageData,
        sensorData: detectionData.sensorData,
        location: detectionData.location,
        robotId: detectionData.robotId
      }, {
        timeout: 5000
      });

      const aiAnalysis = response.data;

      // If threat detected, create threat record
      if (aiAnalysis.threatDetected) {
        const threat = await this.createThreat({
          threatType: aiAnalysis.threatType,
          threatLevel: aiAnalysis.threatLevel,
          description: aiAnalysis.description,
          location: detectionData.location,
          detectedBy: detectionData.robotId,
          confidenceScore: aiAnalysis.confidence,
          imageData: detectionData.imageData,
          aiAnalysis: aiAnalysis.details
        });

        return { threatDetected: true, threat };
      }

      return { threatDetected: false };

    } catch (error) {
      console.error('AI Engine error, falling back to autonomous framework:', error.message);

      // Fallback: Use autonomous framework for basic threat detection
      const decision = await this.framework.makeDecision({
        type: 'threat_detection',
        data: detectionData
      });

      if (decision.action.includes('threat')) {
        const threat = await this.createThreat({
          threatType: 'unknown',
          threatLevel: 'medium',
          description: 'Anomaly detected by autonomous system',
          location: detectionData.location,
          detectedBy: detectionData.robotId,
          confidenceScore: decision.confidence
        });

        return { threatDetected: true, threat };
      }

      return { threatDetected: false };
    }
  }

  /**
   * Create new threat
   */
  async createThreat(threatData) {
    const threat = new Threat({
      ...threatData,
      status: 'active',
      detectedAt: new Date()
    });

    await threat.save();

    // Store in active threats
    this.activeThreats.set(threat._id.toString(), threat);

    // Broadcast to all subscribers
    io.to('threats').emit('threat:detected', threat);
    io.to('dashboard').emit('threat:detected', threat);

    // Send alert for high/critical threats
    if (['high', 'critical'].includes(threat.threatLevel)) {
      io.to('dashboard').emit('alert', {
        type: 'threat',
        level: threat.threatLevel,
        message: `${threat.threatLevel.toUpperCase()} threat detected: ${threat.description}`,
        threatId: threat._id
      });
    }

    // Use autonomous framework to decide response
    await this.handleThreatResponse(threat);

    return threat;
  }

  /**
   * Handle threat response autonomously
   */
  async handleThreatResponse(threat) {
    const decision = await this.framework.makeDecision({
      type: 'threat_response',
      threat: {
        id: threat._id,
        level: threat.threatLevel,
        type: threat.threatType,
        location: threat.location
      }
    });

    console.log(`🤖 Autonomous decision for threat ${threat._id}:`, decision.action);

    // Update threat with response
    threat.responseActions = threat.responseActions || [];
    threat.responseActions.push({
      action: decision.action,
      confidence: decision.confidence,
      timestamp: new Date()
    });

    await threat.save();

    // Broadcast decision
    io.to('dashboard').emit('threat:response', {
      threatId: threat._id,
      decision: decision.action
    });
  }

  /**
   * Get all threats
   */
  async getAllThreats(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.threatLevel) {
      query.threatLevel = filters.threatLevel;
    }

    if (filters.location) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: filters.location.coordinates
          },
          $maxDistance: filters.location.radius || 1000
        }
      };
    }

    return await Threat.find(query)
      .sort({ detectedAt: -1 })
      .limit(filters.limit || 100);
  }

  /**
   * Get threat by ID
   */
  async getThreatById(threatId) {
    const threat = await Threat.findById(threatId);
    if (!threat) {
      throw new Error('Threat not found');
    }
    return threat;
  }

  /**
   * Update threat status
   */
  async updateThreatStatus(threatId, status, resolution = null) {
    const threat = await Threat.findByIdAndUpdate(
      threatId,
      {
        status,
        ...(resolution && { resolution }),
        ...(status === 'resolved' && { resolvedAt: new Date() })
      },
      { new: true }
    );

    if (!threat) {
      throw new Error('Threat not found');
    }

    // Remove from active threats if resolved
    if (status === 'resolved') {
      this.activeThreats.delete(threatId);
    }

    io.to('threats').emit('threat:updated', threat);
    io.to('dashboard').emit('threat:updated', threat);

    return threat;
  }

  /**
   * Get threat analytics
   */
  async getThreatAnalytics(timeRange = '24h') {
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (timeRangeMs[timeRange] || timeRangeMs['24h']));

    const [total, active, byLevel, byType] = await Promise.all([
      Threat.countDocuments({ detectedAt: { $gte: since } }),
      Threat.countDocuments({ status: 'active', detectedAt: { $gte: since } }),
      Threat.aggregate([
        { $match: { detectedAt: { $gte: since } } },
        { $group: { _id: '$threatLevel', count: { $sum: 1 } } }
      ]),
      Threat.aggregate([
        { $match: { detectedAt: { $gte: since } } },
        { $group: { _id: '$threatType', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total,
      active,
      byLevel: byLevel.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
  }
}
