# Chapter 11: Performance Optimization

## Performance Principles

Optimize for the metrics that matter:

- API response time under 100ms
- Page load time under 2 seconds
- Database queries under 50ms
- Memory usage under 2GB per service
- CPU utilization under 70%

## Caching Strategies

### Redis Caching Layer

Implement multi-level caching:

```rust
use redis::{Client, Commands};
use serde::{Serialize, Deserialize};

pub struct CacheService {
    redis: Client,
}

impl CacheService {
    pub fn new(redis: Client) -> Self {
        CacheService { redis }
    }

    pub async fn get_or_fetch<T, F, Fut>(
        &self,
        key: &str,
        ttl: usize,
        fetch_fn: F,
    ) -> Result<T, Box<dyn std::error::Error>>
    where
        T: Serialize + for<'de> Deserialize<'de>,
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<T, Box<dyn std::error::Error>>>,
    {
        let mut conn = self.redis.get_connection()?;

        // Try cache first
        if let Ok(cached) = conn.get::<_, String>(key) {
            if let Ok(value) = serde_json::from_str(&cached) {
                return Ok(value);
            }
        }

        // Cache miss - fetch data
        let value = fetch_fn().await?;

        // Store in cache
        let serialized = serde_json::to_string(&value)?;
        conn.set_ex(key, serialized, ttl)?;

        Ok(value)
    }

    pub fn invalidate(&self, pattern: &str) -> Result<(), Box<dyn std::error::Error>> {
        let mut conn = self.redis.get_connection()?;

        let keys: Vec<String> = conn.keys(pattern)?;
        if !keys.is_empty() {
            conn.del(&keys)?;
        }

        Ok(())
    }
}
```

### Application-Level Caching

```rust
use std::sync::Arc;
use tokio::sync::RwLock;
use std::collections::HashMap;
use std::time::{Duration, Instant};

pub struct AppCache<T> {
    data: Arc<RwLock<HashMap<String, CacheEntry<T>>>>,
    ttl: Duration,
}

struct CacheEntry<T> {
    value: T,
    expires_at: Instant,
}

impl<T: Clone> AppCache<T> {
    pub fn new(ttl: Duration) -> Self {
        AppCache {
            data: Arc::new(RwLock::new(HashMap::new())),
            ttl,
        }
    }

    pub async fn get(&self, key: &str) -> Option<T> {
        let cache = self.data.read().await;

        if let Some(entry) = cache.get(key) {
            if entry.expires_at > Instant::now() {
                return Some(entry.value.clone());
            }
        }

        None
    }

    pub async fn set(&self, key: String, value: T) {
        let mut cache = self.data.write().await;
        cache.insert(key, CacheEntry {
            value,
            expires_at: Instant::now() + self.ttl,
        });
    }

    pub async fn cleanup_expired(&self) {
        let mut cache = self.data.write().await;
        let now = Instant::now();
        cache.retain(|_, entry| entry.expires_at > now);
    }
}
```

## Database Query Optimization

### Connection Pooling

```rust
use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

pub async fn create_optimized_pool(database_url: &str) -> sqlx::PgPool {
    PgPoolOptions::new()
        .max_connections(50)
        .min_connections(10)
        .acquire_timeout(Duration::from_secs(3))
        .idle_timeout(Some(Duration::from_secs(300)))
        .max_lifetime(Some(Duration::from_secs(1800)))
        .connect(database_url)
        .await
        .expect("Failed to create pool")
}
```

### Query Optimization

Use prepared statements and batch operations:

```rust
// Bad: N+1 queries
for id in ids {
    let item = sqlx::query_as::<_, Item>("SELECT * FROM items WHERE id = $1")
        .bind(id)
        .fetch_one(&pool)
        .await?;
}

// Good: Single query with IN clause
let items = sqlx::query_as::<_, Item>("SELECT * FROM items WHERE id = ANY($1)")
    .bind(&ids)
    .fetch_all(&pool)
    .await?;
```

### Database Indexes

```sql
-- Index for frequent queries
CREATE INDEX CONCURRENTLY idx_content_published_type
ON content(status, content_type, published_at DESC)
WHERE status = 'published';

-- Partial index for active records
CREATE INDEX CONCURRENTLY idx_decisions_recent
ON decisions(created_at DESC)
WHERE created_at >= NOW() - INTERVAL '90 days';

-- GIN index for JSONB queries
CREATE INDEX CONCURRENTLY idx_content_metadata
ON content USING GIN(metadata);

-- Composite index for common filter
CREATE INDEX CONCURRENTLY idx_metrics_type_date
ON metrics(metric_type, recorded_at DESC);
```

## API Performance

### Request Batching

```rust
pub async fn batch_handler(
    requests: web::Json<Vec<BatchRequest>>,
    state: web::Data<AppState>,
) -> HttpResponse {
    let futures: Vec<_> = requests
        .iter()
        .map(|req| process_single_request(req, &state))
        .collect();

    let results = futures::future::join_all(futures).await;

    HttpResponse::Ok().json(results)
}
```

### Response Compression

```rust
use actix_web::middleware::Compress;

App::new()
    .wrap(Compress::default())
    .service(handlers)
```

### Async Processing

```rust
use tokio::task;

pub async fn process_heavy_task(data: Data) -> Result<Output> {
    // Offload to thread pool for CPU-intensive work
    task::spawn_blocking(move || {
        // Heavy computation
        compute_intensive_operation(data)
    })
    .await?
}
```

## Memory Optimization

### Streaming Responses

```rust
use actix_web::web::Bytes;
use futures::stream::Stream;

pub async fn stream_large_data() -> impl Stream<Item = Result<Bytes, Error>> {
    futures::stream::iter(
        generate_data_chunks()
            .map(|chunk| Ok(Bytes::from(chunk)))
    )
}
```

### Memory Pooling

```rust
use bytes::BytesMut;

pub struct BufferPool {
    buffers: Arc<Mutex<Vec<BytesMut>>>,
}

impl BufferPool {
    pub fn acquire(&self) -> BytesMut {
        self.buffers
            .lock()
            .unwrap()
            .pop()
            .unwrap_or_else(|| BytesMut::with_capacity(4096))
    }

    pub fn release(&self, mut buffer: BytesMut) {
        buffer.clear();
        self.buffers.lock().unwrap().push(buffer);
    }
}
```

## Assembly Optimization

For critical performance paths, use assembly:

```nasm
; assembly-kernels/fitness.asm
section .text
global calculate_fitness

calculate_fitness:
    ; Input: rdi = metrics pointer, rsi = weights pointer
    ; Output: xmm0 = fitness score

    movsd xmm0, [rdi]        ; Load revenue
    mulsd xmm0, [rsi]        ; Multiply by weight

    movsd xmm1, [rdi + 8]    ; Load leads
    mulsd xmm1, [rsi + 8]
    addsd xmm0, xmm1

    movsd xmm1, [rdi + 16]   ; Load engagement
    mulsd xmm1, [rsi + 16]
    addsd xmm0, xmm1

    ret
```

Link to Rust:

```rust
extern "C" {
    fn calculate_fitness(metrics: *const f64, weights: *const f64) -> f64;
}

pub fn fast_fitness_calculation(metrics: &[f64], weights: &[f64]) -> f64 {
    unsafe {
        calculate_fitness(metrics.as_ptr(), weights.as_ptr())
    }
}
```

## Frontend Performance

### Code Splitting

```javascript
// Lazy load heavy components
const ROICalculator = () => import('./components/ROICalculator.js');

// Load on interaction
document.getElementById('roi-button').addEventListener('click', async () => {
    const module = await ROICalculator();
    module.init();
});
```

### Asset Optimization

```html
<!-- Preload critical resources -->
<link rel="preload" as="script" href="main.js">
<link rel="preload" as="style" href="styles.css">

<!-- Defer non-critical JavaScript -->
<script defer src="analytics.js"></script>

<!-- Use modern image formats -->
<picture>
    <source srcset="hero.webp" type="image/webp">
    <img src="hero.jpg" alt="Hero" loading="lazy">
</picture>
```

### Service Worker Caching

```javascript
// service-worker.js
const CACHE_NAME = 'v1';
const CACHE_ASSETS = [
    '/',
    '/styles.css',
    '/main.js',
    '/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
```

## Profiling and Benchmarking

### Rust Benchmarks

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_decision_scoring(c: &mut Criterion) {
    let scorer = DecisionScorer::new();
    let option = create_test_option();

    c.bench_function("score_option", |b| {
        b.iter(|| scorer.score_option(black_box(&option)))
    });
}

criterion_group!(benches, benchmark_decision_scoring);
criterion_main!(benches);
```

### Load Testing

```bash
# Using Apache Bench
ab -n 10000 -c 100 http://localhost:8080/api/decisions

# Using wrk
wrk -t12 -c400 -d30s http://localhost:8080/api/decisions
```

## Monitoring Performance

```rust
use prometheus::{Counter, Histogram, register_counter, register_histogram};

lazy_static! {
    static ref HTTP_REQUESTS: Counter = register_counter!(
        "http_requests_total",
        "Total HTTP requests"
    ).unwrap();

    static ref HTTP_DURATION: Histogram = register_histogram!(
        "http_request_duration_seconds",
        "HTTP request duration"
    ).unwrap();
}

pub async fn timed_handler(req: HttpRequest) -> HttpResponse {
    let timer = HTTP_DURATION.start_timer();

    let response = handle_request(req).await;

    timer.observe_duration();
    HTTP_REQUESTS.inc();

    response
}
```

## Performance Checklist

- Use connection pooling for database
- Implement caching at multiple levels
- Add database indexes for frequent queries
- Use async operations for I/O
- Compress responses
- Optimize images and assets
- Enable CDN for static content
- Profile and benchmark critical paths
- Monitor performance metrics in production
- Use lazy loading for heavy components

## Next Steps

Chapter 12 covers scaling strategies for handling growth, from vertical scaling to distributed systems and microservices architecture.
