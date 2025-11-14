# Chapter 6: Content Generation System

## Overview

The content generation system is the heart of your autonomous platform. It creates SEO-optimized content automatically using AI, reducing the need for manual content creation while maintaining quality and relevance.

## Architecture

```
Content Request → Template Selection → AI Generation → Post-Processing → Storage
```

## Python AI Engine Setup

### Project Structure

```
services/ai-engine/
├── app/
│   ├── main.py
│   ├── models/
│   │   ├── content.py
│   │   └── schemas.py
│   ├── services/
│   │   ├── content_generator.py
│   │   ├── ai_client.py
│   │   └── template_engine.py
│   ├── config.py
│   └── database.py
├── templates/
│   ├── pillar_page.txt
│   ├── cluster_page.txt
│   └── faq.txt
├── requirements.txt
└── Dockerfile
```

### Configuration

Create `services/ai-engine/app/config.py`:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    openai_api_key: str
    anthropic_api_key: str
    environment: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
```

### Database Models

Create `services/ai-engine/app/models/content.py`:

```python
from sqlalchemy import Column, String, Text, Integer, TIMESTAMP, DECIMAL, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
import uuid
from datetime import datetime

Base = declarative_base()

class Content(Base):
    __tablename__ = "content"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    slug = Column(String(500), unique=True, nullable=False)
    content_type = Column(String(50), nullable=False)
    body = Column(Text, nullable=False)
    excerpt = Column(Text)
    metadata = Column(JSONB, default={})
    seo_data = Column(JSONB, default={})
    optimization_score = Column(DECIMAL(5, 2))
    target_keywords = Column(ARRAY(Text))
    word_count = Column(Integer)
    status = Column(String(20), default='draft')
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    published_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow)
```

Create `services/ai-engine/app/models/schemas.py`:

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class ContentGenerationRequest(BaseModel):
    topic: str
    content_type: str = Field(..., pattern="^(pillar|cluster|faq|case_study)$")
    target_audience: str = "business_decision_makers"
    keywords: List[str] = []
    optimization_level: float = Field(0.9, ge=0.0, le=1.0)

class ContentResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content_type: str
    body: str
    excerpt: Optional[str]
    optimization_score: Optional[float]
    word_count: int
    created_at: datetime

    class Config:
        from_attributes = True
```

### AI Client Service

Create `services/ai-engine/app/services/ai_client.py`:

```python
import openai
import anthropic
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class AIClient:
    def __init__(self, openai_key: str, anthropic_key: str):
        self.openai_client = openai.OpenAI(api_key=openai_key)
        self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key)

    async def generate_with_openai(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert content writer specializing in business and technology."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI generation failed: {e}")
            raise

    async def generate_with_claude(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        try:
            response = self.anthropic_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Claude generation failed: {e}")
            raise

    async def generate(
        self,
        prompt: str,
        provider: str = "openai",
        **kwargs
    ) -> str:
        if provider == "openai":
            return await self.generate_with_openai(prompt, **kwargs)
        elif provider == "claude":
            return await self.generate_with_claude(prompt, **kwargs)
        else:
            raise ValueError(f"Unknown provider: {provider}")
```

### Template Engine

Create `templates/pillar_page.txt`:

```
Generate a comprehensive pillar page about {topic} for {target_audience}.

Requirements:
- 2500-3500 words
- Target keywords: {keywords}
- Include these sections:
  1. Introduction (200-300 words)
  2. Core Concepts (500-700 words)
  3. Benefits and Value Proposition (400-500 words)
  4. Implementation Guide (600-800 words)
  5. Common Challenges and Solutions (400-500 words)
  6. Best Practices (300-400 words)
  7. Case Study Examples (300-400 words)
  8. Conclusion and Next Steps (200-300 words)

Style Guidelines:
- Professional yet accessible tone
- Use subheadings for each section
- Include bullet points and numbered lists where appropriate
- Incorporate statistics and data points
- Add actionable insights
- SEO-optimized with natural keyword integration

Format as markdown.
```

Create `templates/cluster_page.txt`:

```
Generate a focused cluster page about {topic} for {target_audience}.

This content should support a pillar page and dive deep into a specific aspect.

Requirements:
- 800-1200 words
- Target keywords: {keywords}
- Include these sections:
  1. Introduction (150-200 words)
  2. Detailed Explanation (400-600 words)
  3. Practical Applications (200-300 words)
  4. Conclusion (100-150 words)

Style Guidelines:
- Clear and concise
- Actionable advice
- Natural keyword usage
- Link back to pillar content where relevant

Format as markdown.
```

Create `services/ai-engine/app/services/template_engine.py`:

```python
from typing import Dict, Any
import os

class TemplateEngine:
    def __init__(self, templates_dir: str = "templates"):
        self.templates_dir = templates_dir
        self.templates = self._load_templates()

    def _load_templates(self) -> Dict[str, str]:
        templates = {}
        for filename in os.listdir(self.templates_dir):
            if filename.endswith('.txt'):
                template_name = filename.replace('.txt', '')
                with open(os.path.join(self.templates_dir, filename), 'r') as f:
                    templates[template_name] = f.read()
        return templates

    def render(self, template_name: str, variables: Dict[str, Any]) -> str:
        if template_name not in self.templates:
            raise ValueError(f"Template {template_name} not found")

        template = self.templates[template_name]
        return template.format(**variables)
```

### Content Generator Service

Create `services/ai-engine/app/services/content_generator.py`:

```python
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.content import Content
from app.services.ai_client import AIClient
from app.services.template_engine import TemplateEngine
import re
import logging

logger = logging.getLogger(__name__)

class ContentGenerator:
    def __init__(self, ai_client: AIClient, template_engine: TemplateEngine):
        self.ai_client = ai_client
        self.template_engine = template_engine

    async def generate_content(
        self,
        topic: str,
        content_type: str,
        target_audience: str,
        keywords: List[str],
        db: AsyncSession
    ) -> Content:
        # Select template based on content type
        template_name = content_type + "_page"

        # Prepare template variables
        variables = {
            "topic": topic,
            "target_audience": target_audience,
            "keywords": ", ".join(keywords)
        }

        # Render prompt from template
        prompt = self.template_engine.render(template_name, variables)

        # Generate content using AI
        logger.info(f"Generating {content_type} content for: {topic}")
        body = await self.ai_client.generate(prompt, provider="openai")

        # Extract title from content
        title = self._extract_title(body, topic)

        # Generate excerpt
        excerpt = self._generate_excerpt(body)

        # Calculate word count
        word_count = len(body.split())

        # Create content object
        content = Content(
            title=title,
            slug=self._slugify(title),
            content_type=content_type,
            body=body,
            excerpt=excerpt,
            target_keywords=keywords,
            word_count=word_count,
            metadata={
                "target_audience": target_audience,
                "generation_method": "ai_assisted"
            }
        )

        # Save to database
        db.add(content)
        await db.commit()
        await db.refresh(content)

        logger.info(f"Content generated: {content.id}")
        return content

    def _extract_title(self, body: str, fallback: str) -> str:
        # Try to extract first heading
        match = re.search(r'^#\s+(.+)$', body, re.MULTILINE)
        if match:
            return match.group(1)
        return fallback

    def _generate_excerpt(self, body: str, max_length: int = 200) -> str:
        # Remove markdown formatting
        text = re.sub(r'[#*_\[\]]', '', body)
        # Get first paragraph
        first_para = text.split('\n\n')[0]
        # Trim to max length
        if len(first_para) > max_length:
            return first_para[:max_length] + "..."
        return first_para

    def _slugify(self, text: str) -> str:
        # Convert to lowercase
        text = text.lower()
        # Replace spaces with hyphens
        text = re.sub(r'\s+', '-', text)
        # Remove special characters
        text = re.sub(r'[^a-z0-9-]', '', text)
        # Remove duplicate hyphens
        text = re.sub(r'-+', '-', text)
        return text.strip('-')

    async def generate_batch(
        self,
        topics: List[Dict[str, Any]],
        db: AsyncSession
    ) -> List[Content]:
        contents = []
        for topic_config in topics:
            content = await self.generate_content(
                topic=topic_config['topic'],
                content_type=topic_config.get('content_type', 'cluster'),
                target_audience=topic_config.get('target_audience', 'business_decision_makers'),
                keywords=topic_config.get('keywords', []),
                db=db
            )
            contents.append(content)
        return contents
```

### FastAPI Main Application

Create `services/ai-engine/app/main.py`:

```python
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

from app.config import settings
from app.database import get_db, engine
from app.models.content import Base
from app.models.schemas import ContentGenerationRequest, ContentResponse
from app.services.ai_client import AIClient
from app.services.template_engine import TemplateEngine
from app.services.content_generator import ContentGenerator

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="AI Content Engine", version="1.0.0")

# Initialize services
ai_client = AIClient(
    openai_key=settings.openai_api_key,
    anthropic_key=settings.anthropic_api_key
)
template_engine = TemplateEngine()
content_generator = ContentGenerator(ai_client, template_engine)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("AI Engine started")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-engine",
        "version": "1.0.0"
    }

@app.post("/api/generate-content", response_model=ContentResponse)
async def generate_content(
    request: ContentGenerationRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        content = await content_generator.generate_content(
            topic=request.topic,
            content_type=request.content_type,
            target_audience=request.target_audience,
            keywords=request.keywords,
            db=db
        )
        return content
    except Exception as e:
        logger.error(f"Content generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/content", response_model=List[ContentResponse])
async def list_content(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    from app.models.content import Content
    result = await db.execute(
        Content.__table__.select().order_by(Content.created_at.desc()).limit(limit)
    )
    contents = result.fetchall()
    return contents

@app.post("/api/autonomous-cycle")
async def trigger_autonomous_cycle(db: AsyncSession = Depends(get_db)):
    # Define topics to generate
    topics = [
        {
            "topic": "Business Process Automation",
            "content_type": "cluster",
            "keywords": ["automation", "efficiency", "productivity"]
        },
        {
            "topic": "ROI of Automation",
            "content_type": "cluster",
            "keywords": ["roi", "cost savings", "investment"]
        }
    ]

    contents = await content_generator.generate_batch(topics, db)

    return {
        "status": "success",
        "generated": len(contents),
        "content_ids": [str(c.id) for c in contents]
    }
```

Create `services/ai-engine/app/database.py`:

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_async_engine(
    settings.database_url.replace('postgresql://', 'postgresql+asyncpg://'),
    echo=True
)

async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with async_session_maker() as session:
        yield session
```

## Automated Content Pipeline

Create a scheduler for autonomous content generation:

```python
import asyncio
from datetime import datetime

async def autonomous_content_cycle():
    while True:
        hour = datetime.now().hour

        # Generate content at specific times
        if hour == 9:  # Morning content generation
            await trigger_generation("pillar", 1)
        elif hour == 14:  # Afternoon content generation
            await trigger_generation("cluster", 3)
        elif hour == 18:  # Evening FAQ generation
            await trigger_generation("faq", 2)

        # Wait 1 hour
        await asyncio.sleep(3600)

async def trigger_generation(content_type: str, count: int):
    # Implementation for scheduled generation
    pass
```

## Content Quality Metrics

Track content performance:

```python
class ContentQualityAnalyzer:
    def analyze(self, content: str) -> Dict[str, float]:
        return {
            "readability_score": self._calculate_readability(content),
            "keyword_density": self._calculate_keyword_density(content),
            "structure_score": self._analyze_structure(content),
            "uniqueness_score": self._check_uniqueness(content)
        }

    def _calculate_readability(self, content: str) -> float:
        # Flesch Reading Ease calculation
        words = len(content.split())
        sentences = content.count('.') + content.count('!') + content.count('?')
        syllables = self._count_syllables(content)

        if sentences == 0 or words == 0:
            return 0.0

        score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
        return max(0.0, min(100.0, score)) / 100.0
```

## Next Steps

Chapter 7 will cover AEO (Answer Engine Optimization) and LLMO (Large Language Model Optimization), teaching you how to optimize your content for AI platforms like ChatGPT, Claude, and Perplexity.
