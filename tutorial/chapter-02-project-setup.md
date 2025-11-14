# Chapter 2: Project Setup and Configuration

## Prerequisites

Before starting, ensure you have the following installed:

- Docker 24.0+ and Docker Compose 2.0+
- Git for version control
- Text editor or IDE (VS Code, IntelliJ, etc.)
- Terminal/command line access
- At least 8GB RAM and 20GB disk space

Optional but recommended:
- Rust 1.74+ (for local development)
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend tooling)

## Project Structure

Create the following directory structure:

```
your-service-platform/
├── services/
│   ├── decision-engine/          # Rust backend
│   │   ├── src/
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   └── ai-engine/                # Python AI services
│       ├── app/
│       ├── requirements.txt
│       └── Dockerfile
├── frontend/
│   └── public/
│       ├── index.html
│       ├── styles.css
│       └── main.js
├── data/
│   └── schemas/
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

## Initial Setup

### Step 1: Create Project Directory

```bash
mkdir your-service-platform
cd your-service-platform
```

### Step 2: Initialize Git Repository

```bash
git init
git branch -M main
```

### Step 3: Create .gitignore

Create `.gitignore` to exclude sensitive and generated files:

```gitignore
# Environment variables
.env
.env.local

# Dependencies
target/
node_modules/
__pycache__/
*.pyc

# IDE
.vscode/
.idea/
*.swp

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite

# Docker volumes
data/postgres/
data/redis/
data/elasticsearch/
```

### Step 4: Environment Configuration

Create `.env` file for configuration:

```env
# Service Ports
DECISION_ENGINE_PORT=8080
AI_ENGINE_PORT=8001
FRONTEND_PORT=3000
API_GATEWAY_PORT=80

# Database Configuration
POSTGRES_USER=serviceadmin
POSTGRES_PASSWORD=changeme_secure_password
POSTGRES_DB=service_brain
DATABASE_URL=postgresql://serviceadmin:changeme_secure_password@database:5432/service_brain

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTIC_PASSWORD=changeme_elastic_password

# AI API Keys (get from providers)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Application Settings
RUST_LOG=info
PYTHON_ENV=development
LOG_LEVEL=INFO

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
```

**Security Note**: Never commit `.env` to version control. Use `.env.example` for templates.

## Docker Compose Configuration

Create `docker-compose.yml` as the orchestration foundation:

```yaml
version: '3.8'

services:
  # Core Decision Engine (Rust)
  decision-engine:
    build:
      context: ./services/decision-engine
      dockerfile: Dockerfile
    container_name: decision-engine
    ports:
      - "${DECISION_ENGINE_PORT}:8080"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - RUST_LOG=${RUST_LOG}
    depends_on:
      - database
      - redis
    networks:
      - service-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # AI Engine (Python)
  ai-engine:
    build:
      context: ./services/ai-engine
      dockerfile: Dockerfile
    container_name: ai-engine
    ports:
      - "${AI_ENGINE_PORT}:8001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - PYTHON_ENV=${PYTHON_ENV}
    depends_on:
      - database
      - redis
    networks:
      - service-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend
  frontend:
    image: nginx:alpine
    container_name: frontend
    ports:
      - "${FRONTEND_PORT}:80"
    volumes:
      - ./frontend/public:/usr/share/nginx/html:ro
    networks:
      - service-network
    restart: unless-stopped

  # PostgreSQL Database
  database:
    image: postgres:15-alpine
    container_name: database
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - service-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: redis
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - service-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - xpack.security.enabled=false
    volumes:
      - elastic-data:/usr/share/elasticsearch/data
    networks:
      - service-network
    restart: unless-stopped

  # Prometheus (Metrics)
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "${PROMETHEUS_PORT}:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    networks:
      - service-network
    restart: unless-stopped

  # Grafana (Dashboards)
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "${GRAFANA_PORT}:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - service-network
    restart: unless-stopped

networks:
  service-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
  elastic-data:
  prometheus-data:
  grafana-data:
```

## Monitoring Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'decision-engine'
    static_configs:
      - targets: ['decision-engine:8080']
    metrics_path: '/metrics'

  - job_name: 'ai-engine'
    static_configs:
      - targets: ['ai-engine:8001']
    metrics_path: '/metrics'

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

## Service Directory Setup

### Decision Engine (Rust)

Create `services/decision-engine/Cargo.toml`:

```toml
[package]
name = "decision-engine"
version = "0.1.0"
edition = "2021"

[dependencies]
actix-web = "4.4"
actix-rt = "2.9"
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "postgres", "chrono"] }
redis = { version = "0.24", features = ["tokio-comp", "connection-manager"] }
chrono = { version = "0.4", features = ["serde"] }
env_logger = "0.11"
log = "0.4"
dotenv = "0.15"
uuid = { version = "1.6", features = ["v4", "serde"] }
```

Create `services/decision-engine/Dockerfile`:

```dockerfile
FROM rust:1.74 as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/decision-engine /usr/local/bin/

EXPOSE 8080

CMD ["decision-engine"]
```

### AI Engine (Python)

Create `services/ai-engine/requirements.txt`:

```txt
fastapi==0.108.0
uvicorn[standard]==0.25.0
pydantic==2.5.0
pydantic-settings==2.1.0
sqlalchemy==2.0.23
asyncpg==0.29.0
redis==5.0.1
openai==1.6.1
anthropic==0.8.1
python-multipart==0.0.6
python-dotenv==1.0.0
```

Create `services/ai-engine/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## Database Schema Initialization

Create `data/schemas/init.sql`:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Decisions table
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_type VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    reasoning JSONB,
    predicted_outcome JSONB,
    actual_outcome JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    implemented_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_decisions_type ON decisions(decision_type);
CREATE INDEX idx_decisions_created ON decisions(created_at DESC);

-- Content table
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB,
    optimization_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_published ON content(published_at DESC);

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    metadata JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metrics_type ON metrics(metric_type);
CREATE INDEX idx_metrics_recorded ON metrics(recorded_at DESC);

-- Evolution history
CREATE TABLE IF NOT EXISTS evolution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation INTEGER NOT NULL,
    genome JSONB NOT NULL,
    fitness_score DECIMAL(10,2) NOT NULL,
    mutations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_evolution_generation ON evolution_history(generation DESC);
```

## Verification Steps

### Step 1: Validate Configuration

Create a simple validation script `scripts/validate-setup.sh`:

```bash
#!/bin/bash

echo "Validating project setup..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not installed"
    exit 1
fi
echo "✓ Docker installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose not installed"
    exit 1
fi
echo "✓ Docker Compose installed"

# Check .env file
if [ ! -f .env ]; then
    echo "ERROR: .env file not found"
    exit 1
fi
echo "✓ .env file exists"

# Check required directories
for dir in services/decision-engine services/ai-engine frontend/public data/schemas monitoring; do
    if [ ! -d "$dir" ]; then
        echo "ERROR: Directory $dir not found"
        exit 1
    fi
done
echo "✓ All required directories exist"

echo "Setup validation complete!"
```

Make it executable:

```bash
chmod +x scripts/validate-setup.sh
./scripts/validate-setup.sh
```

### Step 2: Test Database Connection

Create `scripts/test-db.sh`:

```bash
#!/bin/bash

source .env

docker-compose up -d database

echo "Waiting for database to be ready..."
sleep 5

docker-compose exec database psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo "✓ Database connection successful"
else
    echo "ERROR: Database connection failed"
    exit 1
fi
```

### Step 3: Build All Services

```bash
docker-compose build
```

This will:
- Build the Rust decision engine
- Build the Python AI engine
- Pull all required images

### Step 4: Start Services

```bash
docker-compose up -d
```

### Step 5: Verify All Services Running

```bash
docker-compose ps
```

Expected output:
```
NAME                IMAGE                    STATUS
decision-engine     decision-engine:latest   Up (healthy)
ai-engine           ai-engine:latest         Up (healthy)
frontend            nginx:alpine             Up
database            postgres:15-alpine       Up (healthy)
redis               redis:7-alpine           Up (healthy)
elasticsearch       elasticsearch:8.11.0     Up
prometheus          prom/prometheus:latest   Up
grafana             grafana/grafana:latest   Up
```

### Step 6: Check Service Health

```bash
# Decision Engine
curl http://localhost:8080/health

# AI Engine
curl http://localhost:8001/health

# Frontend
curl http://localhost:3000
```

## Common Issues and Solutions

### Issue: Port Already in Use

**Solution**: Change ports in `.env` or stop conflicting services:

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Issue: Database Connection Failed

**Solution**: Check database logs and ensure proper credentials:

```bash
docker-compose logs database

# Verify environment variables
docker-compose exec decision-engine env | grep DATABASE
```

### Issue: Out of Memory

**Solution**: Increase Docker memory limit or reduce Elasticsearch heap:

In `.env`, modify:
```env
ES_JAVA_OPTS=-Xms256m -Xmx256m
```

### Issue: Build Fails for Rust Service

**Solution**: Clear cache and rebuild:

```bash
docker-compose down
docker-compose build --no-cache decision-engine
docker-compose up -d
```

## Development Workflow

### Local Development Mode

For faster iteration during development:

```bash
# Start only dependencies
docker-compose up -d database redis elasticsearch

# Run services locally
cd services/decision-engine
cargo run

# In another terminal
cd services/ai-engine
uvicorn app.main:app --reload --port 8001
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f decision-engine

# Last 100 lines
docker-compose logs --tail=100 ai-engine
```

### Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart decision-engine
```

## Next Steps

With your environment now configured and running, Chapter 3 will guide you through building the frontend foundation. You will create the HTML structure, implement responsive CSS, and add interactive JavaScript features that form the user-facing layer of your autonomous service platform.

Before proceeding, ensure:
- All services show as "Up (healthy)" in `docker-compose ps`
- Health check endpoints return successful responses
- Database initialization completed without errors
- You can access Prometheus at http://localhost:9090 and Grafana at http://localhost:3001
