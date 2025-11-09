"""
Autonomous Robotics Neural Framework - Python SDK
A self-evolving, autonomous system for robotics websites
"""

__version__ = "1.0.0"
__author__ = "Autonomous Robotics Team"

from .framework import AutonomousRoboticsFramework
from .core.neural_core import NeuralCore
from .core.decision_engine import DecisionEngine
from .core.evolution_engine import EvolutionEngine
from .core.learning_system import LearningSystem
from .modules.content_generator import ContentGenerator
from .modules.aeo_optimizer import AEOOptimizer
from .modules.llmo_optimizer import LLMOOptimizer
from .modules.analytics_engine import AnalyticsEngine

__all__ = [
    "AutonomousRoboticsFramework",
    "NeuralCore",
    "DecisionEngine",
    "EvolutionEngine",
    "LearningSystem",
    "ContentGenerator",
    "AEOOptimizer",
    "LLMOOptimizer",
    "AnalyticsEngine",
]
