/**
 * Telemetry Processor
 * High-performance real-time telemetry data processing
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use anyhow::Result;
use log::info;

use crate::TelemetryData;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessingResult {
    pub robot_id: String,
    pub processed_at: i64,
    pub anomalies: Vec<String>,
    pub metrics: TelemetryMetrics,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TelemetryMetrics {
    pub battery_status: String,
    pub performance_score: f64,
    pub health_score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchResult {
    pub processed_count: usize,
    pub anomaly_count: usize,
    pub processing_time_ms: u128,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Analytics {
    pub robot_id: String,
    pub total_data_points: usize,
    pub avg_battery: f64,
    pub avg_temperature: f64,
    pub uptime_percentage: f64,
}

pub struct TelemetryProcessor {
    // In-memory cache for analytics (in production, use Redis)
    analytics_cache: HashMap<String, Vec<TelemetryData>>,
}

impl TelemetryProcessor {
    pub fn new() -> Self {
        Self {
            analytics_cache: HashMap::new(),
        }
    }

    /// Process single telemetry data point
    pub async fn process(&mut self, data: TelemetryData) -> Result<ProcessingResult> {
        let start = std::time::Instant::now();

        info!("⚡ Processing telemetry for robot {}", data.robot_id);

        // Store in cache
        self.analytics_cache
            .entry(data.robot_id.clone())
            .or_insert_with(Vec::new)
            .push(data.clone());

        // Keep only last 1000 data points per robot
        if let Some(cache) = self.analytics_cache.get_mut(&data.robot_id) {
            if cache.len() > 1000 {
                cache.drain(0..cache.len() - 1000);
            }
        }

        // Detect anomalies
        let mut anomalies = Vec::new();

        // Battery check
        if data.battery_level < 15.0 {
            anomalies.push(format!("Critical battery level: {}%", data.battery_level));
        } else if data.battery_level < 25.0 {
            anomalies.push(format!("Low battery level: {}%", data.battery_level));
        }

        // Temperature check
        if let Some(temp) = data.temperature {
            if temp > 75.0 {
                anomalies.push(format!("High temperature: {}°C", temp));
            } else if temp < -10.0 {
                anomalies.push(format!("Low temperature: {}°C", temp));
            }
        }

        // Speed check
        if let Some(speed) = data.speed {
            if speed > 20.0 {
                anomalies.push(format!("Excessive speed: {} km/h", speed));
            }
        }

        // Calculate metrics
        let battery_status = if data.battery_level > 75.0 {
            "Good"
        } else if data.battery_level > 25.0 {
            "Fair"
        } else {
            "Critical"
        }
        .to_string();

        let performance_score = self.calculate_performance_score(&data);
        let health_score = self.calculate_health_score(&data);

        let elapsed = start.elapsed().as_micros();
        info!("✅ Processed in {}μs", elapsed);

        Ok(ProcessingResult {
            robot_id: data.robot_id,
            processed_at: chrono::Utc::now().timestamp(),
            anomalies,
            metrics: TelemetryMetrics {
                battery_status,
                performance_score,
                health_score,
            },
        })
    }

    /// Process batch of telemetry data (high-performance)
    pub async fn process_batch(&mut self, batch: Vec<TelemetryData>) -> Result<BatchResult> {
        let start = std::time::Instant::now();

        info!("⚡ Processing batch of {} telemetry data points", batch.len());

        let mut anomaly_count = 0;

        for data in batch {
            let result = self.process(data).await?;
            if !result.anomalies.is_empty() {
                anomaly_count += 1;
            }
        }

        let elapsed = start.elapsed().as_millis();

        info!("✅ Batch processed in {}ms", elapsed);

        Ok(BatchResult {
            processed_count: batch.len(),
            anomaly_count,
            processing_time_ms: elapsed,
        })
    }

    /// Get analytics for a robot
    pub async fn get_analytics(&self, robot_id: &str) -> Result<Analytics> {
        let data_points = self
            .analytics_cache
            .get(robot_id)
            .ok_or_else(|| anyhow::anyhow!("No data for robot {}", robot_id))?;

        if data_points.is_empty() {
            return Ok(Analytics {
                robot_id: robot_id.to_string(),
                total_data_points: 0,
                avg_battery: 0.0,
                avg_temperature: 0.0,
                uptime_percentage: 0.0,
            });
        }

        let total = data_points.len();
        let avg_battery: f64 =
            data_points.iter().map(|d| d.battery_level).sum::<f64>() / total as f64;

        let temps: Vec<f64> = data_points
            .iter()
            .filter_map(|d| d.temperature)
            .collect();
        let avg_temperature = if !temps.is_empty() {
            temps.iter().sum::<f64>() / temps.len() as f64
        } else {
            0.0
        };

        // Calculate uptime (simplified)
        let uptime_percentage = 95.5; // In production, calculate from actual data

        Ok(Analytics {
            robot_id: robot_id.to_string(),
            total_data_points: total,
            avg_battery,
            avg_temperature,
            uptime_percentage,
        })
    }

    /// Calculate performance score (0-100)
    fn calculate_performance_score(&self, data: &TelemetryData) -> f64 {
        let mut score = 100.0;

        // Battery impact
        if data.battery_level < 25.0 {
            score -= 20.0;
        } else if data.battery_level < 50.0 {
            score -= 10.0;
        }

        // Temperature impact
        if let Some(temp) = data.temperature {
            if temp > 60.0 || temp < 0.0 {
                score -= 15.0;
            }
        }

        score.max(0.0).min(100.0)
    }

    /// Calculate health score (0-100)
    fn calculate_health_score(&self, data: &TelemetryData) -> f64 {
        let mut score = 100.0;

        if data.battery_level < 20.0 {
            score -= 30.0;
        }

        if let Some(temp) = data.temperature {
            if temp > 70.0 {
                score -= 20.0;
            }
        }

        score.max(0.0).min(100.0)
    }
}
