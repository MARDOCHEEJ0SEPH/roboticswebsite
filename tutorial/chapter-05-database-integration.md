# Chapter 5: Database Integration

## Database Design Principles

When building an autonomous service platform, your database schema should support:

- Temporal data tracking (decisions, metrics over time)
- Flexible metadata storage (JSONB for evolving data structures)
- Efficient querying for analytics
- Audit trails for autonomous actions
- Scalability for growing data

## Schema Design

### Core Tables

The platform requires several core tables to track autonomous operations:

#### 1. Decisions Table

Tracks all autonomous decisions made by the system:

```sql
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision_type VARCHAR(50) NOT NULL,
    action TEXT NOT NULL,
    confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    reasoning JSONB NOT NULL,
    predicted_outcome JSONB NOT NULL,
    actual_outcome JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    implemented_at TIMESTAMP WITH TIME ZONE,
    evaluated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_decisions_type ON decisions(decision_type);
CREATE INDEX idx_decisions_created ON decisions(created_at DESC);
CREATE INDEX idx_decisions_confidence ON decisions(confidence DESC);
CREATE INDEX idx_decisions_implemented ON decisions(implemented_at) WHERE implemented_at IS NOT NULL;
```

#### 2. Content Table

Stores generated content and optimization data:

```sql
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    body TEXT NOT NULL,
    excerpt TEXT,
    metadata JSONB DEFAULT '{}',
    seo_data JSONB DEFAULT '{}',
    optimization_score DECIMAL(5,2),
    target_keywords TEXT[],
    word_count INTEGER,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_published ON content(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_content_keywords ON content USING GIN(target_keywords);
CREATE INDEX idx_content_optimization ON content(optimization_score DESC);
```

#### 3. Metrics Table

Records business and operational metrics:

```sql
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    unit VARCHAR(20),
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metrics_type ON metrics(metric_type, recorded_at DESC);
CREATE INDEX idx_metrics_name ON metrics(metric_name, recorded_at DESC);
CREATE INDEX idx_metrics_recorded ON metrics(recorded_at DESC);
CREATE INDEX idx_metrics_tags ON metrics USING GIN(tags);
```

#### 4. Evolution History

Tracks genetic algorithm evolution over time:

```sql
CREATE TABLE evolution_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation INTEGER NOT NULL,
    genome JSONB NOT NULL,
    fitness_score DECIMAL(10,2) NOT NULL,
    mutations JSONB,
    parent_generation INTEGER,
    successful_traits TEXT[],
    eliminated_traits TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_evolution_generation ON evolution_history(generation DESC);
CREATE INDEX idx_evolution_fitness ON evolution_history(fitness_score DESC);
CREATE INDEX idx_evolution_created ON evolution_history(created_at DESC);
```

#### 5. Leads Table

Stores lead information from contact forms:

```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(50),
    service_interest VARCHAR(100),
    message TEXT,
    source VARCHAR(100),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    status VARCHAR(20) DEFAULT 'new',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contacted_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
```

#### 6. Learning Patterns

Stores recognized patterns from the learning system:

```sql
CREATE TABLE learning_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_type VARCHAR(50) NOT NULL,
    pattern_name VARCHAR(200) NOT NULL,
    description TEXT,
    confidence DECIMAL(5,2) NOT NULL,
    occurrences INTEGER DEFAULT 1,
    insights JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX idx_patterns_confidence ON learning_patterns(confidence DESC);
CREATE INDEX idx_patterns_occurrences ON learning_patterns(occurrences DESC);
```

### Database Migrations

Create `data/migrations/001_initial_schema.sql`:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Create all tables (insert all CREATE TABLE statements from above)

-- Create views for common queries

-- Recent decisions view
CREATE VIEW recent_decisions AS
SELECT
    id,
    decision_type,
    action,
    confidence,
    created_at,
    implemented_at
FROM decisions
ORDER BY created_at DESC
LIMIT 100;

-- Published content view
CREATE VIEW published_content AS
SELECT
    id,
    title,
    slug,
    content_type,
    optimization_score,
    published_at
FROM content
WHERE status = 'published'
ORDER BY published_at DESC;

-- Metrics summary view
CREATE VIEW metrics_daily_summary AS
SELECT
    DATE(recorded_at) as date,
    metric_type,
    metric_name,
    AVG(value) as avg_value,
    MAX(value) as max_value,
    MIN(value) as min_value,
    COUNT(*) as count
FROM metrics
GROUP BY DATE(recorded_at), metric_type, metric_name
ORDER BY date DESC;
```

### Triggers for Automatic Updates

```sql
-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Automatically generate slug from title
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := regexp_replace(
            lower(trim(NEW.title)),
            '[^a-z0-9]+',
            '-',
            'g'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_generate_slug
    BEFORE INSERT ON content
    FOR EACH ROW
    EXECUTE FUNCTION generate_slug();
```

## Database Access with SQLx

### Setting Up Database Connection

In your Rust service, create `services/decision-engine/src/db/mod.rs`:

```rust
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(300))
        .max_lifetime(Duration::from_secs(1800))
        .connect(database_url)
        .await
}

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await
}
```

### Repository Pattern

Create `services/decision-engine/src/db/repositories/decision_repository.rs`:

```rust
use sqlx::PgPool;
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::models::decision::Decision;

pub struct DecisionRepository {
    pool: PgPool,
}

impl DecisionRepository {
    pub fn new(pool: PgPool) -> Self {
        DecisionRepository { pool }
    }

    pub async fn create(
        &self,
        decision_type: &str,
        action: &str,
        confidence: f64,
        reasoning: &serde_json::Value,
        predicted_outcome: &serde_json::Value,
    ) -> Result<Decision, sqlx::Error> {
        let decision = sqlx::query_as::<_, Decision>(
            r#"
            INSERT INTO decisions
            (decision_type, action, confidence, reasoning, predicted_outcome)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(decision_type)
        .bind(action)
        .bind(confidence)
        .bind(reasoning)
        .bind(predicted_outcome)
        .fetch_one(&self.pool)
        .await?;

        Ok(decision)
    }

    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Decision>, sqlx::Error> {
        let decision = sqlx::query_as::<_, Decision>(
            "SELECT * FROM decisions WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(decision)
    }

    pub async fn find_by_type(
        &self,
        decision_type: &str,
        limit: i64,
    ) -> Result<Vec<Decision>, sqlx::Error> {
        let decisions = sqlx::query_as::<_, Decision>(
            r#"
            SELECT * FROM decisions
            WHERE decision_type = $1
            ORDER BY created_at DESC
            LIMIT $2
            "#
        )
        .bind(decision_type)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(decisions)
    }

    pub async fn mark_implemented(
        &self,
        id: Uuid,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE decisions SET implemented_at = NOW() WHERE id = $1"
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_actual_outcome(
        &self,
        id: Uuid,
        actual_outcome: &serde_json::Value,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE decisions
            SET actual_outcome = $1, evaluated_at = NOW()
            WHERE id = $2
            "#
        )
        .bind(actual_outcome)
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn get_performance_stats(
        &self,
    ) -> Result<(i64, f64, f64), sqlx::Error> {
        let result = sqlx::query_as::<_, (i64, f64, f64)>(
            r#"
            SELECT
                COUNT(*) as total,
                AVG(confidence) as avg_confidence,
                COUNT(*) FILTER (WHERE implemented_at IS NOT NULL)::FLOAT / COUNT(*)::FLOAT as implementation_rate
            FROM decisions
            WHERE created_at >= NOW() - INTERVAL '30 days'
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(result)
    }
}
```

### Content Repository

Create `services/decision-engine/src/db/repositories/content_repository.rs`:

```rust
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::content::Content;

pub struct ContentRepository {
    pool: PgPool,
}

impl ContentRepository {
    pub fn new(pool: PgPool) -> Self {
        ContentRepository { pool }
    }

    pub async fn create(
        &self,
        title: &str,
        content_type: &str,
        body: &str,
        metadata: &serde_json::Value,
    ) -> Result<Content, sqlx::Error> {
        let content = sqlx::query_as::<_, Content>(
            r#"
            INSERT INTO content
            (title, content_type, body, metadata, word_count)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            "#
        )
        .bind(title)
        .bind(content_type)
        .bind(body)
        .bind(metadata)
        .bind(body.split_whitespace().count() as i32)
        .fetch_one(&self.pool)
        .await?;

        Ok(content)
    }

    pub async fn publish(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            UPDATE content
            SET status = 'published', published_at = NOW()
            WHERE id = $1
            "#
        )
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn update_optimization_score(
        &self,
        id: Uuid,
        score: f64,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "UPDATE content SET optimization_score = $1 WHERE id = $2"
        )
        .bind(score)
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn find_by_slug(
        &self,
        slug: &str,
    ) -> Result<Option<Content>, sqlx::Error> {
        let content = sqlx::query_as::<_, Content>(
            "SELECT * FROM content WHERE slug = $1 AND status = 'published'"
        )
        .bind(slug)
        .fetch_optional(&self.pool)
        .await?;

        Ok(content)
    }

    pub async fn get_recent_published(
        &self,
        limit: i64,
    ) -> Result<Vec<Content>, sqlx::Error> {
        let content = sqlx::query_as::<_, Content>(
            r#"
            SELECT * FROM content
            WHERE status = 'published'
            ORDER BY published_at DESC
            LIMIT $1
            "#
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        Ok(content)
    }
}
```

## Query Optimization

### Using EXPLAIN ANALYZE

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM decisions
WHERE decision_type = 'content_optimization'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY confidence DESC
LIMIT 10;
```

### Composite Indexes

For queries that filter on multiple columns:

```sql
-- Composite index for common query pattern
CREATE INDEX idx_decisions_type_date ON decisions(decision_type, created_at DESC);

-- Partial index for active content
CREATE INDEX idx_content_active ON content(content_type, optimization_score DESC)
WHERE status = 'published';
```

### Materialized Views for Analytics

```sql
-- Create materialized view for dashboard
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT
    DATE(recorded_at) as date,
    SUM(CASE WHEN metric_name = 'revenue' THEN value ELSE 0 END) as revenue,
    SUM(CASE WHEN metric_name = 'leads' THEN value ELSE 0 END) as leads,
    AVG(CASE WHEN metric_name = 'conversion_rate' THEN value ELSE NULL END) as conversion_rate
FROM metrics
WHERE recorded_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE(recorded_at);

CREATE UNIQUE INDEX ON dashboard_metrics(date);

-- Refresh periodically
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
```

## Database Maintenance

### Vacuum and Analyze

Schedule regular maintenance:

```sql
-- Vacuum to reclaim space
VACUUM ANALYZE decisions;
VACUUM ANALYZE content;
VACUUM ANALYZE metrics;

-- Auto-vacuum settings (postgresql.conf)
autovacuum = on
autovacuum_naptime = 1min
```

### Monitoring Queries

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Full backup
pg_dump -h database -U serviceadmin service_brain | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Retain last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Point-in-Time Recovery

Enable WAL archiving in `postgresql.conf`:

```conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/wal_archive/%f'
```

## Connection Pooling

### PgBouncer Configuration

For production, use PgBouncer:

```ini
[databases]
service_brain = host=database port=5432 dbname=service_brain

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

## Next Steps

Chapter 6 will cover building the AI-powered content generation system using Python and FastAPI. You will learn how to integrate with OpenAI and Anthropic APIs, create content templates, and implement automated content workflows.
