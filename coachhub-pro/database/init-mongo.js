/**
 * MongoDB Initialization Script for CoachHub Pro
 */

db = db.getSiblingDB('coachhub');

print('🤖 Initializing CoachHub Pro Database...');

// Create collections
db.createCollection('users');
db.createCollection('coachprofiles');
db.createCollection('studentprofiles');
db.createCollection('subscriptions');
db.createCollection('sessions');
db.createCollection('payments');
db.createCollection('reviews');
db.createCollection('notifications');
db.createCollection('messages');

print('✅ Collections created');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.coachprofiles.createIndex({ "userId": 1 }, { unique: true });
db.coachprofiles.createIndex({ "expertise": 1 });
db.coachprofiles.createIndex({ "rating": -1 });
db.coachprofiles.createIndex({ "isActive": 1, "isFeatured": -1 });

db.studentprofiles.createIndex({ "userId": 1 }, { unique: true });

db.subscriptions.createIndex({ "studentId": 1, "status": 1 });
db.subscriptions.createIndex({ "coachId": 1, "status": 1 });
db.subscriptions.createIndex({ "stripeSubscriptionId": 1 });

db.sessions.createIndex({ "coachId": 1, "scheduledAt": 1 });
db.sessions.createIndex({ "studentId": 1, "scheduledAt": 1 });
db.sessions.createIndex({ "scheduledAt": 1, "status": 1 });

db.payments.createIndex({ "userId": 1, "createdAt": -1 });
db.payments.createIndex({ "subscriptionId": 1 });

db.reviews.createIndex({ "coachId": 1, "createdAt": -1 });

db.notifications.createIndex({ "userId": 1, "isRead": 1, "createdAt": -1 });

db.messages.createIndex({ "senderId": 1, "recipientId": 1, "createdAt": -1 });

print('✅ Indexes created');

// Insert demo admin user
db.users.insertOne({
  email: 'admin@coachhub.pro',
  password: '$2a$10$XYZ...', // Change in production
  name: 'Admin User',
  role: 'admin',
  isVerified: true,
  createdAt: new Date()
});

print('✅ Demo admin user created');

// Insert demo coaches
const demoCoaches = [
  {
    email: 'sarah@coachhub.pro',
    password: '$2a$10$demo_hash',
    name: 'Sarah Johnson',
    role: 'coach',
    isVerified: true,
    createdAt: new Date()
  },
  {
    email: 'mike@coachhub.pro',
    password: '$2a$10$demo_hash',
    name: 'Mike Chen',
    role: 'coach',
    isVerified: true,
    createdAt: new Date()
  },
  {
    email: 'emma@coachhub.pro',
    password: '$2a$10$demo_hash',
    name: 'Emma Davis',
    role: 'coach',
    isVerified: true,
    createdAt: new Date()
  }
];

db.users.insertMany(demoCoaches);

print('✅ Demo coaches created');

print('🎉 Database initialization complete!');
