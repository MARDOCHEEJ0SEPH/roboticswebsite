use chrono::{DateTime, Utc};

pub fn timestamp() -> DateTime<Utc> {
    Utc::now()
}

pub fn normalize_score(score: f64) -> f64 {
    score.clamp(0.0, 1.0)
}

pub fn calculate_confidence(data_points: usize, accuracy: f64) -> f64 {
    if data_points == 0 {
        return 0.0;
    }
    (accuracy * (data_points as f64).ln() / 10.0).min(1.0)
}

pub fn weighted_average(values: &[(f64, f64)]) -> f64 {
    let total_weight: f64 = values.iter().map(|(_, w)| w).sum();
    if total_weight == 0.0 {
        return 0.0;
    }
    values.iter().map(|(v, w)| v * w).sum::<f64>() / total_weight
}
