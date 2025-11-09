/**
 * MongoDB Initialization Script
 * Creates database, collections, and indexes
 */

// Switch to roboguard database
db = db.getSiblingDB('roboguard');

print('🤖 Initializing RoboGuard Pro Database...');

// Create collections
db.createCollection('robots');
db.createCollection('threats');
db.createCollection('patrols');
db.createCollection('users');
db.createCollection('telemetry');
db.createCollection('alerts');

print('✅ Collections created');

// Create indexes

// Robots collection indexes
db.robots.createIndex({ "location": "2dsphere" });
db.robots.createIndex({ "status": 1 });
db.robots.createIndex({ "serialNumber": 1 }, { unique: true });
db.robots.createIndex({ "batteryLevel": 1 });
db.robots.createIndex({ "lastUpdate": -1 });

// Threats collection indexes
db.threats.createIndex({ "location": "2dsphere" });
db.threats.createIndex({ "status": 1 });
db.threats.createIndex({ "threatLevel": 1 });
db.threats.createIndex({ "detectedAt": -1 });
db.threats.createIndex({ "detectedBy": 1 });

// Patrols collection indexes
db.patrols.createIndex({ "status": 1 });
db.patrols.createIndex({ "startTime": 1 });
db.patrols.createIndex({ "assignedRobots": 1 });

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

// Telemetry collection indexes
db.telemetry.createIndex({ "robotId": 1 });
db.telemetry.createIndex({ "timestamp": -1 });
db.telemetry.createIndex({ "robotId": 1, "timestamp": -1 });

// Alerts collection indexes
db.alerts.createIndex({ "createdAt": -1 });
db.alerts.createIndex({ "status": 1 });

print('✅ Indexes created');

// Insert demo user
db.users.insertOne({
  email: 'admin@roboguard.com',
  password: '$2a$10$XYZ...', // hashed password (change in production)
  name: 'Admin User',
  role: 'admin',
  createdAt: new Date(),
  lastLogin: null
});

print('✅ Demo user created');

// Insert demo robots
db.robots.insertMany([
  {
    name: 'Guardian-01',
    model: 'RG-X1000',
    serialNumber: 'RGX-001-2024',
    status: 'online',
    batteryLevel: 95,
    location: {
      type: 'Point',
      coordinates: [-122.4194, 37.7749] // [lng, lat] - San Francisco
    },
    currentTask: 'Patrol Zone A',
    capabilities: ['patrol', 'surveillance', 'threat_detection', 'emergency_response'],
    sensors: {
      camera: 'active',
      lidar: 'active',
      thermal: 'active',
      motion: 'active'
    },
    lastUpdate: new Date(),
    createdAt: new Date()
  },
  {
    name: 'Sentinel-02',
    model: 'RG-X1000',
    serialNumber: 'RGX-002-2024',
    status: 'online',
    batteryLevel: 87,
    location: {
      type: 'Point',
      coordinates: [-122.4195, 37.7750]
    },
    currentTask: 'Perimeter Check',
    capabilities: ['patrol', 'surveillance', 'perimeter_security'],
    sensors: {
      camera: 'active',
      lidar: 'active',
      motion: 'active'
    },
    lastUpdate: new Date(),
    createdAt: new Date()
  },
  {
    name: 'Watcher-03',
    model: 'RG-X2000',
    serialNumber: 'RGX-003-2024',
    status: 'charging',
    batteryLevel: 45,
    location: {
      type: 'Point',
      coordinates: [-122.4193, 37.7748]
    },
    currentTask: null,
    capabilities: ['surveillance', 'threat_detection', 'analytics'],
    sensors: {
      camera: 'active',
      thermal: 'active'
    },
    lastUpdate: new Date(),
    createdAt: new Date()
  }
]);

print('✅ Demo robots inserted');

// Insert demo patrol
db.patrols.insertOne({
  name: 'Evening Perimeter Patrol',
  route: [
    { type: 'Point', coordinates: [-122.4194, 37.7749] },
    { type: 'Point', coordinates: [-122.4200, 37.7755] },
    { type: 'Point', coordinates: [-122.4190, 37.7760] },
    { type: 'Point', coordinates: [-122.4185, 37.7750] }
  ],
  schedule: {
    frequency: 'daily',
    startTime: '18:00',
    duration: 120
  },
  priority: 'high',
  status: 'active',
  assignedRobots: [],
  createdAt: new Date()
});

print('✅ Demo patrol inserted');

print('🎉 Database initialization complete!');
