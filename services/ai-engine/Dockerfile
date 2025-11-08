# Dockerfile for Python AI Engine
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY *.py ./

# Create data directories
RUN mkdir -p /app/data/generated-content \
    && mkdir -p /app/data/schemas \
    && mkdir -p /app/data/knowledge-graph

# Set environment
ENV PYTHONUNBUFFERED=1

EXPOSE 8001

# Run the AI engine
CMD ["python", "main.py"]
