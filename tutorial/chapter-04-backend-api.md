# Chapter 4: Backend API Design with Rust

## Why Rust for Backend Services

Rust provides several advantages for building high-performance backend services:

- Memory safety without garbage collection
- Zero-cost abstractions
- Fearless concurrency
- Excellent async/await support
- Strong type system prevents entire classes of bugs
- Performance comparable to C/C++

## Project Structure

The decision engine service structure:

```
services/decision-engine/
├── src/
│   ├── main.rs              # Entry point and server setup
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── health.rs        # Health check endpoints
│   │   ├── decisions.rs     # Decision-related endpoints
│   │   └── metrics.rs       # Metrics endpoints
│   ├── models/
│   │   ├── mod.rs
│   │   ├── decision.rs      # Decision data structures
│   │   └── response.rs      # API response types
│   ├── services/
│   │   ├── mod.rs
│   │   ├── decision_service.rs  # Business logic
│   │   └── cache_service.rs     # Caching logic
│   └── utils/
│       ├── mod.rs
│       └── config.rs        # Configuration management
├── Cargo.toml
└── Dockerfile
```

## Setting Up the Main Application

Create `services/decision-engine/src/main.rs`:

```rust
use actix_web::{web, App, HttpServer, middleware};
use dotenv::dotenv;
use sqlx::postgres::PgPoolOptions;
use redis::Client as RedisClient;
use std::sync::Arc;
use tokio::sync::RwLock;

mod handlers;
mod models;
mod services;
mod utils;

use utils::config::Config;
use services::decision_service::DecisionService;

// Application state shared across requests
pub struct AppState {
    pub db: sqlx::PgPool,
    pub redis: RedisClient,
    pub decision_service: Arc<RwLock<DecisionService>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize environment and logging
    dotenv().ok();
    env_logger::init();

    log::info!("Starting Decision Engine service...");

    // Load configuration
    let config = Config::from_env();

    // Setup database connection pool
    let db_pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to PostgreSQL");

    log::info!("Connected to PostgreSQL database");

    // Setup Redis client
    let redis_client = RedisClient::open(config.redis_url.clone())
        .expect("Failed to connect to Redis");

    log::info!("Connected to Redis");

    // Initialize decision service
    let decision_service = Arc::new(RwLock::new(
        DecisionService::new(db_pool.clone(), redis_client.clone())
    ));

    // Create application state
    let app_state = web::Data::new(AppState {
        db: db_pool,
        redis: redis_client,
        decision_service: decision_service.clone(),
    });

    log::info!("Starting HTTP server on 0.0.0.0:8080");

    // Start HTTP server
    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            .configure(configure_routes)
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}

// Configure all routes
fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api")
            .service(
                web::scope("/health")
                    .route("", web::get().to(handlers::health::health_check))
            )
            .service(
                web::scope("/decisions")
                    .route("", web::post().to(handlers::decisions::create_decision))
                    .route("", web::get().to(handlers::decisions::list_decisions))
                    .route("/{id}", web::get().to(handlers::decisions::get_decision))
            )
            .service(
                web::scope("/metrics")
                    .route("", web::get().to(handlers::metrics::get_metrics))
            )
    );
}
```

## Configuration Management

Create `services/decision-engine/src/utils/config.rs`:

```rust
use std::env;

pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        Config {
            database_url: env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set"),
            redis_url: env::var("REDIS_URL")
                .expect("REDIS_URL must be set"),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .expect("PORT must be a valid number"),
        }
    }
}
```

Create `services/decision-engine/src/utils/mod.rs`:

```rust
pub mod config;
```

## Data Models

Create `services/decision-engine/src/models/decision.rs`:

```rust
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DecisionType {
    ContentOptimization,
    ServiceExpansion,
    PricingAdjustment,
    UxImprovement,
    MarketingCampaign,
    TechnicalOptimization,
    ProcessAutomation,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Decision {
    pub id: Uuid,
    pub decision_type: String,
    pub action: String,
    pub confidence: f64,
    pub reasoning: sqlx::types::JsonValue,
    pub predicted_outcome: sqlx::types::JsonValue,
    pub actual_outcome: Option<sqlx::types::JsonValue>,
    pub created_at: DateTime<Utc>,
    pub implemented_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDecisionRequest {
    pub decision_type: DecisionType,
    pub context: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct DecisionResponse {
    pub id: Uuid,
    pub decision_type: String,
    pub action: String,
    pub confidence: f64,
    pub reasoning: Vec<String>,
    pub predicted_outcome: PredictedOutcome,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PredictedOutcome {
    pub revenue_increase_pct: f64,
    pub lead_increase_pct: f64,
    pub satisfaction_increase_pct: f64,
    pub implementation_days: u32,
}
```

Create `services/decision-engine/src/models/response.rs`:

```rust
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        ApiResponse {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct HealthStatus {
    pub status: String,
    pub database: String,
    pub cache: String,
    pub timestamp: String,
}
```

Create `services/decision-engine/src/models/mod.rs`:

```rust
pub mod decision;
pub mod response;
```

## API Handlers

Create `services/decision-engine/src/handlers/health.rs`:

```rust
use actix_web::{web, HttpResponse};
use chrono::Utc;

use crate::AppState;
use crate::models::response::{ApiResponse, HealthStatus};

pub async fn health_check(data: web::Data<AppState>) -> HttpResponse {
    // Check database connection
    let db_status = match sqlx::query("SELECT 1")
        .fetch_one(&data.db)
        .await
    {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };

    // Check Redis connection
    let cache_status = match data.redis.get_connection() {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };

    let health = HealthStatus {
        status: if db_status == "healthy" && cache_status == "healthy" {
            "healthy".to_string()
        } else {
            "unhealthy".to_string()
        },
        database: db_status.to_string(),
        cache: cache_status.to_string(),
        timestamp: Utc::now().to_rfc3339(),
    };

    HttpResponse::Ok().json(ApiResponse::success(health))
}
```

Create `services/decision-engine/src/handlers/decisions.rs`:

```rust
use actix_web::{web, HttpResponse};
use uuid::Uuid;

use crate::AppState;
use crate::models::decision::{CreateDecisionRequest, DecisionResponse};
use crate::models::response::ApiResponse;

pub async fn create_decision(
    data: web::Data<AppState>,
    request: web::Json<CreateDecisionRequest>,
) -> HttpResponse {
    let decision_service = data.decision_service.read().await;

    match decision_service.make_decision(&request).await {
        Ok(decision) => HttpResponse::Ok().json(ApiResponse::success(decision)),
        Err(e) => {
            log::error!("Failed to create decision: {}", e);
            HttpResponse::InternalServerError()
                .json(ApiResponse::<()>::error(e.to_string()))
        }
    }
}

pub async fn get_decision(
    data: web::Data<AppState>,
    path: web::Path<Uuid>,
) -> HttpResponse {
    let decision_id = path.into_inner();
    let decision_service = data.decision_service.read().await;

    match decision_service.get_decision(decision_id).await {
        Ok(Some(decision)) => HttpResponse::Ok().json(ApiResponse::success(decision)),
        Ok(None) => HttpResponse::NotFound()
            .json(ApiResponse::<()>::error("Decision not found".to_string())),
        Err(e) => {
            log::error!("Failed to fetch decision: {}", e);
            HttpResponse::InternalServerError()
                .json(ApiResponse::<()>::error(e.to_string()))
        }
    }
}

pub async fn list_decisions(
    data: web::Data<AppState>,
) -> HttpResponse {
    let decision_service = data.decision_service.read().await;

    match decision_service.list_decisions(50).await {
        Ok(decisions) => HttpResponse::Ok().json(ApiResponse::success(decisions)),
        Err(e) => {
            log::error!("Failed to list decisions: {}", e);
            HttpResponse::InternalServerError()
                .json(ApiResponse::<()>::error(e.to_string()))
        }
    }
}
```

Create `services/decision-engine/src/handlers/metrics.rs`:

```rust
use actix_web::{web, HttpResponse};
use serde::Serialize;

use crate::AppState;
use crate::models::response::ApiResponse;

#[derive(Debug, Serialize)]
pub struct MetricsSummary {
    pub total_decisions: i64,
    pub avg_confidence: f64,
    pub decisions_today: i64,
}

pub async fn get_metrics(data: web::Data<AppState>) -> HttpResponse {
    let result = sqlx::query_as::<_, (i64, f64, i64)>(
        r#"
        SELECT
            COUNT(*) as total_decisions,
            COALESCE(AVG(confidence), 0) as avg_confidence,
            COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day') as decisions_today
        FROM decisions
        "#
    )
    .fetch_one(&data.db)
    .await;

    match result {
        Ok((total, avg, today)) => {
            let metrics = MetricsSummary {
                total_decisions: total,
                avg_confidence: avg,
                decisions_today: today,
            };
            HttpResponse::Ok().json(ApiResponse::success(metrics))
        }
        Err(e) => {
            log::error!("Failed to fetch metrics: {}", e);
            HttpResponse::InternalServerError()
                .json(ApiResponse::<()>::error(e.to_string()))
        }
    }
}
```

Create `services/decision-engine/src/handlers/mod.rs`:

```rust
pub mod health;
pub mod decisions;
pub mod metrics;
```

## Business Logic Service

Create `services/decision-engine/src/services/decision_service.rs`:

```rust
use sqlx::PgPool;
use redis::Client as RedisClient;
use uuid::Uuid;
use chrono::Utc;

use crate::models::decision::{
    CreateDecisionRequest, Decision, DecisionResponse,
    DecisionType, PredictedOutcome
};

pub struct DecisionService {
    db: PgPool,
    redis: RedisClient,
}

impl DecisionService {
    pub fn new(db: PgPool, redis: RedisClient) -> Self {
        DecisionService { db, redis }
    }

    pub async fn make_decision(
        &self,
        request: &CreateDecisionRequest,
    ) -> Result<DecisionResponse, Box<dyn std::error::Error>> {
        // Generate decision based on type
        let (action, reasoning, predicted_outcome) = self.generate_decision_logic(
            &request.decision_type,
            &request.context
        )?;

        // Calculate confidence
        let confidence = self.calculate_confidence(&request.decision_type, &request.context);

        // Save to database
        let decision_id = Uuid::new_v4();
        let decision_type_str = format!("{:?}", request.decision_type);

        sqlx::query(
            r#"
            INSERT INTO decisions
            (id, decision_type, action, confidence, reasoning, predicted_outcome, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#
        )
        .bind(&decision_id)
        .bind(&decision_type_str)
        .bind(&action)
        .bind(confidence)
        .bind(serde_json::to_value(&reasoning)?)
        .bind(serde_json::to_value(&predicted_outcome)?)
        .bind(Utc::now())
        .execute(&self.db)
        .await?;

        Ok(DecisionResponse {
            id: decision_id,
            decision_type: decision_type_str,
            action,
            confidence,
            reasoning,
            predicted_outcome,
        })
    }

    pub async fn get_decision(
        &self,
        id: Uuid,
    ) -> Result<Option<Decision>, Box<dyn std::error::Error>> {
        let decision = sqlx::query_as::<_, Decision>(
            "SELECT * FROM decisions WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.db)
        .await?;

        Ok(decision)
    }

    pub async fn list_decisions(
        &self,
        limit: i64,
    ) -> Result<Vec<Decision>, Box<dyn std::error::Error>> {
        let decisions = sqlx::query_as::<_, Decision>(
            "SELECT * FROM decisions ORDER BY created_at DESC LIMIT $1"
        )
        .bind(limit)
        .fetch_all(&self.db)
        .await?;

        Ok(decisions)
    }

    fn generate_decision_logic(
        &self,
        decision_type: &DecisionType,
        context: &serde_json::Value,
    ) -> Result<(String, Vec<String>, PredictedOutcome), Box<dyn std::error::Error>> {
        match decision_type {
            DecisionType::ContentOptimization => {
                let action = "Generate 3 new pillar pages targeting high-intent keywords".to_string();
                let reasoning = vec![
                    "Low organic traffic detected in analytics".to_string(),
                    "Competitor analysis shows content gaps".to_string(),
                    "High-intent keywords identified with low competition".to_string(),
                ];
                let outcome = PredictedOutcome {
                    revenue_increase_pct: 25.0,
                    lead_increase_pct: 40.0,
                    satisfaction_increase_pct: 10.0,
                    implementation_days: 7,
                };
                Ok((action, reasoning, outcome))
            }
            DecisionType::ServiceExpansion => {
                let action = "Launch AI consulting service tier".to_string();
                let reasoning = vec![
                    "High demand signals from lead inquiries".to_string(),
                    "Competitive advantage in AI expertise".to_string(),
                    "Market opportunity with 40% growth rate".to_string(),
                ];
                let outcome = PredictedOutcome {
                    revenue_increase_pct: 50.0,
                    lead_increase_pct: 30.0,
                    satisfaction_increase_pct: 20.0,
                    implementation_days: 30,
                };
                Ok((action, reasoning, outcome))
            }
            _ => {
                let action = "Continue current strategy".to_string();
                let reasoning = vec!["Insufficient data for decision".to_string()];
                let outcome = PredictedOutcome {
                    revenue_increase_pct: 0.0,
                    lead_increase_pct: 0.0,
                    satisfaction_increase_pct: 0.0,
                    implementation_days: 0,
                };
                Ok((action, reasoning, outcome))
            }
        }
    }

    fn calculate_confidence(
        &self,
        decision_type: &DecisionType,
        context: &serde_json::Value,
    ) -> f64 {
        // Simple confidence calculation
        // In production, this would use ML models
        match decision_type {
            DecisionType::ContentOptimization => 0.85,
            DecisionType::ServiceExpansion => 0.75,
            _ => 0.60,
        }
    }
}
```

Create `services/decision-engine/src/services/mod.rs`:

```rust
pub mod decision_service;
```

## Testing the API

### Unit Testing

Add to `services/decision-engine/src/main.rs` (at the bottom):

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decision_type_serialization() {
        let decision_type = DecisionType::ContentOptimization;
        let json = serde_json::to_string(&decision_type).unwrap();
        assert_eq!(json, r#""content_optimization"#);
    }
}
```

### Integration Testing

Create `services/decision-engine/tests/api_tests.rs`:

```rust
use actix_web::{test, web, App};

#[actix_web::test]
async fn test_health_check() {
    let app = test::init_service(
        App::new()
            .route("/health", web::get().to(handlers::health::health_check))
    ).await;

    let req = test::TestRequest::get()
        .uri("/health")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}
```

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8080/api/health

# Create decision
curl -X POST http://localhost:8080/api/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "decision_type": "content_optimization",
    "context": {"traffic": "low", "conversions": 50}
  }'

# Get decision
curl http://localhost:8080/api/decisions/{decision-id}

# List decisions
curl http://localhost:8080/api/decisions

# Get metrics
curl http://localhost:8080/api/metrics
```

## Error Handling

Implement custom error types in `services/decision-engine/src/utils/errors.rs`:

```rust
use actix_web::{error::ResponseError, http::StatusCode, HttpResponse};
use std::fmt;

#[derive(Debug)]
pub enum ApiError {
    DatabaseError(String),
    NotFound(String),
    ValidationError(String),
    InternalError(String),
}

impl fmt::Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ApiError::DatabaseError(msg) => write!(f, "Database error: {}", msg),
            ApiError::NotFound(msg) => write!(f, "Not found: {}", msg),
            ApiError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            ApiError::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl ResponseError for ApiError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ApiError::DatabaseError(_) => {
                HttpResponse::InternalServerError().json(self.to_string())
            }
            ApiError::NotFound(_) => {
                HttpResponse::NotFound().json(self.to_string())
            }
            ApiError::ValidationError(_) => {
                HttpResponse::BadRequest().json(self.to_string())
            }
            ApiError::InternalError(_) => {
                HttpResponse::InternalServerError().json(self.to_string())
            }
        }
    }
}
```

## Building and Running

```bash
# Build the service
cd services/decision-engine
cargo build --release

# Run tests
cargo test

# Run in development mode
cargo run

# Run with Docker
docker-compose up decision-engine
```

## API Documentation

Consider adding Swagger/OpenAPI documentation. Add to `Cargo.toml`:

```toml
utoipa = "3.0"
utoipa-swagger-ui = "3.0"
```

Then annotate your endpoints:

```rust
use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::health::health_check,
        handlers::decisions::create_decision,
    ),
    components(schemas(DecisionResponse, HealthStatus))
)]
struct ApiDoc;
```

## Next Steps

Chapter 5 will dive into database integration, covering schema design, migrations, query optimization, and data persistence patterns for your autonomous service platform.
