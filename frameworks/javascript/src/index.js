/**
 * Autonomous Robotics Neural Framework - JavaScript
 * Self-evolving, autonomous system for robotics websites
 * @module @autonomous-robotics/neural-framework-js
 */

import { NeuralCore } from './core/NeuralCore.js';
import { DecisionEngine } from './core/DecisionEngine.js';
import { EvolutionEngine } from './core/EvolutionEngine.js';
import { LearningSystem } from './core/LearningSystem.js';
import { ContentGenerator } from './modules/ContentGenerator.js';
import { ABTestManager } from './modules/ABTestManager.js';
import { AnalyticsEngine } from './modules/AnalyticsEngine.js';
import { AutomationOrchestrator } from './modules/AutomationOrchestrator.js';

/**
 * Main Framework Class
 */
export class AutonomousRoboticsFramework {
  constructor(config = {}) {
    this.config = {
      mode: 'autonomous',
      evolutionRate: 'aggressive',
      learningEnabled: true,
      autoDeployment: true,
      ...config
    };

    this.neuralCore = null;
    this.decisionEngine = null;
    this.evolutionEngine = null;
    this.learningSystem = null;
    this.contentGenerator = null;
    this.abTestManager = null;
    this.analyticsEngine = null;
    this.automationOrchestrator = null;

    this.isInitialized = false;
    this.isRunning = false;
  }

  /**
   * Initialize the autonomous framework
   */
  async initialize() {
    console.log('🤖 Initializing Autonomous Robotics Framework...');

    // Initialize core systems
    this.neuralCore = new NeuralCore(this.config);
    await this.neuralCore.initialize();

    this.decisionEngine = new DecisionEngine(this.neuralCore);
    await this.decisionEngine.initialize();

    this.evolutionEngine = new EvolutionEngine(this.neuralCore);
    await this.evolutionEngine.initialize();

    this.learningSystem = new LearningSystem(this.neuralCore);
    await this.learningSystem.initialize();

    // Initialize modules
    this.contentGenerator = new ContentGenerator(this.neuralCore);
    await this.contentGenerator.initialize();

    this.abTestManager = new ABTestManager(this.evolutionEngine);
    await this.abTestManager.initialize();

    this.analyticsEngine = new AnalyticsEngine(this.neuralCore);
    await this.analyticsEngine.initialize();

    this.automationOrchestrator = new AutomationOrchestrator({
      neuralCore: this.neuralCore,
      decisionEngine: this.decisionEngine,
      evolutionEngine: this.evolutionEngine,
      learningSystem: this.learningSystem
    });
    await this.automationOrchestrator.initialize();

    this.isInitialized = true;
    console.log('✅ Framework initialized successfully');
  }

  /**
   * Start autonomous operations
   */
  async start() {
    if (!this.isInitialized) {
      throw new Error('Framework not initialized. Call initialize() first.');
    }

    console.log('🚀 Starting autonomous operations...');
    this.isRunning = true;

    // Start autonomous loops
    await Promise.all([
      this.neuralCore.startAutonomousLoop(),
      this.evolutionEngine.startEvolutionLoop(),
      this.learningSystem.startLearningLoop(),
      this.automationOrchestrator.startOrchestration()
    ]);

    console.log('✅ Autonomous system is now live and self-evolving');
  }

  /**
   * Stop autonomous operations
   */
  async stop() {
    console.log('🛑 Stopping autonomous operations...');
    this.isRunning = false;

    await Promise.all([
      this.neuralCore.stop(),
      this.evolutionEngine.stop(),
      this.learningSystem.stop(),
      this.automationOrchestrator.stop()
    ]);

    console.log('✅ System stopped gracefully');
  }

  /**
   * Make an autonomous decision
   */
  async makeDecision(context) {
    return await this.decisionEngine.decide(context);
  }

  /**
   * Generate optimized content
   */
  async generateContent(params) {
    return await this.contentGenerator.generate(params);
  }

  /**
   * Create and run A/B test
   */
  async createABTest(testConfig) {
    return await this.abTestManager.createTest(testConfig);
  }

  /**
   * Get system status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      running: this.isRunning,
      mode: this.config.mode,
      neuralCore: this.neuralCore?.getStatus(),
      evolution: this.evolutionEngine?.getStatus(),
      learning: this.learningSystem?.getStatus(),
      analytics: this.analyticsEngine?.getMetrics()
    };
  }
}

// Export all components
export {
  NeuralCore,
  DecisionEngine,
  EvolutionEngine,
  LearningSystem,
  ContentGenerator,
  ABTestManager,
  AnalyticsEngine,
  AutomationOrchestrator
};

// Default export
export default AutonomousRoboticsFramework;
