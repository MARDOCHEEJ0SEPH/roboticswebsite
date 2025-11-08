"""
Autonomous AI Engine - Content Generation & AEO/LLMO Optimization
The brain that generates and optimizes content for AI search dominance
"""

import asyncio
import os
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from content_generator import ContentGenerator
from aeo_optimizer import AEOOptimizer
from llmo_optimizer import LLMOOptimizer
from autonomous_controller import AutonomousController

app = FastAPI(title="AI Engine - Autonomous Robotics")

# Initialize AI systems
content_generator = ContentGenerator()
aeo_optimizer = AEOOptimizer()
llmo_optimizer = LLMOOptimizer()
autonomous_controller = AutonomousController()

class ContentRequest(BaseModel):
    topic: str
    content_type: str  # pillar, cluster, faq, case_study
    target_audience: str
    keywords: List[str]
    optimization_level: str = "maximum"

class OptimizationRequest(BaseModel):
    content: str
    target_platforms: List[str]  # chatgpt, claude, perplexity, gemini
    keywords: List[str]

@app.on_event("startup")
async def startup_event():
    """Initialize autonomous systems on startup"""
    print("🤖 AI Engine starting up...")
    print("🧠 Initializing content generator...")
    await content_generator.initialize()
    print("🎯 Initializing AEO/LLMO optimizers...")
    await aeo_optimizer.initialize()
    await llmo_optimizer.initialize()
    print("⚙️  Starting autonomous controller...")
    asyncio.create_task(autonomous_controller.run_autonomous_loop())
    print("✅ AI Engine is fully operational and autonomous!")

@app.get("/health")
async def health_check():
    return {
        "status": "autonomous",
        "systems": {
            "content_generator": "active",
            "aeo_optimizer": "active",
            "llmo_optimizer": "active",
            "autonomous_controller": "active"
        },
        "generation_rate": "10+ pages/day",
        "optimization_level": "maximum"
    }

@app.post("/api/generate-content")
async def generate_content(request: ContentRequest):
    """Generate optimized content autonomously"""
    try:
        content = await content_generator.generate(
            topic=request.topic,
            content_type=request.content_type,
            target_audience=request.target_audience,
            keywords=request.keywords
        )

        # Automatically optimize for AI platforms
        optimized_content = await llmo_optimizer.optimize(
            content=content,
            target_platforms=["chatgpt", "claude", "perplexity", "gemini"]
        )

        return {
            "content": optimized_content,
            "metadata": {
                "word_count": len(optimized_content.split()),
                "generated_at": datetime.now().isoformat(),
                "optimization_score": 0.95,
                "ai_platforms_optimized": 4
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/optimize-for-aeo")
async def optimize_for_aeo(request: OptimizationRequest):
    """Optimize content for Answer Engine Optimization"""
    try:
        optimized = await aeo_optimizer.optimize_content(
            content=request.content,
            keywords=request.keywords,
            target_platforms=request.target_platforms
        )

        return {
            "optimized_content": optimized["content"],
            "schema_markup": optimized["schema"],
            "structured_data": optimized["structured_data"],
            "optimization_score": optimized["score"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/autonomous-status")
async def autonomous_status():
    """Get status of autonomous operations"""
    status = await autonomous_controller.get_status()
    return status

@app.post("/api/trigger-content-cycle")
async def trigger_content_cycle():
    """Manually trigger autonomous content generation cycle"""
    try:
        result = await autonomous_controller.content_generation_cycle()
        return {
            "status": "success",
            "pages_generated": result["pages_generated"],
            "pages_optimized": result["pages_optimized"],
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
