"""
CoachHub Pro - AI Matching Engine
Powered by Autonomous Robotics Python Framework
AI-powered coach matching and recommendations
"""

import asyncio
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from frameworks.python.src.autonomous_robotics import AutonomousFramework

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CoachHub Pro AI Engine",
    description="AI-powered coach matching and recommendations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

autonomous_framework: Optional[AutonomousFramework] = None
matcher: Optional['CoachMatcher'] = None


class MatchRequest(BaseModel):
    studentId: str
    preferences: Optional[Dict[str, Any]] = {}


class RecommendRequest(BaseModel):
    studentId: str


class CoachMatcher:
    """AI-powered coach matching system"""

    def __init__(self, framework: AutonomousFramework):
        self.framework = framework

    async def find_matches(self, student_id: str, preferences: Dict) -> List[Dict]:
        """Find best matching coaches using AI"""
        logger.info(f"🔍 Finding matches for student {student_id}")

        # Simulated matching algorithm
        # In production, use collaborative filtering, NLP, etc.
        matches = []

        expertise = preferences.get('expertise', [])
        budget_max = preferences.get('budget_max', 200)
        experience_years = preferences.get('experience_years', 0)

        # Score coaches based on preferences
        # This would query MongoDB and use ML models in production
        sample_coaches = [
            {
                'coachId': '507f1f77bcf86cd799439011',
                'name': 'Sarah Johnson',
                'expertise': ['Career', 'Leadership'],
                'rating': 4.9,
                'price': 99,
                'experience': 10,
                'matchScore': 0.95
            },
            {
                'coachId': '507f1f77bcf86cd799439012',
                'name': 'Mike Chen',
                'expertise': ['Business', 'Startup'],
                'rating': 4.8,
                'price': 149,
                'experience': 8,
                'matchScore': 0.88
            },
            {
                'coachId': '507f1f77bcf86cd799439013',
                'name': 'Emma Davis',
                'expertise': ['Life', 'Wellness'],
                'rating': 4.7,
                'price': 79,
                'experience': 5,
                'matchScore': 0.82
            }
        ]

        # Filter and score
        for coach in sample_coaches:
            score = coach['matchScore']

            # Adjust score based on preferences
            if expertise:
                if any(e in coach['expertise'] for e in expertise):
                    score += 0.1

            if coach['price'] <= budget_max:
                score += 0.05

            if coach['experience'] >= experience_years:
                score += 0.05

            coach['finalScore'] = min(score, 1.0)
            matches.append(coach)

        # Sort by score
        matches.sort(key=lambda x: x['finalScore'], reverse=True)

        return matches[:10]

    async def get_recommendations(self, student_id: str) -> List[Dict]:
        """Get personalized coach recommendations"""
        logger.info(f"📊 Getting recommendations for student {student_id}")

        # Use autonomous framework for intelligent recommendations
        decision_context = {
            'type': 'coach_recommendation',
            'student_id': student_id
        }

        # In production, analyze student's:
        # - Past subscriptions
        # - Session history
        # - Interests and goals
        # - Similar users' preferences

        recommendations = [
            {
                'coachId': '507f1f77bcf86cd799439014',
                'name': 'Alex Rodriguez',
                'reason': 'Top rated in your area of interest',
                'confidence': 0.92
            },
            {
                'coachId': '507f1f77bcf86cd799439015',
                'name': 'Lisa Wang',
                'reason': 'Similar students found success',
                'confidence': 0.87
            }
        ]

        return recommendations


@app.on_event("startup")
async def startup_event():
    """Initialize autonomous framework on startup"""
    global autonomous_framework, matcher

    logger.info("🤖 Starting CoachHub Pro AI Engine...")
    logger.info("🧠 Initializing Autonomous Framework...")

    autonomous_framework = AutonomousFramework(
        mode='autonomous',
        evolution_rate='balanced',
        learning_enabled=True
    )

    await autonomous_framework.initialize()
    await autonomous_framework.start()

    matcher = CoachMatcher(autonomous_framework)

    logger.info("✅ AI Engine initialized and ready")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    global autonomous_framework

    logger.info("🛑 Shutting down AI Engine...")

    if autonomous_framework:
        await autonomous_framework.stop()

    logger.info("✅ AI Engine shut down gracefully")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    status = autonomous_framework.get_status() if autonomous_framework else None

    return {
        "status": "healthy",
        "service": "ai-engine",
        "autonomous_framework": {
            "initialized": autonomous_framework is not None,
            "running": status.running if status else False,
            "mode": status.mode if status else None
        }
    }


@app.post("/api/ai/match-coaches")
async def match_coaches(request: MatchRequest):
    """Find matching coaches for a student"""

    if not matcher:
        raise HTTPException(status_code=503, detail="AI Engine not initialized")

    try:
        matches = await matcher.find_matches(request.studentId, request.preferences)

        return {
            "success": True,
            "matches": matches,
            "count": len(matches)
        }

    except Exception as e:
        logger.error(f"Error matching coaches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/recommend")
async def get_recommendations(request: RecommendRequest):
    """Get personalized coach recommendations"""

    if not matcher:
        raise HTTPException(status_code=503, detail="AI Engine not initialized")

    try:
        recommendations = await matcher.get_recommendations(request.studentId)

        return {
            "success": True,
            "recommendations": recommendations,
            "count": len(recommendations)
        }

    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/status")
async def get_status():
    """Get AI engine status"""

    if not autonomous_framework:
        raise HTTPException(status_code=503, detail="Framework not initialized")

    status = autonomous_framework.get_status()

    return {
        "success": True,
        "status": status
    }


if __name__ == "__main__":
    import uvicorn

    print("""
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║         🤖 CoachHub Pro AI Engine 🤖                ║
║                                                       ║
║  Port:       8001                                    ║
║  Framework:  Python SDK                              ║
║  Features:   AI Matching, Recommendations, ML        ║
║                                                       ║
║  Status:     🟢 STARTING...                          ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    """)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
