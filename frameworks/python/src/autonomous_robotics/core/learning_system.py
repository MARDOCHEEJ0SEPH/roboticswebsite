"""Learning System - Continuous learning"""
import asyncio

class LearningSystem:
    def __init__(self, neural_core):
        self.core = neural_core
        self.knowledge_base = {}
        self.is_running = False

    async def initialize(self):
        print("📚 Learning System initialized")

    async def learn(self, data):
        """Process learning data"""
        key = f"{data['type']}_{len(self.knowledge_base)}"
        self.knowledge_base[key] = data
        return data

    async def start_learning_loop(self):
        """Start autonomous learning"""
        self.is_running = True
        while self.is_running:
            await asyncio.sleep(300)

    async def stop(self):
        self.is_running = False

    def get_status(self):
        return {'knowledge_base_size': len(self.knowledge_base)}
