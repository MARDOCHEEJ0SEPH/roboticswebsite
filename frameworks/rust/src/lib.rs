//! Autonomous Robotics Neural Framework - Rust SDK
//!
//! A self-evolving, autonomous system for robotics websites.
//! Built for maximum performance and reliability.
//!
//! # Features
//!
//! - **Neural Core**: Autonomous decision-making engine
//! - **Evolution Engine**: Genetic algorithms for feature evolution
//! - **Learning System**: Continuous learning from user interactions
//! - **High Performance**: Leverages Rust's zero-cost abstractions
//!
//! # Example
//!
//! ```rust,no_run
//! use autonomous_robotics::AutonomousFramework;
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     let framework = AutonomousFramework::new(Default::default()).await?;
//!     framework.start().await?;
//!     Ok(())
//! }
//! ```

pub mod core;
pub mod engine;
pub mod models;
pub mod utils;

use anyhow::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

pub use core::{NeuralCore, DecisionEngine, EvolutionEngine, LearningSystem};
pub use models::*;

/// Main framework orchestrating all autonomous operations
pub struct AutonomousFramework {
    neural_core: Arc<RwLock<NeuralCore>>,
    decision_engine: Arc<RwLock<DecisionEngine>>,
    evolution_engine: Arc<RwLock<EvolutionEngine>>,
    learning_system: Arc<RwLock<LearningSystem>>,
    config: FrameworkConfig,
}

/// Framework configuration
#[derive(Debug, Clone)]
pub struct FrameworkConfig {
    pub mode: OperationMode,
    pub evolution_rate: EvolutionRate,
    pub learning_enabled: bool,
    pub auto_deployment: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OperationMode {
    Autonomous,
    Supervised,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EvolutionRate {
    Conservative,
    Moderate,
    Aggressive,
}

impl Default for FrameworkConfig {
    fn default() -> Self {
        Self {
            mode: OperationMode::Autonomous,
            evolution_rate: EvolutionRate::Aggressive,
            learning_enabled: true,
            auto_deployment: true,
        }
    }
}

impl AutonomousFramework {
    /// Create a new autonomous framework instance
    pub async fn new(config: FrameworkConfig) -> Result<Self> {
        tracing::info!("🤖 Initializing Autonomous Robotics Framework...");

        let neural_core = Arc::new(RwLock::new(NeuralCore::new(&config).await?));
        let decision_engine = Arc::new(RwLock::new(DecisionEngine::new(neural_core.clone()).await?));
        let evolution_engine = Arc::new(RwLock::new(EvolutionEngine::new(neural_core.clone()).await?));
        let learning_system = Arc::new(RwLock::new(LearningSystem::new(neural_core.clone()).await?));

        tracing::info!("✅ Framework initialized successfully");

        Ok(Self {
            neural_core,
            decision_engine,
            evolution_engine,
            learning_system,
            config,
        })
    }

    /// Start all autonomous operations
    pub async fn start(&self) -> Result<()> {
        tracing::info!("🚀 Starting autonomous operations...");

        // Start autonomous loops
        let neural_handle = {
            let core = self.neural_core.clone();
            tokio::spawn(async move {
                let mut core = core.write().await;
                core.start_autonomous_loop().await
            })
        };

        let evolution_handle = {
            let engine = self.evolution_engine.clone();
            tokio::spawn(async move {
                let mut engine = engine.write().await;
                engine.start_evolution_loop().await
            })
        };

        let learning_handle = {
            let system = self.learning_system.clone();
            tokio::spawn(async move {
                let mut system = system.write().await;
                system.start_learning_loop().await
            })
        };

        tracing::info!("✅ Autonomous system is now live and self-evolving");

        // Wait for all loops (they run indefinitely)
        tokio::try_join!(neural_handle, evolution_handle, learning_handle)?;

        Ok(())
    }

    /// Make an autonomous decision
    pub async fn make_decision(&self, context: DecisionContext) -> Result<Decision> {
        let engine = self.decision_engine.read().await;
        engine.decide(context).await
    }

    /// Get current system status
    pub async fn get_status(&self) -> FrameworkStatus {
        let neural_core = self.neural_core.read().await;
        let evolution_engine = self.evolution_engine.read().await;
        let learning_system = self.learning_system.read().await;

        FrameworkStatus {
            mode: self.config.mode,
            neural_core_status: neural_core.get_status(),
            evolution_status: evolution_engine.get_status(),
            learning_status: learning_system.get_status(),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FrameworkStatus {
    pub mode: OperationMode,
    pub neural_core_status: core::NeuralCoreStatus,
    pub evolution_status: engine::EvolutionStatus,
    pub learning_status: core::LearningStatus,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_framework_creation() {
        let framework = AutonomousFramework::new(Default::default()).await;
        assert!(framework.is_ok());
    }
}
