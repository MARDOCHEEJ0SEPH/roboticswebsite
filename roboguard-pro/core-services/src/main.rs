/**
 * RoboGuard Pro - Core Services
 * High-performance real-time telemetry processing
 * Powered by Autonomous Robotics Rust Framework
 */

use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use actix_cors::Cors;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;
use log::{info, error};
use anyhow::Result;

// Import autonomous framework
use autonomous_robotics::AutonomousFramework;

mod telemetry;
mod stream_processor;

use telemetry::TelemetryProcessor;
use stream_processor::StreamProcessor;

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    service: String,
    autonomous_framework: FrameworkStatus,
}

#[derive(Debug, Serialize, Deserialize)]
struct FrameworkStatus {
    initialized: bool,
    running: bool,
    mode: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct TelemetryData {
    robot_id: String,
    timestamp: i64,
    location: Option<Location>,
    battery_level: f64,
    temperature: Option<f64>,
    speed: Option<f64>,
    sensors: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Location {
    lat: f64,
    lng: f64,
}

#[derive(Debug, Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

// Application state
struct AppState {
    framework: Arc<RwLock<AutonomousFramework>>,
    telemetry_processor: Arc<RwLock<TelemetryProcessor>>,
    stream_processor: Arc<RwLock<StreamProcessor>>,
}

/// Health check endpoint
async fn health(data: web::Data<AppState>) -> impl Responder {
    let framework = data.framework.read().await;
    let status = framework.get_status();

    let response = HealthResponse {
        status: "healthy".to_string(),
        service: "core-services".to_string(),
        autonomous_framework: FrameworkStatus {
            initialized: true,
            running: status.running,
            mode: status.mode.clone(),
        },
    };

    HttpResponse::Ok().json(response)
}

/// Process telemetry data
async fn process_telemetry(
    data: web::Data<AppState>,
    telemetry: web::Json<TelemetryData>,
) -> impl Responder {
    info!("📊 Processing telemetry from robot: {}", telemetry.robot_id);

    let mut processor = data.telemetry_processor.write().await;

    match processor.process(telemetry.into_inner()).await {
        Ok(result) => {
            HttpResponse::Ok().json(ApiResponse {
                success: true,
                data: Some(result),
                error: None,
            })
        }
        Err(e) => {
            error!("Error processing telemetry: {}", e);
            HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(e.to_string()),
            })
        }
    }
}

/// Process telemetry batch
async fn process_telemetry_batch(
    data: web::Data<AppState>,
    batch: web::Json<Vec<TelemetryData>>,
) -> impl Responder {
    info!("📊 Processing telemetry batch: {} items", batch.len());

    let mut processor = data.telemetry_processor.write().await;

    match processor.process_batch(batch.into_inner()).await {
        Ok(result) => {
            HttpResponse::Ok().json(ApiResponse {
                success: true,
                data: Some(result),
                error: None,
            })
        }
        Err(e) => {
            error!("Error processing telemetry batch: {}", e);
            HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(e.to_string()),
            })
        }
    }
}

/// Get telemetry analytics
async fn get_analytics(
    data: web::Data<AppState>,
    robot_id: web::Path<String>,
) -> impl Responder {
    let processor = data.telemetry_processor.read().await;

    match processor.get_analytics(&robot_id).await {
        Ok(analytics) => {
            HttpResponse::Ok().json(ApiResponse {
                success: true,
                data: Some(analytics),
                error: None,
            })
        }
        Err(e) => {
            error!("Error getting analytics: {}", e);
            HttpResponse::InternalServerError().json(ApiResponse::<()> {
                success: false,
                data: None,
                error: Some(e.to_string()),
            })
        }
    }
}

/// Get framework status
async fn get_status(data: web::Data<AppState>) -> impl Responder {
    let framework = data.framework.read().await;
    let status = framework.get_status();

    HttpResponse::Ok().json(ApiResponse {
        success: true,
        data: Some(status),
        error: None,
    })
}

#[actix_web::main]
async fn main() -> Result<()> {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    info!("🤖 Starting RoboGuard Pro Core Services...");
    info!("🧠 Initializing Autonomous Framework...");

    // Initialize autonomous framework
    let config = autonomous_robotics::FrameworkConfig {
        mode: "autonomous".to_string(),
        evolution_rate: "aggressive".to_string(),
        learning_enabled: true,
        auto_deployment: true,
    };

    let framework = AutonomousFramework::new(config).await?;
    framework.start().await?;

    info!("✅ Autonomous Framework initialized");

    // Initialize processors
    let telemetry_processor = TelemetryProcessor::new();
    let stream_processor = StreamProcessor::new();

    // Create app state
    let app_state = web::Data::new(AppState {
        framework: Arc::new(RwLock::new(framework)),
        telemetry_processor: Arc::new(RwLock::new(telemetry_processor)),
        stream_processor: Arc::new(RwLock::new(stream_processor)),
    });

    info!("🚀 Starting HTTP server on port 8080...");

    // Start HTTP server
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .wrap(cors)
            .app_data(app_state.clone())
            .route("/health", web::get().to(health))
            .route("/api/telemetry", web::post().to(process_telemetry))
            .route("/api/telemetry/batch", web::post().to(process_telemetry_batch))
            .route("/api/analytics/{robot_id}", web::get().to(get_analytics))
            .route("/api/status", web::get().to(get_status))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await?;

    Ok(())
}
