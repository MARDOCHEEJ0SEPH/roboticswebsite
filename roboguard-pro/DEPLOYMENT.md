# RoboGuard Pro - Deployment Guide

## Quick Start with Docker Compose

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum
- 20GB disk space

### 1. Clone and Setup

```bash
cd roboguard-pro
cp .env.example .env
# Edit .env and add your API keys
```

### 2. Start All Services

```bash
docker-compose up -d
```

This will start:
- **MongoDB** (port 27017) - Database
- **Redis** (port 6379) - Caching & Pub/Sub
- **Backend** (port 8000) - Node.js API with JavaScript Framework
- **AI Engine** (port 8001) - Python threat detection with Python Framework
- **Core Services** (port 8080) - Rust real-time processing with Rust Framework
- **Fleet Services** (port 8090) - Go fleet management with Go Framework
- **Frontend** (port 3000) - Next.js dashboard
- **Nginx** (port 80) - API Gateway

### 3. Verify Services

```bash
# Check all services are running
docker-compose ps

# Check backend health
curl http://localhost:8000/health

# Check AI engine health
curl http://localhost:8001/health

# Check core services health
curl http://localhost:8080/health

# Check fleet services health
curl http://localhost:8090/health
```

### 4. Access the Application

Open your browser to:
- **Dashboard**: http://localhost:3000
- **API Gateway**: http://localhost
- **API Docs**: http://localhost:8000/api

### 5. Default Credentials

For demo/testing:
- Email: `demo@roboguard.com`
- Password: Use the `/api/auth/demo` endpoint to get a token

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Nginx (Port 80)                        │
│                      API Gateway & Load Balancer             │
└─────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Engine     │
│   (Next.js)     │    │   (Node.js)     │    │   (Python)      │
│   Port 3000     │    │   Port 8000     │    │   Port 8001     │
│   ┌───────────┐ │    │   ┌───────────┐ │    │   ┌───────────┐ │
│   │    JS     │ │    │   │    JS     │ │    │   │  Python   │ │
│   │ Framework │ │    │   │ Framework │ │    │   │ Framework │ │
│   └───────────┘ │    │   └───────────┘ │    │   └───────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Core Services   │    │ Fleet Services  │    │   MongoDB       │
│   (Rust)        │    │   (Go)          │    │   Database      │
│   Port 8080     │    │   Port 8090     │    │   Port 27017    │
│   ┌───────────┐ │    │   ┌───────────┐ │    └─────────────────┘
│   │   Rust    │ │    │   │    Go     │ │              │
│   │ Framework │ │    │   │ Framework │ │              │
│   └───────────┘ │    │   └───────────┘ │              ▼
└─────────────────┘    └─────────────────┘    ┌─────────────────┐
                                               │     Redis       │
                                               │     Cache       │
                                               │   Port 6379     │
                                               └─────────────────┘
```

## Service Details

### Backend (Node.js + JavaScript Framework)
- **Port**: 8000
- **Role**: Main API server, WebSocket server, orchestration
- **Framework**: Autonomous Robotics JavaScript SDK
- **Key Features**:
  - RESTful API endpoints
  - Real-time WebSocket connections
  - Robot fleet management
  - Threat detection coordination
  - Autonomous decision-making

### AI Engine (Python + Python Framework)
- **Port**: 8001
- **Role**: Computer vision, threat detection, behavioral analysis
- **Framework**: Autonomous Robotics Python SDK
- **Key Features**:
  - Image-based threat detection
  - Sensor data analysis
  - Behavioral pattern analysis
  - ML-powered predictions

### Core Services (Rust + Rust Framework)
- **Port**: 8080
- **Role**: High-performance real-time telemetry processing
- **Framework**: Autonomous Robotics Rust SDK
- **Key Features**:
  - Ultra-fast telemetry processing
  - Batch data processing
  - Real-time analytics
  - Zero-cost abstractions

### Fleet Services (Go + Go Framework)
- **Port**: 8090
- **Role**: Concurrent robot fleet coordination
- **Framework**: Autonomous Robotics Go SDK
- **Key Features**:
  - Concurrent fleet management
  - Resource allocation
  - Task assignment optimization
  - Fleet health monitoring

## Development

### Run Individual Services

```bash
# Backend
cd backend
npm install
npm run dev

# AI Engine
cd ai-engine
pip install -r requirements.txt
python main.py

# Core Services
cd core-services
cargo run

# Fleet Services
cd fleet-services
go run main.go

# Frontend
cd frontend
npm install
npm run dev
```

## Environment Variables

See `.env.example` for all available configuration options.

Required variables:
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection URL
- `JWT_SECRET` - Secret for JWT token signing
- `ANTHROPIC_API_KEY` - (Optional) For Claude AI features
- `OPENAI_API_KEY` - (Optional) For OpenAI features

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ai-engine
docker-compose logs -f core-services
docker-compose logs -f fleet-services
```

### Resource Usage

```bash
docker stats
```

## Scaling

Scale specific services:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale AI engine to 2 instances
docker-compose up -d --scale ai-engine=2
```

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Enable MongoDB authentication
- [ ] Enable Redis password
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable monitoring and alerting

### Performance Tuning

- Increase MongoDB connection pool size
- Configure Redis max memory
- Enable Nginx caching
- Set up CDN for frontend assets
- Enable gzip compression

## Troubleshooting

### Services won't start

```bash
# Check Docker resources
docker system df

# Clean up
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database connection issues

```bash
# Verify MongoDB is running
docker-compose exec mongodb mongosh

# Check Redis
docker-compose exec redis redis-cli ping
```

### Port conflicts

Edit `docker-compose.yml` to change service ports if needed.

## Backup & Restore

### Backup MongoDB

```bash
docker-compose exec mongodb mongodump --out=/backup
docker cp roboguard-mongodb:/backup ./backup
```

### Restore MongoDB

```bash
docker cp ./backup roboguard-mongodb:/backup
docker-compose exec mongodb mongorestore /backup
```

## Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all prerequisites are met
4. Review the README.md

## License

MIT License - See LICENSE file for details
