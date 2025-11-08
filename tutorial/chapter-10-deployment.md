# Chapter 10: Deployment and DevOps

## Deployment Strategy

This chapter covers taking your autonomous platform from development to production with confidence.

## Environment Management

### Development, Staging, and Production

Create environment-specific configurations:

```yaml
# .env.development
DATABASE_URL=postgresql://localhost:5432/service_dev
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-dev-key
LOG_LEVEL=DEBUG

# .env.staging
DATABASE_URL=postgresql://staging-db:5432/service_staging
REDIS_URL=redis://staging-redis:6379
OPENAI_API_KEY=sk-staging-key
LOG_LEVEL=INFO

# .env.production
DATABASE_URL=postgresql://prod-db:5432/service_prod
REDIS_URL=redis://prod-redis:6379
OPENAI_API_KEY=sk-prod-key
LOG_LEVEL=WARN
```

## Docker Production Configuration

Optimize Docker for production:

```dockerfile
# services/decision-engine/Dockerfile.prod
FROM rust:1.74 as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Build with optimizations
RUN cargo build --release --locked

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser
USER appuser

COPY --from=builder /app/target/release/decision-engine /usr/local/bin/

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["decision-engine"]
```

## Container Orchestration with Docker Compose

Production-ready `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  decision-engine:
    build:
      context: ./services/decision-engine
      dockerfile: Dockerfile.prod
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - RUST_LOG=info
    depends_on:
      database:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  ai-engine:
    build:
      context: ./services/ai-engine
      dockerfile: Dockerfile.prod
    restart: always
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - database
      - redis
    networks:
      - backend

  database:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/public:/usr/share/nginx/html:ro
    depends_on:
      - decision-engine
      - ai-engine
    networks:
      - backend
      - frontend

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local

networks:
  backend:
    driver: bridge
  frontend:
    driver: bridge
```

## Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream decision_engine {
        server decision-engine:8080;
    }

    upstream ai_engine {
        server ai-engine:8001;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        listen 80;
        server_name yourservice.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourservice.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000" always;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # Decision Engine API
        location /api/decisions {
            limit_req zone=api_limit burst=20;
            proxy_pass http://decision_engine;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # AI Engine API
        location /api/content {
            limit_req zone=api_limit burst=20;
            proxy_pass http://ai_engine;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Health checks
        location /health {
            access_log off;
            return 200 "healthy\n";
        }
    }
}
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Rust tests
        run: |
          cd services/decision-engine
          cargo test

      - name: Run Python tests
        run: |
          cd services/ai-engine
          pip install -r requirements.txt
          pytest

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker images
        run: |
          docker-compose -f docker-compose.prod.yml build

      - name: Push to registry
        env:
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
        run: |
          echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
          docker-compose -f docker-compose.prod.yml push

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/service-platform
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
```

## Database Migrations

Create a migration runner:

```bash
#!/bin/bash
# scripts/migrate.sh

set -e

ENVIRONMENT=${1:-development}

echo "Running migrations for $ENVIRONMENT"

# Load environment
source .env.$ENVIRONMENT

# Run migrations
docker-compose exec database psql -U postgres -d $POSTGRES_DB -f /migrations/001_initial_schema.sql
docker-compose exec database psql -U postgres -d $POSTGRES_DB -f /migrations/002_add_indexes.sql

echo "Migrations completed"
```

## Backup and Recovery

Automated backup script:

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="s3://your-backup-bucket"

# Database backup
docker-compose exec -T database pg_dump -U postgres service_prod | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Upload to S3
aws s3 cp "$BACKUP_DIR/db_$TIMESTAMP.sql.gz" "$S3_BUCKET/database/"

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$TIMESTAMP.sql.gz"
```

Set up cron job:

```bash
# Daily backups at 2 AM
0 2 * * * /opt/service-platform/scripts/backup.sh
```

## Monitoring Setup

### Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: 'decision-engine'
    static_configs:
      - targets: ['decision-engine:8080']
    metrics_path: '/metrics'

  - job_name: 'ai-engine'
    static_configs:
      - targets: ['ai-engine:8001']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Alert Rules

Create `monitoring/alerts.yml`:

```yaml
groups:
  - name: service_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is down"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container memory usage > 90%"

      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space < 10%"
```

## Health Checks

Comprehensive health check endpoint:

```rust
pub async fn deep_health_check(state: web::Data<AppState>) -> HttpResponse {
    let mut health = HashMap::new();

    // Check database
    let db_health = match sqlx::query("SELECT 1").fetch_one(&state.db).await {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };
    health.insert("database", db_health);

    // Check Redis
    let redis_health = match state.redis.get_connection() {
        Ok(_) => "healthy",
        Err(_) => "unhealthy",
    };
    health.insert("redis", redis_health);

    // Check disk space
    let disk_health = check_disk_space();
    health.insert("disk", disk_health);

    // Check memory
    let memory_health = check_memory();
    health.insert("memory", memory_health);

    let overall = if health.values().all(|&v| v == "healthy") {
        "healthy"
    } else {
        "degraded"
    };

    HttpResponse::Ok().json(json!({
        "status": overall,
        "components": health,
        "timestamp": Utc::now(),
    }))
}
```

## Zero-Downtime Deployments

Blue-Green deployment script:

```bash
#!/bin/bash
# scripts/deploy-blue-green.sh

set -e

# Start new version (green)
docker-compose -f docker-compose.green.yml up -d

# Wait for health check
sleep 10
HEALTH=$(curl -f http://localhost:8081/health)

if [ "$HEALTH" = "healthy" ]; then
    # Switch traffic to green
    docker-compose -f docker-compose.blue.yml down
    docker-compose -f docker-compose.green.yml up -d --scale=2

    echo "Deployment successful"
else
    echo "Health check failed, rolling back"
    docker-compose -f docker-compose.green.yml down
    exit 1
fi
```

## Secrets Management

Use environment variables and secret managers:

```bash
# Using AWS Secrets Manager
aws secretsmanager get-secret-value \
    --secret-id prod/service-platform/database \
    --query SecretString \
    --output text > .env.production

# Using HashiCorp Vault
vault kv get -format=json secret/service-platform/prod | jq -r '.data.data | to_entries[] | "\(.key)=\(.value)"' > .env.production
```

## Next Steps

Chapter 11 covers performance optimization techniques including caching strategies, database query optimization, and using assembly for critical paths.
