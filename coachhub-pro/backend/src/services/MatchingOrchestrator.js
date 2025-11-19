/**
 * Matching Orchestrator
 * AI-powered coach matching and recommendations
 */

import axios from 'axios';

export class MatchingOrchestrator {
  constructor(autonomousFramework, coachService, studentService, io) {
    this.framework = autonomousFramework;
    this.coachService = coachService;
    this.studentService = studentService;
    this.io = io;
    this.isRunning = false;
  }

  start() {
    this.isRunning = true;
    console.log('🎯 Matching Orchestrator started');
  }

  stop() {
    this.isRunning = false;
  }

  async findMatches(studentId, preferences = {}) {
    try {
      const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8001';

      // Call Python AI engine for intelligent matching
      const response = await axios.post(`${AI_ENGINE_URL}/api/ai/match-coaches`, {
        studentId,
        preferences
      });

      return response.data.matches;
    } catch (error) {
      console.error('AI matching failed, using fallback:', error.message);

      // Fallback to simple matching
      return await this.coachService.getAllCoaches({
        expertise: preferences.expertise,
        limit: 10
      });
    }
  }

  async getRecommendations(studentId) {
    try {
      const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8001';

      const response = await axios.post(`${AI_ENGINE_URL}/api/ai/recommend`, {
        studentId
      });

      return response.data.recommendations;
    } catch (error) {
      console.error('Recommendations failed:', error.message);
      return [];
    }
  }
}
