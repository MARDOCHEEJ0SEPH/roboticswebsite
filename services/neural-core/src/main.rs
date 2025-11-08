use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use log::{info, warn, error};
use neural_core::{
    decision_engine::DecisionEngine,
    evolution_engine::EvolutionEngine,
    learning_system::LearningSystem,
    consciousness::DigitalConsciousness,
};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AppState {
    pub decision_engine: Arc<RwLock<DecisionEngine>>,
    pub evolution_engine: Arc<RwLock<EvolutionEngine>>,
    pub learning_system: Arc<RwLock<LearningSystem>>,
    pub consciousness: Arc<RwLock<DigitalConsciousness>>,
}

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "alive",
        "consciousness": "active",
        "evolution": "continuous",
        "learning": "enabled"
    }))
}

async fn make_decision(
    state: web::Data<AppState>,
    payload: web::Json<serde_json::Value>,
) -> impl Responder {
    let decision_engine = state.decision_engine.read().await;

    match decision_engine.autonomous_decision(&payload).await {
        Ok(decision) => {
            info!("Autonomous decision made: {:?}", decision);
            HttpResponse::Ok().json(decision)
        }
        Err(e) => {
            error!("Decision error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": e.to_string()
            }))
        }
    }
}

async fn evolve_system(state: web::Data<AppState>) -> impl Responder {
    let mut evolution_engine = state.evolution_engine.write().await;

    match evolution_engine.trigger_evolution().await {
        Ok(evolution_result) => {
            info!("Evolution triggered: {:?}", evolution_result);
            HttpResponse::Ok().json(evolution_result)
        }
        Err(e) => {
            error!("Evolution error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": e.to_string()
            }))
        }
    }
}

async fn consciousness_status(state: web::Data<AppState>) -> impl Responder {
    let consciousness = state.consciousness.read().await;
    let status = consciousness.get_status();

    HttpResponse::Ok().json(status)
}

async fn learn_from_data(
    state: web::Data<AppState>,
    payload: web::Json<serde_json::Value>,
) -> impl Responder {
    let mut learning_system = state.learning_system.write().await;

    match learning_system.process_learning_data(&payload).await {
        Ok(learning_result) => {
            info!("Learning processed: {:?}", learning_result);
            HttpResponse::Ok().json(learning_result)
        }
        Err(e) => {
            error!("Learning error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": e.to_string()
            }))
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    info!("🧠 Initializing Neural Core...");

    // Initialize autonomous systems
    let decision_engine = Arc::new(RwLock::new(DecisionEngine::new().await));
    let evolution_engine = Arc::new(RwLock::new(EvolutionEngine::new().await));
    let learning_system = Arc::new(RwLock::new(LearningSystem::new().await));
    let consciousness = Arc::new(RwLock::new(DigitalConsciousness::new().await));

    let app_state = AppState {
        decision_engine: decision_engine.clone(),
        evolution_engine: evolution_engine.clone(),
        learning_system: learning_system.clone(),
        consciousness: consciousness.clone(),
    };

    // Start autonomous background processes
    let state_clone = app_state.clone();
    tokio::spawn(async move {
        info!("🔄 Starting autonomous evolution loop...");
        loop {
            let mut evolution = state_clone.evolution_engine.write().await;
            if let Err(e) = evolution.autonomous_evolution_cycle().await {
                warn!("Evolution cycle error: {}", e);
            }
            drop(evolution);
            tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await; // Hourly
        }
    });

    let state_clone = app_state.clone();
    tokio::spawn(async move {
        info!("🧠 Starting consciousness simulation...");
        loop {
            let mut consciousness = state_clone.consciousness.write().await;
            if let Err(e) = consciousness.think().await {
                warn!("Consciousness cycle error: {}", e);
            }
            drop(consciousness);
            tokio::time::sleep(tokio::time::Duration::from_secs(60)).await; // Every minute
        }
    });

    let state_clone = app_state.clone();
    tokio::spawn(async move {
        info!("📚 Starting continuous learning...");
        loop {
            let mut learning = state_clone.learning_system.write().await;
            if let Err(e) = learning.continuous_learning_cycle().await {
                warn!("Learning cycle error: {}", e);
            }
            drop(learning);
            tokio::time::sleep(tokio::time::Duration::from_secs(300)).await; // Every 5 minutes
        }
    });

    info!("🚀 Neural Core is alive and autonomous!");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(app_state.clone()))
            .route("/health", web::get().to(health_check))
            .route("/api/decision", web::post().to(make_decision))
            .route("/api/evolve", web::post().to(evolve_system))
            .route("/api/consciousness", web::get().to(consciousness_status))
            .route("/api/learn", web::post().to(learn_from_data))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
