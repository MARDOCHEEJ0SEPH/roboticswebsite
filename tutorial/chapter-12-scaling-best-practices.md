# Chapter 12: Scaling and Best Practices

## Scaling Strategies

As your autonomous platform grows, you need strategies to handle increased traffic, data, and complexity.

## Vertical Scaling

Start with vertical scaling by adding more resources:

```yaml
# Increased resources for production
services:
  decision-engine:
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          cpus: '2'
          memory: 4G
```

## Horizontal Scaling

### Load Balancing

Scale services horizontally:

```yaml
# docker-compose.scale.yml
services:
  decision-engine:
    deploy:
      replicas: 3
    environment:
      - INSTANCE_ID=${HOSTNAME}

  nginx:
    volumes:
      - ./nginx/load-balance.conf:/etc/nginx/nginx.conf
```

Nginx load balancing configuration:

```nginx
upstream decision_engine_cluster {
    least_conn;
    server decision-engine-1:8080 weight=1;
    server decision-engine-2:8080 weight=1;
    server decision-engine-3:8080 weight=1;
}

server {
    location /api/decisions {
        proxy_pass http://decision_engine_cluster;
        proxy_next_upstream error timeout http_500;
    }
}
```

## Database Scaling

### Read Replicas

```yaml
services:
  database-primary:
    image: postgres:15-alpine
    environment:
      - POSTGRES_REPLICATION_MODE=master
    volumes:
      - postgres-primary:/var/lib/postgresql/data

  database-replica:
    image: postgres:15-alpine
    environment:
      - POSTGRES_REPLICATION_MODE=slave
      - POSTGRES_MASTER_HOST=database-primary
    volumes:
      - postgres-replica:/var/lib/postgresql/data
```

Connection routing:

```rust
pub struct DatabasePool {
    write_pool: PgPool,
    read_pool: PgPool,
}

impl DatabasePool {
    pub async fn query_read<T>(&self, query: &str) -> Result<T> {
        sqlx::query_as(query)
            .fetch_one(&self.read_pool)
            .await
    }

    pub async fn query_write<T>(&self, query: &str) -> Result<T> {
        sqlx::query_as(query)
            .fetch_one(&self.write_pool)
            .await
    }
}
```

### Database Sharding

Partition data by service type or region:

```rust
pub struct ShardedDatabase {
    shards: Vec<PgPool>,
}

impl ShardedDatabase {
    pub fn get_shard(&self, key: &str) -> &PgPool {
        let shard_idx = self.hash(key) % self.shards.len();
        &self.shards[shard_idx]
    }

    fn hash(&self, key: &str) -> usize {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        hasher.finish() as usize
    }

    pub async fn query<T>(&self, key: &str, query: &str) -> Result<T> {
        let shard = self.get_shard(key);
        sqlx::query_as(query)
            .fetch_one(shard)
            .await
    }
}
```

## Microservices Architecture

### Service Decomposition

Break down the monolith:

```
Original:
┌─────────────────────────┐
│   Monolithic Service    │
│  - Content Generation   │
│  - Decision Making      │
│  - Analytics            │
└─────────────────────────┘

Microservices:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Content    │  │   Decision   │  │  Analytics   │
│   Service    │  │   Service    │  │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Service Communication

Use message queues for async communication:

```rust
use lapin::{Connection, ConnectionProperties, options::*, types::FieldTable};

pub struct MessageQueue {
    connection: Connection,
}

impl MessageQueue {
    pub async fn publish(&self, queue: &str, message: &[u8]) -> Result<()> {
        let channel = self.connection.create_channel().await?;

        channel
            .basic_publish(
                "",
                queue,
                BasicPublishOptions::default(),
                message,
                BasicProperties::default(),
            )
            .await?;

        Ok(())
    }

    pub async fn consume<F>(&self, queue: &str, handler: F) -> Result<()>
    where
        F: Fn(Vec<u8>) -> Result<()>,
    {
        let channel = self.connection.create_channel().await?;

        let consumer = channel
            .basic_consume(
                queue,
                "consumer",
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await?;

        // Process messages
        Ok(())
    }
}
```

## Caching at Scale

### Distributed Caching with Redis Cluster

```yaml
services:
  redis-node-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf
    ports:
      - "7001:6379"

  redis-node-2:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf
    ports:
      - "7002:6379"

  redis-node-3:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf
    ports:
      - "7003:6379"
```

### CDN Integration

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache API responses with short TTL
location /api/public/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

## Kubernetes Deployment

### Deployment Configuration

```yaml
# k8s/decision-engine-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: decision-engine
spec:
  replicas: 3
  selector:
    matchLabels:
      app: decision-engine
  template:
    metadata:
      labels:
        app: decision-engine
    spec:
      containers:
      - name: decision-engine
        image: yourregistry/decision-engine:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: decision-engine-service
spec:
  selector:
    app: decision-engine
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

### Auto-scaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: decision-engine-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: decision-engine
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Best Practices

### Code Organization

```
src/
├── api/                  # API layer
│   ├── routes/
│   └── middleware/
├── domain/              # Business logic
│   ├── models/
│   ├── services/
│   └── repositories/
├── infrastructure/      # External concerns
│   ├── database/
│   ├── cache/
│   └── messaging/
└── utils/              # Shared utilities
```

### Error Handling

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ServiceError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Cache error: {0}")]
    Cache(#[from] redis::RedisError),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl actix_web::ResponseError for ServiceError {
    fn error_response(&self) -> HttpResponse {
        match self {
            ServiceError::NotFound(_) => HttpResponse::NotFound().json(self.to_string()),
            ServiceError::Validation(_) => HttpResponse::BadRequest().json(self.to_string()),
            _ => HttpResponse::InternalServerError().json(self.to_string()),
        }
    }
}
```

### Logging Strategy

```rust
use tracing::{info, warn, error, instrument};

#[instrument(skip(db))]
pub async fn create_decision(
    db: &PgPool,
    request: CreateDecisionRequest,
) -> Result<Decision, ServiceError> {
    info!(decision_type = ?request.decision_type, "Creating decision");

    match decision_service::create(&db, request).await {
        Ok(decision) => {
            info!(decision_id = %decision.id, "Decision created successfully");
            Ok(decision)
        }
        Err(e) => {
            error!(error = %e, "Failed to create decision");
            Err(e)
        }
    }
}
```

### Testing Strategy

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_decision_creation() {
        let pool = create_test_pool().await;

        let request = CreateDecisionRequest {
            decision_type: DecisionType::ContentOptimization,
            context: HashMap::new(),
        };

        let result = create_decision(&pool, request).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_decision_scoring() {
        let scorer = DecisionScorer::new();
        let option = create_test_option();

        let score = scorer.score_option(&option);
        assert!(score > 0.0 && score <= 1.0);
    }
}
```

### Security Best Practices

```rust
// Input validation
use validator::Validate;

#[derive(Deserialize, Validate)]
pub struct CreateContentRequest {
    #[validate(length(min = 10, max = 500))]
    pub title: String,

    #[validate(email)]
    pub author_email: String,

    #[validate(range(min = 0.0, max = 1.0))]
    pub optimization_level: f64,
}

// Rate limiting
use actix_web_lab::middleware::RateLimiter;

App::new()
    .wrap(RateLimiter::new(100, Duration::from_secs(60)))
```

### Documentation

```rust
/// Creates a new decision based on the given type and context.
///
/// # Arguments
///
/// * `decision_type` - The type of decision to make
/// * `context` - Additional context for decision making
///
/// # Returns
///
/// Returns a `Decision` on success, or an error if the decision cannot be created.
///
/// # Examples
///
/// ```
/// let decision = engine.make_decision(
///     DecisionType::ContentOptimization,
///     context,
/// ).await?;
/// ```
pub async fn make_decision(
    &self,
    decision_type: DecisionType,
    context: HashMap<String, Value>,
) -> Result<Decision, ServiceError> {
    // Implementation
}
```

## Monitoring at Scale

### Distributed Tracing

```rust
use opentelemetry::global;
use tracing_subscriber::layer::SubscriberExt;

pub fn init_tracing() {
    let tracer = opentelemetry_jaeger::new_pipeline()
        .with_service_name("decision-engine")
        .install_simple()
        .expect("Failed to install tracer");

    let telemetry = tracing_opentelemetry::layer().with_tracer(tracer);

    let subscriber = tracing_subscriber::Registry::default()
        .with(telemetry)
        .with(tracing_subscriber::fmt::layer());

    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set subscriber");
}
```

### Metrics Collection

```rust
use prometheus::{Encoder, TextEncoder, Registry};

pub fn metrics_endpoint() -> HttpResponse {
    let registry = Registry::new();

    // Register custom metrics
    let http_requests = register_counter!("http_requests_total", "Total HTTP requests");
    let decision_confidence = register_histogram!("decision_confidence", "Decision confidence scores");

    // Encode metrics
    let encoder = TextEncoder::new();
    let metric_families = registry.gather();
    let mut buffer = vec![];
    encoder.encode(&metric_families, &mut buffer).unwrap();

    HttpResponse::Ok()
        .content_type("text/plain")
        .body(buffer)
}
```

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# Automated backup with retention policy

BACKUP_DIR="/backups"
RETENTION_DAYS=30

# Full backup
pg_dump -Fc $DATABASE_URL > "$BACKUP_DIR/full_$(date +%Y%m%d).dump"

# Incremental backup
pg_basebackup -D "$BACKUP_DIR/incremental_$(date +%Y%m%d)" -Ft -z -P

# Upload to cloud storage
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/

# Cleanup old backups
find $BACKUP_DIR -mtime +$RETENTION_DAYS -delete
```

### Recovery Testing

```bash
#!/bin/bash
# Test recovery process monthly

# Create test database
createdb test_recovery

# Restore from backup
pg_restore -d test_recovery $LATEST_BACKUP

# Run validation queries
psql test_recovery -c "SELECT COUNT(*) FROM decisions;"

# Cleanup
dropdb test_recovery
```

## Conclusion

You have now completed the comprehensive guide to building an autonomous service platform. Key takeaways:

1. Start with a solid architecture foundation
2. Implement autonomous systems incrementally
3. Monitor and measure everything
4. Optimize based on real metrics
5. Scale gradually as demand grows
6. Maintain security and reliability throughout
7. Document and test thoroughly

Your platform should now be capable of:

- Generating optimized content automatically
- Making strategic business decisions autonomously
- Evolving and learning from outcomes
- Scaling to handle growth
- Operating reliably in production

Continue iterating and improving your platform based on real-world usage and feedback. The autonomous systems will continue to optimize themselves, but periodic human oversight ensures alignment with business goals.

Remember: The goal is not complete automation, but augmented intelligence where AI handles routine decisions while humans focus on strategy and innovation.
