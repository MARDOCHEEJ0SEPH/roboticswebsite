-- RoboGuard Pro Database Schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Robots table
CREATE TABLE robots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'offline', -- online, offline, charging, maintenance, emergency
    battery_level INTEGER DEFAULT 100,
    location GEOGRAPHY(POINT, 4326),
    current_task VARCHAR(100),
    capabilities JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP,
    firmware_version VARCHAR(50),
    total_distance_km DECIMAL(10, 2) DEFAULT 0,
    total_incidents_detected INTEGER DEFAULT 0
);

-- Patrol routes
CREATE TABLE patrol_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    waypoints JSONB NOT NULL, -- Array of {lat, lng, action}
    schedule VARCHAR(50), -- continuous, scheduled, on-demand
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    is_active BOOLEAN DEFAULT true,
    success_rate DECIMAL(5, 2) DEFAULT 0,
    avg_completion_time INTEGER, -- minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Robot assignments
CREATE TABLE robot_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    robot_id UUID REFERENCES robots(id) ON DELETE CASCADE,
    route_id UUID REFERENCES patrol_routes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned', -- assigned, in_progress, completed, failed
    performance_score DECIMAL(5, 2)
);

-- Threats table
CREATE TABLE threats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_level VARCHAR(20) NOT NULL, -- low, medium, high, critical
    threat_type VARCHAR(100) NOT NULL, -- intrusion, suspicious_person, unauthorized_vehicle, etc.
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    detected_by_robot_id UUID REFERENCES robots(id),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, investigating, resolved, false_alarm
    confidence_score DECIMAL(5, 2),
    description TEXT,
    video_url VARCHAR(500),
    image_urls JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    assigned_to UUID REFERENCES users(id),
    resolution_notes TEXT
);

-- Incidents table
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    threat_id UUID REFERENCES threats(id),
    incident_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    response_time_seconds INTEGER,
    robots_involved JSONB DEFAULT '[]',
    actions_taken JSONB DEFAULT '[]',
    outcome VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id)
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(50) DEFAULT 'operator', -- admin, supervisor, operator, viewer
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}'
);

-- Alert rules
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    condition JSONB NOT NULL, -- Rule conditions
    action JSONB NOT NULL, -- Actions to take
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Robot telemetry (time-series data)
CREATE TABLE robot_telemetry (
    id BIGSERIAL PRIMARY KEY,
    robot_id UUID REFERENCES robots(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    location GEOGRAPHY(POINT, 4326),
    battery_level INTEGER,
    temperature DECIMAL(5, 2),
    cpu_usage DECIMAL(5, 2),
    memory_usage DECIMAL(5, 2),
    speed_kmh DECIMAL(5, 2),
    sensors JSONB DEFAULT '{}'
);

-- Create index on timestamp for time-series queries
CREATE INDEX idx_telemetry_timestamp ON robot_telemetry(timestamp DESC);
CREATE INDEX idx_telemetry_robot_id ON robot_telemetry(robot_id);

-- Evolution metrics (for autonomous learning)
CREATE TABLE evolution_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL, -- patrol_efficiency, threat_detection_accuracy, etc.
    metric_value DECIMAL(10, 4) NOT NULL,
    context JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generation INTEGER DEFAULT 0 -- Evolution generation number
);

-- A/B Test experiments
CREATE TABLE ab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    hypothesis TEXT,
    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'running', -- running, completed, cancelled
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    winner VARCHAR(10), -- a, b, or inconclusive
    results JSONB DEFAULT '{}'
);

-- Autonomous decisions log
CREATE TABLE autonomous_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_type VARCHAR(100) NOT NULL,
    context JSONB NOT NULL,
    decision JSONB NOT NULL,
    confidence DECIMAL(5, 2),
    reasoning JSONB DEFAULT '[]',
    outcome VARCHAR(100),
    made_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    evaluated_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_robots_status ON robots(status);
CREATE INDEX idx_robots_location ON robots USING GIST(location);
CREATE INDEX idx_threats_status ON threats(status);
CREATE INDEX idx_threats_location ON threats USING GIST(location);
CREATE INDEX idx_threats_detected_at ON threats(detected_at DESC);
CREATE INDEX idx_incidents_reported_at ON incidents(reported_at DESC);
CREATE INDEX idx_patrol_routes_active ON patrol_routes(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_robots_updated_at BEFORE UPDATE ON robots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patrol_routes_updated_at BEFORE UPDATE ON patrol_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@roboguard.pro', '$2a$10$dummy', 'System Administrator', 'admin'),
('operator@roboguard.pro', '$2a$10$dummy', 'Security Operator', 'operator');

INSERT INTO robots (name, model, serial_number, status, location, capabilities) VALUES
('RG-Alpha-01', 'Guardian X1', 'RG-X1-001', 'online', ST_Point(-122.4194, 37.7749)::geography,
 '["thermal_camera", "hd_camera", "audio_sensor", "two_way_audio", "motion_detection"]'),
('RG-Beta-02', 'Guardian X1', 'RG-X1-002', 'online', ST_Point(-122.4184, 37.7759)::geography,
 '["thermal_camera", "hd_camera", "audio_sensor", "lidar", "motion_detection"]'),
('RG-Gamma-03', 'Sentinel S2', 'RG-S2-001', 'charging', ST_Point(-122.4174, 37.7739)::geography,
 '["hd_camera", "audio_sensor", "motion_detection", "air_quality"]');

INSERT INTO patrol_routes (name, description, waypoints, schedule, priority) VALUES
('Main Entrance Loop', 'Primary patrol covering main entrances and lobby',
 '[{"lat": 37.7749, "lng": -122.4194, "action": "scan"},
   {"lat": 37.7750, "lng": -122.4195, "action": "patrol"},
   {"lat": 37.7748, "lng": -122.4193, "action": "scan"}]',
 'continuous', 'high'),
('Parking Lot Sweep', 'Complete parking lot coverage',
 '[{"lat": 37.7759, "lng": -122.4184, "action": "scan"},
   {"lat": 37.7760, "lng": -122.4185, "action": "patrol"},
   {"lat": 37.7758, "lng": -122.4183, "action": "scan"}]',
 'scheduled', 'normal');

-- Create views for analytics
CREATE VIEW robot_performance AS
SELECT
    r.id,
    r.name,
    r.status,
    r.battery_level,
    r.total_distance_km,
    r.total_incidents_detected,
    COUNT(DISTINCT ra.id) as total_assignments,
    AVG(ra.performance_score) as avg_performance_score,
    EXTRACT(EPOCH FROM (MAX(r.last_seen) - MIN(r.created_at))) / 3600 as total_hours_active
FROM robots r
LEFT JOIN robot_assignments ra ON r.id = ra.robot_id
GROUP BY r.id;

CREATE VIEW threat_summary AS
SELECT
    DATE(detected_at) as date,
    threat_level,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence
FROM threats
GROUP BY DATE(detected_at), threat_level
ORDER BY date DESC;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO roboguard_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO roboguard_user;
