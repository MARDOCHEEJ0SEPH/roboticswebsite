/**
 * RoboGuard Pro - MongoDB Schema Definitions
 * Using Mongoose for schema validation and management
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ==================== ROBOTS ====================
const RobotSchema = new Schema({
  name: { type: String, required: true },
  model: { type: String, required: true },
  serialNumber: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['online', 'offline', 'charging', 'maintenance', 'emergency'],
    default: 'offline'
  },
  batteryLevel: { type: Number, default: 100, min: 0, max: 100 },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  currentTask: String,
  capabilities: [String],
  firmwareVersion: String,
  totalDistanceKm: { type: Number, default: 0 },
  totalIncidentsDetected: { type: Number, default: 0 },
  lastSeen: Date,
  metadata: Schema.Types.Mixed
}, {
  timestamps: true,
  collection: 'robots'
});

// Create geospatial index for location queries
RobotSchema.index({ location: '2dsphere' });
RobotSchema.index({ status: 1 });

// ==================== PATROL ROUTES ====================
const PatrolRouteSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  waypoints: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    action: { type: String, enum: ['scan', 'patrol', 'wait', 'investigate'] }
  }],
  schedule: {
    type: String,
    enum: ['continuous', 'scheduled', 'on-demand'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal'
  },
  isActive: { type: Boolean, default: true },
  successRate: { type: Number, default: 0, min: 0, max: 100 },
  avgCompletionTime: Number, // minutes
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'patrol_routes'
});

PatrolRouteSchema.index({ isActive: 1, priority: -1 });

// ==================== ROBOT ASSIGNMENTS ====================
const RobotAssignmentSchema = new Schema({
  robotId: { type: Schema.Types.ObjectId, ref: 'Robot', required: true },
  routeId: { type: Schema.Types.ObjectId, ref: 'PatrolRoute', required: true },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'assigned'
  },
  assignedAt: { type: Date, default: Date.now },
  startedAt: Date,
  completedAt: Date,
  performanceScore: { type: Number, min: 0, max: 100 },
  metrics: {
    distanceCovered: Number,
    incidentsDetected: Number,
    batteryUsed: Number,
    duration: Number
  }
}, {
  timestamps: true,
  collection: 'robot_assignments'
});

RobotAssignmentSchema.index({ robotId: 1, status: 1 });
RobotAssignmentSchema.index({ routeId: 1 });

// ==================== THREATS ====================
const ThreatSchema = new Schema({
  threatLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  threatType: {
    type: String,
    required: true,
    enum: [
      'intrusion',
      'suspicious_person',
      'unauthorized_vehicle',
      'suspicious_object',
      'fire',
      'vandalism',
      'loitering',
      'aggressive_behavior',
      'theft',
      'other'
    ]
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  detectedByRobot: { type: Schema.Types.ObjectId, ref: 'Robot' },
  detectedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'false_alarm'],
    default: 'active'
  },
  confidenceScore: { type: Number, min: 0, max: 100 },
  description: String,
  videoUrl: String,
  imageUrls: [String],
  metadata: {
    detectionMethod: String,
    objectsDetected: [String],
    movementPattern: String,
    audioAnalysis: Schema.Types.Mixed
  },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: String,
  responseTime: Number // seconds
}, {
  timestamps: true,
  collection: 'threats'
});

ThreatSchema.index({ location: '2dsphere' });
ThreatSchema.index({ status: 1, threatLevel: -1 });
ThreatSchema.index({ detectedAt: -1 });

// ==================== INCIDENTS ====================
const IncidentSchema = new Schema({
  threatId: { type: Schema.Types.ObjectId, ref: 'Threat' },
  incidentType: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  reportedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
  responseTimeSeconds: Number,
  robotsInvolved: [{ type: Schema.Types.ObjectId, ref: 'Robot' }],
  actionsTaken: [{
    action: String,
    timestamp: Date,
    performedBy: String
  }],
  outcome: String,
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'incidents'
});

IncidentSchema.index({ reportedAt: -1 });
IncidentSchema.index({ severity: -1, status: 1 });

// ==================== USERS ====================
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'supervisor', 'operator', 'viewer'],
    default: 'operator'
  },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  preferences: {
    notifications: { type: Boolean, default: true },
    theme: { type: String, default: 'dark' },
    dashboardLayout: Schema.Types.Mixed
  },
  phoneNumber: String,
  avatar: String
}, {
  timestamps: true,
  collection: 'users'
});

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, isActive: 1 });

// ==================== ROBOT TELEMETRY ====================
const TelemetrySchema = new Schema({
  robotId: { type: Schema.Types.ObjectId, ref: 'Robot', required: true },
  timestamp: { type: Date, default: Date.now },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: [Number]
  },
  batteryLevel: Number,
  temperature: Number,
  cpuUsage: Number,
  memoryUsage: Number,
  speedKmh: Number,
  sensors: {
    thermal: Schema.Types.Mixed,
    camera: Schema.Types.Mixed,
    audio: Schema.Types.Mixed,
    lidar: Schema.Types.Mixed
  }
}, {
  timestamps: false,
  collection: 'robot_telemetry'
});

// TTL index - auto-delete telemetry older than 30 days
TelemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });
TelemetrySchema.index({ robotId: 1, timestamp: -1 });

// ==================== EVOLUTION METRICS ====================
const EvolutionMetricSchema = new Schema({
  metricType: {
    type: String,
    required: true,
    enum: [
      'patrol_efficiency',
      'threat_detection_accuracy',
      'response_time',
      'battery_optimization',
      'coverage_percentage',
      'false_positive_rate'
    ]
  },
  metricValue: { type: Number, required: true },
  context: Schema.Types.Mixed,
  recordedAt: { type: Date, default: Date.now },
  generation: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'evolution_metrics'
});

EvolutionMetricSchema.index({ metricType: 1, recordedAt: -1 });
EvolutionMetricSchema.index({ generation: -1 });

// ==================== A/B EXPERIMENTS ====================
const ABExperimentSchema = new Schema({
  name: { type: String, required: true },
  hypothesis: String,
  variantA: {
    name: String,
    config: Schema.Types.Mixed
  },
  variantB: {
    name: String,
    config: Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'completed', 'cancelled'],
    default: 'draft'
  },
  startedAt: Date,
  endedAt: Date,
  winner: { type: String, enum: ['a', 'b', 'inconclusive'] },
  results: {
    variantAMetrics: Schema.Types.Mixed,
    variantBMetrics: Schema.Types.Mixed,
    statisticalSignificance: Number,
    conclusionNotes: String
  }
}, {
  timestamps: true,
  collection: 'ab_experiments'
});

// ==================== AUTONOMOUS DECISIONS ====================
const AutonomousDecisionSchema = new Schema({
  decisionType: {
    type: String,
    required: true,
    enum: [
      'route_optimization',
      'threat_response',
      'resource_allocation',
      'maintenance_scheduling',
      'patrol_strategy'
    ]
  },
  context: Schema.Types.Mixed,
  decision: Schema.Types.Mixed,
  confidence: { type: Number, min: 0, max: 100 },
  reasoning: [String],
  outcome: String,
  madeAt: { type: Date, default: Date.now },
  evaluatedAt: Date,
  wasSuccessful: Boolean
}, {
  timestamps: true,
  collection: 'autonomous_decisions'
});

AutonomousDecisionSchema.index({ decisionType: 1, madeAt: -1 });

// ==================== ALERT RULES ====================
const AlertRuleSchema = new Schema({
  name: { type: String, required: true },
  condition: {
    field: String,
    operator: { type: String, enum: ['eq', 'gt', 'lt', 'gte', 'lte', 'contains'] },
    value: Schema.Types.Mixed
  },
  action: {
    type: { type: String, enum: ['email', 'sms', 'push', 'webhook'] },
    recipients: [String],
    message: String,
    webhookUrl: String
  },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }
}, {
  timestamps: true,
  collection: 'alert_rules'
});

// Export all models
module.exports = {
  Robot: mongoose.model('Robot', RobotSchema),
  PatrolRoute: mongoose.model('PatrolRoute', PatrolRouteSchema),
  RobotAssignment: mongoose.model('RobotAssignment', RobotAssignmentSchema),
  Threat: mongoose.model('Threat', ThreatSchema),
  Incident: mongoose.model('Incident', IncidentSchema),
  User: mongoose.model('User', UserSchema),
  Telemetry: mongoose.model('Telemetry', TelemetrySchema),
  EvolutionMetric: mongoose.model('EvolutionMetric', EvolutionMetricSchema),
  ABExperiment: mongoose.model('ABExperiment', ABExperimentSchema),
  AutonomousDecision: mongoose.model('AutonomousDecision', AutonomousDecisionSchema),
  AlertRule: mongoose.model('AlertRule', AlertRuleSchema)
};
