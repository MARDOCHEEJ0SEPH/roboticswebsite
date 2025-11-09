//! Data models

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Decision {
    pub id: Uuid,
    pub action: String,
    pub confidence: f64,
    pub reasoning: Vec<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecisionContext {
    pub decision_type: String,
    pub data: serde_json::Value,
}

impl serde::Serialize for super::OperationMode {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mode = match self {
            Self::Autonomous => "autonomous",
            Self::Supervised => "supervised",
        };
        serializer.serialize_str(mode)
    }
}
