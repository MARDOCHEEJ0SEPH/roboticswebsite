# Chapter 8: Decision Engine

## Autonomous Decision-Making

The decision engine is the brain of your autonomous platform. It analyzes data, evaluates options, and makes strategic decisions without human intervention.

## Decision Framework

### Decision Types

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DecisionType {
    ContentOptimization,    // What content to create
    ServiceExpansion,       // New services to offer
    PricingAdjustment,      // Pricing changes
    UxImprovement,          // UI/UX modifications
    MarketingCampaign,      // Marketing initiatives
    TechnicalOptimization,  // Performance improvements
    ProcessAutomation,      // Workflow automation
}
```

### Decision Model

```rust
pub struct Decision {
    pub id: Uuid,
    pub decision_type: DecisionType,
    pub action: String,
    pub confidence: f64,
    pub reasoning: Vec<String>,
    pub predicted_outcome: PredictedOutcome,
    pub actual_outcome: Option<ActualOutcome>,
    pub created_at: DateTime<Utc>,
    pub implemented_at: Option<DateTime<Utc>>,
}

pub struct PredictedOutcome {
    pub revenue_increase_pct: f64,
    pub lead_increase_pct: f64,
    pub satisfaction_increase_pct: f64,
    pub implementation_days: u32,
    pub confidence: f64,
}
```

## Weighted Scoring System

Create `services/decision-engine/src/decision/scorer.rs`:

```rust
use std::collections::HashMap;

pub struct DecisionScorer {
    weights: HashMap<String, f64>,
}

impl DecisionScorer {
    pub fn new() -> Self {
        let mut weights = HashMap::new();

        // Business impact weights
        weights.insert("revenue".to_string(), 0.35);
        weights.insert("customer_satisfaction".to_string(), 0.25);
        weights.insert("visibility".to_string(), 0.20);
        weights.insert("efficiency".to_string(), 0.15);
        weights.insert("innovation".to_string(), 0.05);

        DecisionScorer { weights }
    }

    pub fn score_option(&self, option: &DecisionOption) -> f64 {
        let mut total_score = 0.0;

        total_score += option.revenue_impact * self.weights["revenue"];
        total_score += option.satisfaction_impact * self.weights["customer_satisfaction"];
        total_score += option.visibility_impact * self.weights["visibility"];
        total_score += option.efficiency_impact * self.weights["efficiency"];
        total_score += option.innovation_impact * self.weights["innovation"];

        // Apply risk adjustment
        total_score *= (1.0 - option.risk_factor);

        // Apply time decay (prefer faster implementation)
        let time_factor = 1.0 / (1.0 + (option.implementation_days as f64 / 30.0));
        total_score *= (0.7 + 0.3 * time_factor);

        total_score
    }

    pub fn rank_options(&self, options: Vec<DecisionOption>) -> Vec<(DecisionOption, f64)> {
        let mut scored: Vec<(DecisionOption, f64)> = options
            .into_iter()
            .map(|opt| {
                let score = self.score_option(&opt);
                (opt, score)
            })
            .collect();

        scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        scored
    }
}

#[derive(Debug, Clone)]
pub struct DecisionOption {
    pub name: String,
    pub description: String,
    pub revenue_impact: f64,        // 0.0 - 1.0
    pub satisfaction_impact: f64,   // 0.0 - 1.0
    pub visibility_impact: f64,     // 0.0 - 1.0
    pub efficiency_impact: f64,     // 0.0 - 1.0
    pub innovation_impact: f64,     // 0.0 - 1.0
    pub risk_factor: f64,           // 0.0 - 1.0
    pub implementation_days: u32,
    pub estimated_cost: f64,
}
```

## Decision Engine Implementation

Create `services/decision-engine/src/decision/engine.rs`:

```rust
use sqlx::PgPool;
use uuid::Uuid;
use chrono::Utc;
use std::collections::HashMap;

use super::scorer::{DecisionScorer, DecisionOption};
use crate::models::decision::{Decision, DecisionType, PredictedOutcome};

pub struct DecisionEngine {
    db: PgPool,
    scorer: DecisionScorer,
}

impl DecisionEngine {
    pub fn new(db: PgPool) -> Self {
        DecisionEngine {
            db,
            scorer: DecisionScorer::new(),
        }
    }

    pub async fn make_decision(
        &self,
        decision_type: DecisionType,
        context: HashMap<String, serde_json::Value>,
    ) -> Result<Decision, Box<dyn std::error::Error>> {
        // Generate options based on decision type and context
        let options = self.generate_options(&decision_type, &context).await?;

        // Score and rank options
        let ranked = self.scorer.rank_options(options);

        // Select best option
        let (best_option, score) = ranked.first()
            .ok_or("No options generated")?;

        // Create decision
        let decision = Decision {
            id: Uuid::new_v4(),
            decision_type: decision_type.clone(),
            action: best_option.description.clone(),
            confidence: score,
            reasoning: self.generate_reasoning(best_option),
            predicted_outcome: self.predict_outcome(best_option),
            actual_outcome: None,
            created_at: Utc::now(),
            implemented_at: None,
        };

        // Save to database
        self.save_decision(&decision).await?;

        Ok(decision)
    }

    async fn generate_options(
        &self,
        decision_type: &DecisionType,
        context: &HashMap<String, serde_json::Value>,
    ) -> Result<Vec<DecisionOption>, Box<dyn std::error::Error>> {
        match decision_type {
            DecisionType::ContentOptimization => {
                self.generate_content_options(context).await
            }
            DecisionType::ServiceExpansion => {
                self.generate_service_options(context).await
            }
            DecisionType::PricingAdjustment => {
                self.generate_pricing_options(context).await
            }
            _ => Ok(vec![]),
        }
    }

    async fn generate_content_options(
        &self,
        context: &HashMap<String, serde_json::Value>,
    ) -> Result<Vec<DecisionOption>, Box<dyn std::error::Error>> {
        let mut options = vec![];

        // Option 1: Create pillar content
        options.push(DecisionOption {
            name: "pillar_content".to_string(),
            description: "Generate 3 comprehensive pillar pages targeting high-intent keywords".to_string(),
            revenue_impact: 0.7,
            satisfaction_impact: 0.6,
            visibility_impact: 0.9,
            efficiency_impact: 0.5,
            innovation_impact: 0.4,
            risk_factor: 0.2,
            implementation_days: 7,
            estimated_cost: 500.0,
        });

        // Option 2: Optimize existing content
        options.push(DecisionOption {
            name: "content_optimization".to_string(),
            description: "Optimize top 20 existing pages for better AEO/LLMO scores".to_string(),
            revenue_impact: 0.5,
            satisfaction_impact: 0.7,
            visibility_impact: 0.8,
            efficiency_impact: 0.8,
            innovation_impact: 0.3,
            risk_factor: 0.1,
            implementation_days: 3,
            estimated_cost: 200.0,
        });

        // Option 3: Create FAQ content
        options.push(DecisionOption {
            name: "faq_content".to_string(),
            description: "Generate 50 FAQ pages targeting long-tail keywords".to_string(),
            revenue_impact: 0.6,
            satisfaction_impact: 0.8,
            visibility_impact: 0.7,
            efficiency_impact: 0.6,
            innovation_impact: 0.2,
            risk_factor: 0.15,
            implementation_days: 5,
            estimated_cost: 300.0,
        });

        Ok(options)
    }

    async fn generate_service_options(
        &self,
        context: &HashMap<String, serde_json::Value>,
    ) -> Result<Vec<DecisionOption>, Box<dyn std::error::Error>> {
        let mut options = vec![];

        // Analyze market demand from context
        let demand_score = context
            .get("market_demand")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.5);

        // Option 1: Launch AI consulting tier
        options.push(DecisionOption {
            name: "ai_consulting".to_string(),
            description: "Launch premium AI consulting service tier".to_string(),
            revenue_impact: 0.8 * demand_score,
            satisfaction_impact: 0.7,
            visibility_impact: 0.6,
            efficiency_impact: 0.4,
            innovation_impact: 0.9,
            risk_factor: 0.3,
            implementation_days: 30,
            estimated_cost: 5000.0,
        });

        // Option 2: Expand to new market segment
        options.push(DecisionOption {
            name: "market_expansion".to_string(),
            description: "Expand services to healthcare sector".to_string(),
            revenue_impact: 0.9,
            satisfaction_impact: 0.6,
            visibility_impact: 0.7,
            efficiency_impact: 0.3,
            innovation_impact: 0.7,
            risk_factor: 0.4,
            implementation_days: 60,
            estimated_cost: 10000.0,
        });

        Ok(options)
    }

    async fn generate_pricing_options(
        &self,
        context: &HashMap<String, serde_json::Value>,
    ) -> Result<Vec<DecisionOption>, Box<dyn std::error::Error>> {
        // Implementation for pricing decisions
        Ok(vec![])
    }

    fn generate_reasoning(&self, option: &DecisionOption) -> Vec<String> {
        let mut reasoning = vec![];

        if option.revenue_impact > 0.7 {
            reasoning.push("High revenue impact expected based on market analysis".to_string());
        }

        if option.implementation_days < 14 {
            reasoning.push("Quick implementation allows for fast validation".to_string());
        }

        if option.risk_factor < 0.2 {
            reasoning.push("Low risk factor makes this a safe bet".to_string());
        }

        if option.visibility_impact > 0.7 {
            reasoning.push("Significant visibility improvements will drive organic growth".to_string());
        }

        reasoning
    }

    fn predict_outcome(&self, option: &DecisionOption) -> PredictedOutcome {
        PredictedOutcome {
            revenue_increase_pct: option.revenue_impact * 50.0,
            lead_increase_pct: option.visibility_impact * 40.0,
            satisfaction_increase_pct: option.satisfaction_impact * 30.0,
            implementation_days: option.implementation_days,
            confidence: (option.revenue_impact + option.satisfaction_impact) / 2.0,
        }
    }

    async fn save_decision(
        &self,
        decision: &Decision,
    ) -> Result<(), Box<dyn std::error::Error>> {
        sqlx::query(
            r#"
            INSERT INTO decisions
            (id, decision_type, action, confidence, reasoning, predicted_outcome, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#
        )
        .bind(&decision.id)
        .bind(format!("{:?}", decision.decision_type))
        .bind(&decision.action)
        .bind(decision.confidence)
        .bind(serde_json::to_value(&decision.reasoning)?)
        .bind(serde_json::to_value(&decision.predicted_outcome)?)
        .bind(decision.created_at)
        .execute(&self.db)
        .await?;

        Ok(())
    }
}
```

## Feedback Loop

Track decision outcomes to improve future decisions:

```rust
pub struct FeedbackLoop {
    db: PgPool,
}

impl FeedbackLoop {
    pub async fn record_outcome(
        &self,
        decision_id: Uuid,
        actual_outcome: ActualOutcome,
    ) -> Result<(), Box<dyn std::error::Error>> {
        sqlx::query(
            r#"
            UPDATE decisions
            SET actual_outcome = $1, evaluated_at = NOW()
            WHERE id = $2
            "#
        )
        .bind(serde_json::to_value(&actual_outcome)?)
        .bind(decision_id)
        .execute(&self.db)
        .await?;

        // Learn from outcome
        self.update_decision_model(&actual_outcome).await?;

        Ok(())
    }

    async fn update_decision_model(
        &self,
        outcome: &ActualOutcome,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Adjust weights based on actual vs predicted outcomes
        // This would use machine learning in production
        Ok(())
    }

    pub async fn get_decision_accuracy(&self) -> Result<f64, Box<dyn std::error::Error>> {
        let result = sqlx::query_as::<_, (f64,)>(
            r#"
            SELECT
                AVG(
                    CASE
                        WHEN actual_outcome IS NOT NULL
                        THEN 1.0 - ABS(
                            (predicted_outcome->>'revenue_increase_pct')::FLOAT -
                            (actual_outcome->>'revenue_increase_pct')::FLOAT
                        ) / 100.0
                        ELSE NULL
                    END
                ) as accuracy
            FROM decisions
            WHERE actual_outcome IS NOT NULL
            "#
        )
        .fetch_one(&self.db)
        .await?;

        Ok(result.0)
    }
}

pub struct ActualOutcome {
    pub revenue_increase_pct: f64,
    pub lead_increase_pct: f64,
    pub satisfaction_increase_pct: f64,
    pub actual_implementation_days: u32,
}
```

## Autonomous Cycle

Set up periodic decision-making:

```rust
pub async fn autonomous_decision_cycle(engine: Arc<DecisionEngine>) {
    let mut interval = tokio::time::interval(Duration::from_secs(3600)); // Hourly

    loop {
        interval.tick().await;

        // Gather current metrics
        let context = gather_current_context().await;

        // Make decisions for each type
        for decision_type in [
            DecisionType::ContentOptimization,
            DecisionType::ServiceExpansion,
            DecisionType::PricingAdjustment,
        ] {
            match engine.make_decision(decision_type.clone(), context.clone()).await {
                Ok(decision) => {
                    log::info!("Decision made: {:?} with confidence: {}",
                        decision.action, decision.confidence);

                    // Auto-implement high-confidence decisions
                    if decision.confidence > 0.85 {
                        implement_decision(&decision).await;
                    }
                }
                Err(e) => log::error!("Decision failed: {}", e),
            }
        }
    }
}

async fn gather_current_context() -> HashMap<String, serde_json::Value> {
    let mut context = HashMap::new();

    // Gather metrics from database
    // Gather analytics data
    // Gather market signals

    context
}

async fn implement_decision(decision: &Decision) {
    // Execute the decided action
    log::info!("Implementing decision: {}", decision.action);
}
```

## Testing Decisions

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decision_scoring() {
        let scorer = DecisionScorer::new();

        let option = DecisionOption {
            name: "test".to_string(),
            description: "test".to_string(),
            revenue_impact: 0.8,
            satisfaction_impact: 0.7,
            visibility_impact: 0.6,
            efficiency_impact: 0.5,
            innovation_impact: 0.4,
            risk_factor: 0.2,
            implementation_days: 14,
            estimated_cost: 1000.0,
        };

        let score = scorer.score_option(&option);
        assert!(score > 0.0 && score <= 1.0);
    }
}
```

## Next Steps

Chapter 9 covers evolution and learning systems that continuously improve the platform through genetic algorithms and pattern recognition.
