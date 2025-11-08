use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub timestamp: DateTime<Utc>,
    pub revenue: f64,
    pub leads: u64,
    pub conversions: u64,
    pub conversion_rate: f64,
    pub page_views: u64,
    pub unique_visitors: u64,
    pub avg_session_duration: f64,
    pub bounce_rate: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIVisibilityMetrics {
    pub chatgpt_citations: u64,
    pub claude_citations: u64,
    pub perplexity_citations: u64,
    pub gemini_citations: u64,
    pub overall_visibility_score: f64,
    pub keyword_rankings: Vec<KeywordRanking>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeywordRanking {
    pub keyword: String,
    pub platform: String,
    pub position: u32,
    pub citation_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceOffering {
    pub id: String,
    pub name: String,
    pub description: String,
    pub base_price: f64,
    pub margin: f64,
    pub demand_level: f64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lead {
    pub id: String,
    pub source: String,
    pub qualification_score: f64,
    pub service_interest: Vec<String>,
    pub estimated_value: f64,
    pub created_at: DateTime<Utc>,
    pub status: LeadStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LeadStatus {
    New,
    Qualified,
    Contacted,
    Proposal,
    Negotiation,
    Won,
    Lost,
}
