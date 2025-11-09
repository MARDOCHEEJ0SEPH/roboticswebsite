//! Utility functions

pub fn normalize_score(score: f64) -> f64 {
    score.clamp(0.0, 1.0)
}

pub fn calculate_confidence(data_points: usize, accuracy: f64) -> f64 {
    if data_points == 0 {
        return 0.0;
    }
    (accuracy * (data_points as f64).ln() / 10.0).min(1.0)
}
