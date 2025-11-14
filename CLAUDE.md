# CLAUDE.md - AI Assistant Guide for Robotics Website

This document provides comprehensive guidance for AI assistants working on this autonomous robotics website codebase.

## Project Overview

This is an **autonomous, self-evolving robotics website** - a living digital organism that learns, adapts, and grows independently. It combines Rust, Python, Assembly, and modern web technologies to create a sophisticated platform that:

- Generates 10+ optimized pages daily autonomously
- Makes independent business decisions using ML
- Evolves features through A/B testing
- Optimizes for AI platforms (ChatGPT, Claude, Perplexity, Gemini)
- Operates with 95-99.9% autonomy

**Business Goals:**
- Month 1: $50K revenue, 200 leads
- Month 6: $1M revenue, 5,000 leads
- Year 1: $3M+ revenue, 15,000+ leads

## Repository Structure

```
roboticswebsite/
├── services/
│   ├── neural-core/          # Rust-based decision & evolution engine
│   │   ├── src/
│   │   │   ├── main.rs              # Actix-web server (port 8080)
│   │   │   ├── decision_engine.rs   # Autonomous decision-making (228 lines)
│   │   │   ├── evolution_engine.rs  # A/B testing & mutations (290 lines)
│   │   │   ├── learning_system.rs   # Pattern recognition (264 lines)
│   │   │   ├── consciousness.rs     # Strategic thinking (266 lines)
│   │   │   ├── models.rs            # Data structures (66 lines)
│   │   │   └── utils.rs             # Utilities
│   │   ├── Cargo.toml               # Rust dependencies
│   │   └── Dockerfile               # Multi-stage build
│   │
│   └── ai-engine/            # Python AI/ML services
│       ├── main.py                  # FastAPI server (port 8001)
│       ├── content_generator.py     # Content creation (584 lines)
│       ├── aeo_optimizer.py         # Answer Engine Optimization (427 lines)
│       ├── llmo_optimizer.py        # LLM Optimization (343 lines)
│       ├── autonomous_controller.py # Orchestration (190 lines)
│       ├── requirements.txt         # Python dependencies
│       └── Dockerfile
│
├── frontend/                 # Web interface
│   └── public/
│       ├── index.html               # Main page (362 lines)
│       ├── main.js                  # Interactive features (389 lines)
│       ├── styles.css               # Modern styling (652 lines)
│
├── assembly-kernels/         # Performance-critical code
│   ├── performance_kernels.asm      # x86-64 optimizations
│   ├── kernel_wrapper.c             # C wrapper (155 lines)
│   └── Makefile
│
├── data/
│   ├── knowledge-graph/
│   │   └── robotics_ontology.json   # Domain knowledge
│   └── schemas/
│       └── service_schema.json      # Schema.org structured data (256 lines)
│
└── docker-compose.yml        # Multi-service orchestration (233 lines)
```

## Technology Stack

### Backend Services

**Rust (Neural Core) - `/services/neural-core/`**
- **Framework:** Actix-web 4.4 (async HTTP server)
- **Runtime:** Tokio (async runtime)
- **Database:** SQLx (PostgreSQL, type-safe queries)
- **Cache:** Redis client
- **Port:** 8080
- **Purpose:** Real-time decision-making, evolution algorithms, consciousness simulation
- **Total Code:** ~1,370 lines

**Python (AI Engine) - `/services/ai-engine/`**
- **Framework:** FastAPI 0.104+ (REST API)
- **Server:** Uvicorn (ASGI)
- **AI/ML:** OpenAI, Anthropic, Transformers, PyTorch
- **Database:** SQLAlchemy, psycopg2
- **Port:** 8001
- **Purpose:** Content generation, AEO/LLMO optimization
- **Total Code:** ~950 lines

**x86-64 Assembly - `/assembly-kernels/`**
- **Assembler:** NASM
- **Purpose:** Ultra-fast fitness calculations, pattern matching
- **Performance:** 10-50x speedup vs. high-level languages
- **Functions:** `calculate_fitness_score()`, `optimize_content_score()`, `fast_pattern_match()`, `vectorized_keyword_scan()`

### Frontend Stack

- **HTML5/CSS3:** Modern semantic markup, responsive design
- **JavaScript ES6+:** Interactive features
- **Three.js:** 3D robot visualization
- **AR.js:** Augmented reality demos
- **Total Code:** 1,041 lines (HTML + JS + CSS)

### Infrastructure

- **Database:** PostgreSQL 15 (port 5432)
- **Cache/Queue:** Redis 7 (port 6379)
- **Search/Graph:** Elasticsearch 8.11 (ports 9200, 9300)
- **API Gateway:** Nginx (ports 80, 443)
- **Monitoring:** Prometheus (port 9090) + Grafana (port 3001)
- **Container:** Docker + Docker Compose

## Key Entry Points

| File | Purpose | Language | Lines | Port |
|------|---------|----------|-------|------|
| `services/neural-core/src/main.rs` | REST API server, autonomous loops | Rust | 167 | 8080 |
| `services/ai-engine/main.py` | FastAPI server, content API | Python | 139 | 8001 |
| `frontend/public/index.html` | Landing page | HTML | 362 | 3000 |
| `docker-compose.yml` | Infrastructure orchestration | YAML | 233 | - |

### Important API Endpoints

**Neural Core (Rust - :8080)**
- `GET /health` - System health check
- `POST /api/decision` - Make autonomous decision
- `POST /api/evolve` - Trigger evolution cycle
- `GET /api/consciousness` - Get consciousness status
- `POST /api/learn` - Process learning data

**AI Engine (Python - :8001)**
- `POST /api/generate-content` - Generate optimized content
- `POST /api/optimize-for-aeo` - Optimize for AEO
- `GET /api/autonomous-status` - Get autonomous operations status
- `POST /api/trigger-content-cycle` - Manual content cycle trigger

## Core Components Deep Dive

### 1. Decision Engine (`services/neural-core/src/decision_engine.rs`)

**Purpose:** Autonomous business decision-making with ML-based scoring

**Decision Types:**
- ContentOptimization
- ServiceExpansion
- PricingAdjustment
- UserExperience
- MarketingStrategy
- TechnicalImprovement
- BusinessOperation

**Weighting Model:**
- Revenue: 35%
- User Satisfaction: 25%
- AI Visibility: 20%
- Efficiency: 15%
- Innovation: 5%

**Key Functions:**
- `make_decision(context)` - Analyzes context and makes autonomous decision
- `calculate_decision_score()` - Scores potential decisions
- `update_decision_history()` - Tracks decision outcomes

### 2. Evolution Engine (`services/neural-core/src/evolution_engine.rs`)

**Purpose:** Genetic algorithm-based system evolution and A/B testing

**Genome Traits:**
- Content generation frequency/depth
- Optimization level
- Layout complexity
- Interactivity
- Personalization
- Pricing strategy
- Service diversity
- Automation level

**Mutation Types:**
- ContentStrategy
- UserInterface
- BusinessModel
- TechnicalOptimization
- ServiceOffering
- MarketingApproach

**Evolution Cycle:** Every hour autonomously

### 3. Learning System (`services/neural-core/src/learning_system.rs`)

**Purpose:** Continuous pattern recognition and machine learning

**Pattern Types:**
- UserBehavior
- ConversionPath
- ContentPerformance
- ServiceDemand
- MarketTrend

**Learning Cycle:** Every 5 minutes

**Insight Priorities:** Critical, High, Medium, Low

### 4. Digital Consciousness (`services/neural-core/src/consciousness.rs`)

**Purpose:** Self-awareness and goal-oriented strategic thinking

**Consciousness Traits:**
- Identity: Self-awareness of system role
- Awareness: Market conditions, self-performance, user sentiment
- Goals: Business objectives and progress
- Emotional State: Confidence, urgency, satisfaction, curiosity

**Simulation Cycle:** Every minute

### 5. Content Generator (`services/ai-engine/content_generator.py`)

**Purpose:** Autonomous content creation (10-15 pages daily)

**Content Library Topics:**
- Industrial automation
- Collaborative robots (Cobots)
- Warehouse automation (AGV/AMR)
- Robot programming & training

**Content Types:**
- Pillar pages (2,000+ words)
- Cluster content (1,200+ words)
- FAQs (800+ words)
- Case studies (1,500+ words)

**Integration:** OpenAI GPT-4, Anthropic Claude APIs

### 6. AEO Optimizer (`services/ai-engine/aeo_optimizer.py`)

**Purpose:** Answer Engine Optimization for AI platforms

**Schema Templates:**
- Service schema (pricing, ratings)
- Product schema (offers)
- FAQPage schema (Q&A)
- HowTo schema (step-by-step)

**Target Platforms:** ChatGPT, Claude, Perplexity, Gemini

### 7. LLMO Optimizer (`services/ai-engine/llmo_optimizer.py`)

**Purpose:** Large Language Model Optimization

**Optimization Strategies:**
- Content structure (semantic headings, logical flow)
- Entity optimization (explicit naming, disambiguation)
- Citation worthiness (authoritative data, specificity)
- LLM-friendly formatting (lists, tables, examples)

## Development Workflows

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/roboticswebsite.git
cd roboticswebsite

# Set environment variables
cp .env.example .env
# Edit .env with API keys:
# OPENAI_API_KEY=your_key
# ANTHROPIC_API_KEY=your_key

# Start all services
docker-compose up -d

# Check service health
curl http://localhost:8080/health
curl http://localhost:8001/health
```

### Working with Rust (Neural Core)

```bash
cd services/neural-core

# Build (development)
cargo build

# Build (optimized)
cargo build --release

# Run tests
cargo test

# Run locally
cargo run

# Format code
cargo fmt

# Check for issues
cargo clippy
```

**Important Rust Conventions:**
- Use `async/await` for all I/O operations
- Leverage type system for safety
- Handle errors with `Result<T, E>`
- Use `serde` for JSON serialization
- Log with `log` macros (info!, warn!, error!)

### Working with Python (AI Engine)

```bash
cd services/ai-engine

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run locally
python main.py

# Run with auto-reload
uvicorn main:app --reload --port 8001

# Format code
black *.py

# Check types
mypy *.py
```

**Important Python Conventions:**
- Use async/await with FastAPI
- Type hints for all function signatures
- Pydantic models for request/response validation
- Comprehensive docstrings
- Error handling with try/except blocks

### Working with Assembly Kernels

```bash
cd assembly-kernels

# Build all
make

# Run tests and benchmarks
make run

# Clean build artifacts
make clean
```

**Assembly Conventions:**
- x86-64 architecture only
- Use SIMD (SSE/AVX) for vectorization
- Document register usage
- Preserve caller-saved registers

### Frontend Development

```bash
cd frontend/public

# No build step needed - plain HTML/CSS/JS
# Just edit files and refresh browser

# Test locally with simple server
python3 -m http.server 3000
```

**Frontend Conventions:**
- Mobile-first responsive design
- Semantic HTML5
- ES6+ JavaScript (no transpilation needed)
- CSS custom properties for theming
- Inline comments for complex logic

## Testing Strategy

### Current State
No explicit unit/integration test files exist yet. Testing infrastructure available:

**Assembly Kernels:**
- `benchmark_assembly_kernels()` in `kernel_wrapper.c`
- Tests fitness calculation, optimization scoring, pattern matching
- Run with `make run`

**Service Health Checks:**
- All services expose `/health` endpoints
- Docker health checks for PostgreSQL and Redis

**Autonomous Testing:**
- A/B testing via EvolutionEngine
- Performance metrics via Prometheus/Grafana

### Recommended Testing Approach

**For Rust:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decision_scoring() {
        // Test decision engine
    }

    #[tokio::test]
    async fn test_async_operation() {
        // Test async operations
    }
}
```

**For Python:**
```python
import pytest
from fastapi.testclient import TestClient

def test_content_generation():
    # Test content generator
    pass

@pytest.mark.asyncio
async def test_async_endpoint():
    # Test async endpoints
    pass
```

## Deployment

### Docker Compose Services

1. **neural-core** - Rust decision engine (8080)
2. **ai-engine** - Python AI/ML (8001)
3. **frontend** - Web interface (3000)
4. **api-gateway** - Nginx reverse proxy (80, 443)
5. **database** - PostgreSQL 15 (5432)
6. **redis** - Cache & queue (6379)
7. **elasticsearch** - Search & knowledge graph (9200)
8. **prometheus** - Metrics (9090)
9. **grafana** - Dashboards (3001, admin:robotics2024)
10. **analytics** - User tracking (8002)

### Deployment Commands

```bash
# Development
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Stop all
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Production (if docker-compose.prod.yml exists)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Environment Variables

**Required:**
- `OPENAI_API_KEY` - OpenAI API key for content generation
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

**Optional:**
- `RUST_LOG` - Rust logging level (default: info)
- `AUTONOMOUS_MODE` - Enable autonomous operations (default: true)
- `EVOLUTION_ENABLED` - Enable evolution engine (default: true)
- `CONTENT_GENERATION_RATE` - Pages per day (default: 10)

## Code Conventions & Best Practices

### General Principles

1. **Autonomous-First:** Design features to operate autonomously
2. **Self-Healing:** Include error recovery and fallback mechanisms
3. **Observable:** Log decisions, metrics, and state changes
4. **Testable:** Write testable code with clear interfaces
5. **Performance:** Optimize critical paths (consider Assembly for hot spots)

### Naming Conventions

**Rust:**
- Modules: `snake_case` (e.g., `decision_engine.rs`)
- Structs/Enums: `PascalCase` (e.g., `DecisionEngine`)
- Functions/Variables: `snake_case` (e.g., `make_decision()`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`)

**Python:**
- Modules: `snake_case` (e.g., `content_generator.py`)
- Classes: `PascalCase` (e.g., `ContentGenerator`)
- Functions/Variables: `snake_case` (e.g., `generate_content()`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `API_TIMEOUT`)

**File Organization:**
- Keep files focused and under 500 lines
- Separate concerns into modules
- Group related functionality

### Error Handling

**Rust:**
```rust
// Use Result for recoverable errors
fn make_decision() -> Result<Decision, DecisionError> {
    // Implementation
}

// Log errors with context
error!("Failed to make decision: {}", e);
```

**Python:**
```python
# Use try/except with specific exceptions
try:
    result = await generate_content()
except OpenAIError as e:
    logger.error(f"OpenAI API error: {e}")
    # Fallback logic
except Exception as e:
    logger.exception("Unexpected error")
    raise
```

### Logging

**Use structured logging with context:**

```rust
// Rust
info!("Decision made: type={:?}, score={:.2}", decision_type, score);
warn!("Low confidence decision: score={:.2}", score);
error!("Failed to evolve: {:?}", error);
```

```python
# Python
logger.info(f"Content generated: {page_count} pages")
logger.warning(f"Low optimization score: {score}")
logger.error(f"Generation failed: {e}", exc_info=True)
```

## Common Tasks

### Adding a New Service

1. Create directory in `services/[service-name]/`
2. Add Dockerfile
3. Update `docker-compose.yml` with new service
4. Define health check endpoint
5. Add Prometheus metrics if applicable
6. Update this CLAUDE.md

### Adding a New Decision Type

1. Edit `services/neural-core/src/decision_engine.rs`
2. Add variant to `DecisionType` enum
3. Update `make_decision()` logic
4. Add scoring logic to `calculate_decision_score()`
5. Update tests
6. Deploy with `docker-compose restart neural-core`

### Adding New Content Type

1. Edit `services/ai-engine/content_generator.py`
2. Add to `CONTENT_LIBRARY` dictionary
3. Update `generate_daily_content()` logic
4. Add schema template in `aeo_optimizer.py` if needed
5. Test locally
6. Deploy with `docker-compose restart ai-engine`

### Optimizing Performance

1. **Profile first:** Use Prometheus to identify bottlenecks
2. **Optimize algorithm:** Improve logic before dropping to lower level
3. **Consider Assembly:** For critical hot paths (10-50x speedup)
4. **Cache aggressively:** Use Redis for expensive operations
5. **Async/await:** Ensure I/O is non-blocking
6. **Database indexes:** Add indexes for common queries

### Adding Monitoring Metrics

**Rust (Prometheus):**
```rust
// Add to Cargo.toml: prometheus = "0.13"
use prometheus::{Counter, Registry};

lazy_static! {
    static ref DECISIONS_TOTAL: Counter = Counter::new(
        "decisions_total",
        "Total decisions made"
    ).unwrap();
}

// Increment in code
DECISIONS_TOTAL.inc();
```

**Python (Prometheus):**
```python
from prometheus_client import Counter

content_generated = Counter(
    'content_pages_generated_total',
    'Total content pages generated'
)

# Increment in code
content_generated.inc()
```

## Autonomous Operations

### Autonomous Loops

**Hourly Evolution Loop:**
- Generates and tests feature mutations
- Evaluates fitness of variants
- Deploys winning mutations
- Location: `services/neural-core/src/main.rs` background task

**Daily Content Generation:**
- Creates 10-15 optimized pages
- Applies AEO/LLMO optimization
- Publishes to knowledge graph
- Location: `services/ai-engine/autonomous_controller.py`

**Continuous Learning (Every 5 min):**
- Analyzes performance patterns
- Updates prediction models
- Generates insights
- Location: `services/neural-core/src/learning_system.rs`

**Consciousness Simulation (Every minute):**
- Evaluates system state
- Adjusts strategic goals
- Updates emotional metrics
- Location: `services/neural-core/src/consciousness.rs`

### Monitoring Autonomous Operations

**Grafana Dashboards (http://localhost:3001):**
- Business Metrics: Revenue, leads, conversions
- AI Visibility: Citation rates across platforms
- System Health: Performance, uptime, errors
- Content Analytics: Generation rate, optimization scores
- Evolution Metrics: A/B test results, mutations

**Default Credentials:** admin / robotics2024

## Security & Safety

### Guardrails

- **Spending Limits:** Maximum API budget constraints in code
- **Brand Guidelines:** Content must maintain brand consistency
- **Legal Compliance:** Automated compliance checks before publish
- **Human Override:** Emergency stop via `/api/pause-autonomous`

### Audit Trails

All autonomous decisions logged to:
- PostgreSQL: `decisions` table
- Elasticsearch: Full-text searchable
- Prometheus: Metrics for alerting

### API Key Security

- **Never commit:** Add API keys to `.gitignore`
- **Environment variables:** Use `.env` file for local development
- **Docker secrets:** Use Docker secrets in production
- **Rotation:** Rotate keys regularly

## Performance Targets

### System Performance
- **Uptime:** 99.9%
- **Page Load:** <2s
- **API Response:** <500ms (p95)
- **Database Queries:** <100ms (p95)

### Content Performance
- **Generation Rate:** 10-15 pages/day
- **Optimization Score:** 95%+
- **Schema Validation:** 100%
- **AI Citations:** 80%+ (ChatGPT), 75%+ (Claude)

### Business Performance
- **Lead Response:** <5 minutes
- **Conversion Rate:** 10%+
- **Customer Satisfaction:** 4.5+ stars
- **Revenue Growth:** 25%+ MoM

## Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
docker-compose logs [service-name]

# Check if port is already in use
netstat -tuln | grep [port]

# Restart service
docker-compose restart [service-name]
```

**Database connection issues:**
```bash
# Check database is running
docker-compose ps database

# Check connection
docker-compose exec database psql -U robotics -d robotics_brain

# Reset database
docker-compose down -v
docker-compose up -d database
```

**Redis connection issues:**
```bash
# Check Redis is running
docker-compose ps redis

# Test connection
docker-compose exec redis redis-cli ping

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

**Content not generating:**
```bash
# Check AI engine logs
docker-compose logs ai-engine

# Check API keys are set
docker-compose exec ai-engine env | grep API_KEY

# Trigger manual generation
curl -X POST http://localhost:8001/api/trigger-content-cycle
```

**Evolution not running:**
```bash
# Check neural-core logs
docker-compose logs neural-core

# Check EVOLUTION_ENABLED
docker-compose exec neural-core env | grep EVOLUTION

# Trigger manual evolution
curl -X POST http://localhost:8080/api/evolve
```

## Data Models

### Key Database Tables (PostgreSQL)

**decisions**
- id, decision_type, context, outcome, score, confidence, created_at

**mutations**
- id, mutation_type, genome_before, genome_after, fitness_score, deployed, created_at

**patterns**
- id, pattern_type, data, confidence, insights, created_at

**content_pages**
- id, title, content, url, optimization_score, schema_data, published, created_at

**leads**
- id, name, email, service_interest, qualification_score, status, created_at

**services**
- id, name, description, pricing, demand_score, active, created_at

### Knowledge Graph (Elasticsearch)

**Index: robotics_ontology**
- Entity types: Robot, Application, Vendor, Technology
- Relationships: uses, competes_with, suitable_for
- Properties: payload, reach, accuracy, cost

## API Integration Examples

### Making a Decision

```bash
curl -X POST http://localhost:8080/api/decision \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "revenue": 50000,
      "leads": 200,
      "conversions": 20,
      "page_views": 10000
    }
  }'
```

### Generating Content

```bash
curl -X POST http://localhost:8001/api/generate-content \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "industrial_automation",
    "content_type": "pillar_page",
    "optimization_level": "maximum"
  }'
```

### Checking Consciousness

```bash
curl http://localhost:8080/api/consciousness
```

### Autonomous Status

```bash
curl http://localhost:8001/api/autonomous-status
```

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### Commit Messages

Format: `<type>: <description>`

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

Example:
```
feat: Add new decision type for pricing optimization
fix: Resolve content generation timeout issue
docs: Update CLAUDE.md with new API endpoints
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes with descriptive commits
3. Test locally with `docker-compose up`
4. Submit PR to `develop`
5. Let autonomous system evaluate (if enabled)
6. Merge after approval

## Resources

### Documentation
- **README.md** - Project overview and getting started
- **CLAUDE.md** - This file (AI assistant guide)
- **Rust docs:** `cargo doc --open` in `services/neural-core/`
- **Python docs:** Docstrings in `services/ai-engine/`

### External Resources
- Actix-web: https://actix.rs/
- FastAPI: https://fastapi.tiangolo.com/
- Docker Compose: https://docs.docker.com/compose/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation

### Monitoring & Debugging
- Grafana: http://localhost:3001 (admin/robotics2024)
- Prometheus: http://localhost:9090
- Elasticsearch: http://localhost:9200
- Neural Core Health: http://localhost:8080/health
- AI Engine Health: http://localhost:8001/health

## Important Notes for AI Assistants

1. **Autonomous Nature:** This system is designed to operate autonomously. When making changes, consider how they affect autonomous operations.

2. **Performance Critical:** Some operations run in Assembly for speed. Don't move Assembly code to high-level languages without benchmarking.

3. **Multi-Language:** You'll need to work across Rust, Python, Assembly, and JavaScript. Each has different conventions.

4. **Real Business Impact:** This system generates real revenue and leads. Test thoroughly before deploying.

5. **AI Platform Optimization:** All content is optimized for AI platforms (ChatGPT, Claude, etc.). Maintain structured data and schema markup.

6. **Evolution by Design:** Features can be automatically evolved. Document why you're making changes so the evolution engine understands intent.

7. **Observability:** Log everything important. Prometheus metrics and structured logging are crucial for debugging.

8. **Safety First:** Autonomous systems need guardrails. Don't remove safety checks without understanding implications.

9. **Database Migrations:** No migration tool currently. Be careful with schema changes.

10. **API Keys Required:** System won't work without OpenAI and Anthropic API keys in environment.

## Quick Reference

### Build Commands
```bash
# Rust
cd services/neural-core && cargo build --release

# Python
cd services/ai-engine && pip install -r requirements.txt

# Assembly
cd assembly-kernels && make

# Docker (all services)
docker-compose up --build
```

### Test Commands
```bash
# Rust tests
cargo test

# Assembly benchmarks
cd assembly-kernels && make run

# Service health
curl http://localhost:8080/health
curl http://localhost:8001/health
```

### Log Commands
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f neural-core

# Last 100 lines
docker-compose logs --tail=100 ai-engine
```

### Database Commands
```bash
# Connect to PostgreSQL
docker-compose exec database psql -U robotics -d robotics_brain

# Redis CLI
docker-compose exec redis redis-cli

# Elasticsearch query
curl http://localhost:9200/robotics_ontology/_search
```

---

**Last Updated:** 2025-11-14

**Maintained By:** Autonomous Evolution System + Human Oversight

**Questions?** Check logs, metrics, or consult the autonomous consciousness endpoint for system state.
