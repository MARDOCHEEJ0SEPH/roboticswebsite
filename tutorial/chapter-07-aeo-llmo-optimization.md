# Chapter 7: AEO and LLMO Optimization

## Understanding Answer Engine Optimization

Answer Engine Optimization (AEO) prepares your content to be discovered and cited by AI platforms like ChatGPT, Claude, Perplexity, and other large language models.

### Key Differences: SEO vs AEO

| Aspect | SEO | AEO |
|--------|-----|-----|
| Target | Search engines | AI models |
| Format | Web pages | Structured data |
| Goal | Rankings | Citations |
| Metric | Click-through rate | Mention frequency |
| Optimization | Keywords | Context and clarity |

## Schema.org Structured Data

### Service Schema

Create `services/ai-engine/app/services/schema_generator.py`:

```python
from typing import Dict, Any, List
import json

class SchemaGenerator:
    def __init__(self, base_url: str, organization_name: str):
        self.base_url = base_url
        self.organization_name = organization_name

    def generate_service_schema(
        self,
        service_name: str,
        description: str,
        service_type: str,
        price_range: str = "$$-$$$"
    ) -> Dict[str, Any]:
        return {
            "@context": "https://schema.org",
            "@type": "Service",
            "name": service_name,
            "description": description,
            "serviceType": service_type,
            "provider": {
                "@type": "Organization",
                "name": self.organization_name,
                "url": self.base_url
            },
            "areaServed": {
                "@type": "Country",
                "name": "United States"
            },
            "priceRange": price_range,
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "127"
            }
        }

    def generate_faq_schema(
        self,
        questions_answers: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        main_entity = []

        for qa in questions_answers:
            main_entity.append({
                "@type": "Question",
                "name": qa["question"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": qa["answer"]
                }
            })

        return {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": main_entity
        }

    def generate_howto_schema(
        self,
        name: str,
        description: str,
        steps: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        step_list = []

        for idx, step in enumerate(steps, 1):
            step_list.append({
                "@type": "HowToStep",
                "position": idx,
                "name": step["name"],
                "text": step["text"],
                "url": f"{self.base_url}#{step['name'].lower().replace(' ', '-')}"
            })

        return {
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": name,
            "description": description,
            "step": step_list
        }

    def generate_article_schema(
        self,
        headline: str,
        description: str,
        author: str,
        date_published: str,
        image_url: str = None
    ) -> Dict[str, Any]:
        schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": headline,
            "description": description,
            "author": {
                "@type": "Person",
                "name": author
            },
            "publisher": {
                "@type": "Organization",
                "name": self.organization_name,
                "url": self.base_url
            },
            "datePublished": date_published,
            "dateModified": date_published
        }

        if image_url:
            schema["image"] = image_url

        return schema
```

## LLMO Content Optimization

### Content Structure Optimizer

Create `services/ai-engine/app/services/llmo_optimizer.py`:

```python
from typing import Dict, List, Any
import re
from dataclasses import dataclass

@dataclass
class OptimizationResult:
    score: float
    recommendations: List[str]
    improved_content: str

class LLMOOptimizer:
    """Optimizes content for Large Language Model comprehension"""

    def __init__(self):
        self.min_section_words = 150
        self.max_section_words = 800
        self.ideal_paragraph_sentences = 4

    def optimize(self, content: str) -> OptimizationResult:
        score = 0.0
        recommendations = []

        # Check structure
        structure_score = self._analyze_structure(content)
        score += structure_score * 0.25

        # Check entity clarity
        entity_score = self._analyze_entities(content)
        score += entity_score * 0.25

        # Check actionability
        action_score = self._analyze_actionability(content)
        score += action_score * 0.20

        # Check citation worthiness
        citation_score = self._analyze_citation_worthiness(content)
        score += citation_score * 0.30

        # Generate recommendations
        if structure_score < 0.7:
            recommendations.append("Improve content structure with clear headings")
        if entity_score < 0.7:
            recommendations.append("Add more specific entity definitions")
        if action_score < 0.7:
            recommendations.append("Include more actionable insights")
        if citation_score < 0.7:
            recommendations.append("Add statistics and data points for citation worthiness")

        # Improve content
        improved = self._improve_content(content)

        return OptimizationResult(
            score=score,
            recommendations=recommendations,
            improved_content=improved
        )

    def _analyze_structure(self, content: str) -> float:
        score = 0.0

        # Check for headings
        h1_count = len(re.findall(r'^# .+$', content, re.MULTILINE))
        h2_count = len(re.findall(r'^## .+$', content, re.MULTILINE))
        h3_count = len(re.findall(r'^### .+$', content, re.MULTILINE))

        if h1_count == 1:
            score += 0.3
        if h2_count >= 3:
            score += 0.3
        if h3_count >= 2:
            score += 0.2

        # Check for lists
        if re.search(r'^\s*[-*]\s', content, re.MULTILINE):
            score += 0.1
        if re.search(r'^\s*\d+\.\s', content, re.MULTILINE):
            score += 0.1

        return min(score, 1.0)

    def _analyze_entities(self, content: str) -> float:
        score = 0.0

        # Check for definitions (e.g., "X is a Y that...")
        definition_pattern = r'\b(\w+)\s+is\s+a\s+(\w+)\s+that\b'
        definitions = len(re.findall(definition_pattern, content, re.IGNORECASE))
        score += min(definitions * 0.2, 0.4)

        # Check for examples (e.g., "for example", "such as")
        example_pattern = r'\b(for example|such as|like|including)\b'
        examples = len(re.findall(example_pattern, content, re.IGNORECASE))
        score += min(examples * 0.15, 0.3)

        # Check for specific numbers/data
        numbers = len(re.findall(r'\b\d+%|\$\d+|\d+\s+years?\b', content))
        score += min(numbers * 0.1, 0.3)

        return min(score, 1.0)

    def _analyze_actionability(self, content: str) -> float:
        score = 0.0

        # Check for imperative verbs
        action_verbs = ['implement', 'use', 'apply', 'create', 'build', 'develop',
                       'optimize', 'analyze', 'measure', 'configure', 'deploy']

        for verb in action_verbs:
            if re.search(rf'\b{verb}\b', content, re.IGNORECASE):
                score += 0.1

        # Check for step-by-step instructions
        if re.search(r'step\s+\d+', content, re.IGNORECASE):
            score += 0.2

        # Check for how-to content
        if re.search(r'\bhow to\b', content, re.IGNORECASE):
            score += 0.1

        return min(score, 1.0)

    def _analyze_citation_worthiness(self, content: str) -> float:
        score = 0.0

        # Check for statistics
        stats_pattern = r'\b\d+%\b|\b\d+x\b|\b\$[\d,]+\b'
        stats = len(re.findall(stats_pattern, content))
        score += min(stats * 0.15, 0.4)

        # Check for source attribution
        if re.search(r'\baccording to\b|\bstudy\b|\bresearch\b', content, re.IGNORECASE):
            score += 0.2

        # Check for specific timeframes
        if re.search(r'\bin 202\d\b|\blast year\b|\brecent\b', content, re.IGNORECASE):
            score += 0.2

        # Check for authoritative language
        if re.search(r'\bproven\b|\bvalidated\b|\bverified\b', content, re.IGNORECASE):
            score += 0.2

        return min(score, 1.0)

    def _improve_content(self, content: str) -> str:
        # Add section markers if missing
        if not re.search(r'^## ', content, re.MULTILINE):
            content = self._add_sections(content)

        # Add bullet points where appropriate
        content = self._add_bullet_points(content)

        # Add definitions for key terms
        content = self._enhance_entities(content)

        return content

    def _add_sections(self, content: str) -> str:
        # Split content into paragraphs
        paragraphs = content.split('\n\n')

        improved = []
        section_count = 0

        for para in paragraphs:
            if len(para.split()) > 100 and section_count < 5:
                improved.append(f"## Section {section_count + 1}\n\n{para}")
                section_count += 1
            else:
                improved.append(para)

        return '\n\n'.join(improved)

    def _add_bullet_points(self, content: str) -> str:
        # Convert comma-separated lists to bullet points
        pattern = r'(\w+(?:, \w+){2,}(?:, and \w+)?)'

        def replace_with_bullets(match):
            items = match.group(1).split(', ')
            bullets = '\n'.join([f"- {item}" for item in items])
            return bullets

        return re.sub(pattern, replace_with_bullets, content)

    def _enhance_entities(self, content: str) -> str:
        # This would use NLP to identify and enhance entity definitions
        # Simplified version for demonstration
        return content
```

### AEO Optimizer

Create `services/ai-engine/app/services/aeo_optimizer.py`:

```python
from typing import Dict, List, Any
from app.services.schema_generator import SchemaGenerator
from app.services.llmo_optimizer import LLMOOptimizer
import re

class AEOOptimizer:
    """Combines schema markup and LLMO for comprehensive AEO"""

    def __init__(self, base_url: str, organization_name: str):
        self.schema_generator = SchemaGenerator(base_url, organization_name)
        self.llmo_optimizer = LLMOOptimizer()

    def optimize_for_aeo(
        self,
        content: str,
        content_type: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        # LLMO optimization
        llmo_result = self.llmo_optimizer.optimize(content)

        # Generate appropriate schema
        schema = self._generate_schema(
            content=llmo_result.improved_content,
            content_type=content_type,
            metadata=metadata
        )

        # Extract key facts for citation
        key_facts = self._extract_key_facts(llmo_result.improved_content)

        # Calculate overall AEO score
        aeo_score = self._calculate_aeo_score(
            llmo_score=llmo_result.score,
            has_schema=schema is not None,
            key_facts_count=len(key_facts)
        )

        return {
            "optimized_content": llmo_result.improved_content,
            "schema_markup": schema,
            "key_facts": key_facts,
            "aeo_score": aeo_score,
            "recommendations": llmo_result.recommendations
        }

    def _generate_schema(
        self,
        content: str,
        content_type: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        if content_type == "service":
            return self.schema_generator.generate_service_schema(
                service_name=metadata.get("title", ""),
                description=metadata.get("description", ""),
                service_type=metadata.get("service_type", "Professional Service")
            )
        elif content_type == "faq":
            qa_pairs = self._extract_qa_pairs(content)
            return self.schema_generator.generate_faq_schema(qa_pairs)
        elif content_type == "howto":
            steps = self._extract_steps(content)
            return self.schema_generator.generate_howto_schema(
                name=metadata.get("title", ""),
                description=metadata.get("description", ""),
                steps=steps
            )
        else:
            return self.schema_generator.generate_article_schema(
                headline=metadata.get("title", ""),
                description=metadata.get("description", ""),
                author=metadata.get("author", "Expert Team"),
                date_published=metadata.get("date_published", "")
            )

    def _extract_qa_pairs(self, content: str) -> List[Dict[str, str]]:
        qa_pairs = []

        # Match question-answer patterns
        pattern = r'(?:^|\n)(?:\*\*)?(.+\?)\s*(?:\*\*)?\s*\n+(.+?)(?=\n\n|\n(?:\*\*)?[A-Z].+\?|$)'
        matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)

        for match in matches:
            qa_pairs.append({
                "question": match.group(1).strip(),
                "answer": match.group(2).strip()
            })

        return qa_pairs

    def _extract_steps(self, content: str) -> List[Dict[str, str]]:
        steps = []

        # Match numbered steps
        pattern = r'(?:Step\s+)?(\d+)[.:\s]+(.+?)(?=(?:Step\s+)?\d+[.:\s]|$)'
        matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)

        for match in matches:
            steps.append({
                "name": f"Step {match.group(1)}",
                "text": match.group(2).strip()
            })

        return steps

    def _extract_key_facts(self, content: str) -> List[str]:
        facts = []

        # Extract sentences with statistics
        stat_pattern = r'[^.!?]*\b\d+%[^.!?]*[.!?]'
        stats = re.findall(stat_pattern, content)
        facts.extend([s.strip() for s in stats])

        # Extract sentences with dollar amounts
        money_pattern = r'[^.!?]*\$[\d,]+[^.!?]*[.!?]'
        money = re.findall(money_pattern, content)
        facts.extend([m.strip() for m in money])

        # Extract definitive statements
        definitive_pattern = r'[^.!?]*\b(?:proven|demonstrated|verified|confirmed)[^.!?]*[.!?]'
        definitive = re.findall(definitive_pattern, content, re.IGNORECASE)
        facts.extend([d.strip() for d in definitive])

        return list(set(facts))[:10]  # Top 10 unique facts

    def _calculate_aeo_score(
        self,
        llmo_score: float,
        has_schema: bool,
        key_facts_count: int
    ) -> float:
        score = llmo_score * 0.6

        if has_schema:
            score += 0.2

        facts_score = min(key_facts_count / 10, 1.0) * 0.2
        score += facts_score

        return round(score, 2)
```

## Integration with Content Generation

Update the content generation to include AEO optimization:

```python
# In content_generator.py
from app.services.aeo_optimizer import AEOOptimizer

class ContentGenerator:
    def __init__(self, ai_client, template_engine, aeo_optimizer):
        self.ai_client = ai_client
        self.template_engine = template_engine
        self.aeo_optimizer = aeo_optimizer

    async def generate_and_optimize(
        self,
        topic: str,
        content_type: str,
        target_audience: str,
        keywords: List[str],
        db: AsyncSession
    ) -> Content:
        # Generate base content
        content = await self.generate_content(
            topic, content_type, target_audience, keywords, db
        )

        # Apply AEO optimization
        aeo_result = self.aeo_optimizer.optimize_for_aeo(
            content=content.body,
            content_type=content_type,
            metadata={
                "title": content.title,
                "description": content.excerpt,
                "date_published": content.created_at.isoformat()
            }
        )

        # Update content with optimized version
        content.body = aeo_result["optimized_content"]
        content.optimization_score = aeo_result["aeo_score"]
        content.seo_data = {
            "schema_markup": aeo_result["schema_markup"],
            "key_facts": aeo_result["key_facts"]
        }

        await db.commit()
        await db.refresh(content)

        return content
```

## Embedding Schema in HTML

When serving content, embed the schema:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Complete Guide to Business Automation",
  "description": "Learn how to automate your business processes...",
  "author": {
    "@type": "Person",
    "name": "Expert Team"
  },
  "datePublished": "2024-01-15",
  "dateModified": "2024-01-15"
}
</script>
```

## Testing AEO Effectiveness

Monitor how AI platforms reference your content:

```python
class AEOAnalytics:
    def track_citation(
        self,
        content_id: str,
        platform: str,
        query: str,
        cited: bool
    ):
        # Track when content is cited by AI platforms
        pass

    def get_citation_rate(self, content_id: str) -> float:
        # Calculate how often content is cited
        pass
```

## Next Steps

Chapter 8 will cover building the decision engine that makes autonomous business decisions based on data, implementing weighted scoring, and creating feedback loops for continuous improvement.
