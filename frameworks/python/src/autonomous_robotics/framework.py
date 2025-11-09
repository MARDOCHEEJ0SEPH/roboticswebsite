"""
Main Framework Class - Autonomous Robotics Neural Framework
"""

import asyncio
from typing import Dict, Any, Optional
from datetime import datetime

from .core.neural_core import NeuralCore
from .core.decision_engine import DecisionEngine
from .core.evolution_engine import EvolutionEngine
from .core.learning_system import LearningSystem
from .modules.content_generator import ContentGenerator
from .modules.aeo_optimizer import AEOOptimizer
from .modules.llmo_optimizer import LLMOOptimizer
from .modules.analytics_engine import AnalyticsEngine


class AutonomousRoboticsFramework:
    """
    Main framework class orchestrating all autonomous operations

    This is a living digital organism that:
    - Monitors its own performance
    - Makes independent decisions
    - Learns from interactions
    - Evolves features autonomously
    - Self-optimizes continuously
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the autonomous framework

        Args:
            config: Configuration dictionary with:
                - mode: 'autonomous' or 'supervised'
                - evolution_rate: 'conservative', 'moderate', or 'aggressive'
                - learning_enabled: bool
                - auto_deployment: bool
        """
        self.config = {
            'mode': 'autonomous',
            'evolution_rate': 'aggressive',
            'learning_enabled': True,
            'auto_deployment': True,
            **(config or {})
        }

        # Core systems
        self.neural_core: Optional[NeuralCore] = None
        self.decision_engine: Optional[DecisionEngine] = None
        self.evolution_engine: Optional[EvolutionEngine] = None
        self.learning_system: Optional[LearningSystem] = None

        # Modules
        self.content_generator: Optional[ContentGenerator] = None
        self.aeo_optimizer: Optional[AEOOptimizer] = None
        self.llmo_optimizer: Optional[LLMOOptimizer] = None
        self.analytics_engine: Optional[AnalyticsEngine] = None

        # State
        self.is_initialized = False
        self.is_running = False
        self._tasks: list = []

    async def initialize(self) -> None:
        """Initialize all components of the framework"""
        print("🤖 Initializing Autonomous Robotics Framework...")

        # Initialize core systems
        self.neural_core = NeuralCore(self.config)
        await self.neural_core.initialize()

        self.decision_engine = DecisionEngine(self.neural_core)
        await self.decision_engine.initialize()

        self.evolution_engine = EvolutionEngine(self.neural_core)
        await self.evolution_engine.initialize()

        self.learning_system = LearningSystem(self.neural_core)
        await self.learning_system.initialize()

        # Initialize modules
        self.content_generator = ContentGenerator(self.neural_core)
        await self.content_generator.initialize()

        self.aeo_optimizer = AEOOptimizer()
        await self.aeo_optimizer.initialize()

        self.llmo_optimizer = LLMOOptimizer()
        await self.llmo_optimizer.initialize()

        self.analytics_engine = AnalyticsEngine(self.neural_core)
        await self.analytics_engine.initialize()

        self.is_initialized = True
        print("✅ Framework initialized successfully")

    async def start(self) -> None:
        """Start all autonomous operations"""
        if not self.is_initialized:
            raise RuntimeError("Framework not initialized. Call initialize() first.")

        print("🚀 Starting autonomous operations...")
        self.is_running = True

        # Start autonomous loops
        self._tasks = [
            asyncio.create_task(self.neural_core.start_autonomous_loop()),
            asyncio.create_task(self.evolution_engine.start_evolution_loop()),
            asyncio.create_task(self.learning_system.start_learning_loop()),
            asyncio.create_task(self._orchestration_loop())
        ]

        print("✅ Autonomous system is now live and self-evolving")

    async def stop(self) -> None:
        """Stop all autonomous operations gracefully"""
        print("🛑 Stopping autonomous operations...")
        self.is_running = False

        # Cancel all tasks
        for task in self._tasks:
            task.cancel()

        # Wait for tasks to complete
        await asyncio.gather(*self._tasks, return_exceptions=True)

        # Stop all components
        if self.neural_core:
            await self.neural_core.stop()
        if self.evolution_engine:
            await self.evolution_engine.stop()
        if self.learning_system:
            await self.learning_system.stop()

        print("✅ System stopped gracefully")

    async def _orchestration_loop(self) -> None:
        """Main orchestration loop coordinating all operations"""
        while self.is_running:
            try:
                # Orchestrate operations
                await self._daily_operations()

                # Sleep for configured interval
                await asyncio.sleep(3600)  # Hourly orchestration
            except Exception as e:
                print(f"❌ Orchestration error: {e}")
                await asyncio.sleep(300)  # Retry after 5 minutes

    async def _daily_operations(self) -> None:
        """Execute daily autonomous operations"""
        # Generate content
        if self.content_generator:
            await self.content_generator.generate_daily_content()

        # Analyze performance
        if self.analytics_engine:
            metrics = await self.analytics_engine.collect_metrics()

            # Learn from metrics
            if self.learning_system:
                await self.learning_system.learn({
                    'type': 'performance_metrics',
                    'value': metrics,
                    'timestamp': datetime.now()
                })

    async def make_decision(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make an autonomous decision based on context

        Args:
            context: Decision context including type, data, etc.

        Returns:
            Decision dict with action, confidence, reasoning
        """
        if not self.decision_engine:
            raise RuntimeError("Decision engine not initialized")
        return await self.decision_engine.decide(context)

    async def generate_content(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate optimized content

        Args:
            params: Content parameters (topic, type, keywords, etc.)

        Returns:
            Generated and optimized content
        """
        if not self.content_generator:
            raise RuntimeError("Content generator not initialized")
        return await self.content_generator.generate(params)

    async def optimize_for_aeo(self, content: str, keywords: list) -> Dict[str, Any]:
        """
        Optimize content for Answer Engine Optimization

        Args:
            content: Content to optimize
            keywords: Target keywords

        Returns:
            Optimized content with schema and metadata
        """
        if not self.aeo_optimizer:
            raise RuntimeError("AEO optimizer not initialized")
        return await self.aeo_optimizer.optimize(content, keywords)

    async def optimize_for_llmo(self, content: str) -> str:
        """
        Optimize content for Large Language Model comprehension

        Args:
            content: Content to optimize

        Returns:
            Optimized content
        """
        if not self.llmo_optimizer:
            raise RuntimeError("LLMO optimizer not initialized")
        return await self.llmo_optimizer.optimize(content)

    def get_status(self) -> Dict[str, Any]:
        """Get current system status"""
        return {
            'initialized': self.is_initialized,
            'running': self.is_running,
            'mode': self.config['mode'],
            'neural_core': self.neural_core.get_status() if self.neural_core else None,
            'evolution': self.evolution_engine.get_status() if self.evolution_engine else None,
            'learning': self.learning_system.get_status() if self.learning_system else None,
            'analytics': self.analytics_engine.get_metrics() if self.analytics_engine else None
        }

    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize()
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.stop()


# Convenience function for quick start
async def create_framework(config: Optional[Dict[str, Any]] = None) -> AutonomousRoboticsFramework:
    """
    Create and initialize a framework instance

    Args:
        config: Framework configuration

    Returns:
        Initialized framework instance
    """
    framework = AutonomousRoboticsFramework(config)
    await framework.initialize()
    return framework
