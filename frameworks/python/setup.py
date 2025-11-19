"""
Autonomous Robotics Neural Framework - Python SDK
Self-evolving, autonomous system for robotics websites
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="autonomous-robotics-framework",
    version="1.0.0",
    author="Autonomous Robotics Team",
    author_email="team@roboticswebsite.com",
    description="Autonomous Neural Framework for Python - Self-evolving robotics website",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/autonomous-robotics/neural-framework-py",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Application Frameworks",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.10",
    install_requires=[
        "openai>=1.3.0",
        "anthropic>=0.7.0",
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "pydantic>=2.4.0",
        "sqlalchemy>=2.0.0",
        "psycopg2-binary>=2.9.0",
        "redis>=5.0.0",
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "scikit-learn>=1.3.0",
        "transformers>=4.35.0",
        "torch>=2.1.0",
        "aiohttp>=3.9.0",
        "python-dotenv>=1.0.0",
        "pydantic-settings>=2.0.0",
        "asyncio>=3.4.3",
        "tenacity>=8.2.3",
        "prometheus-client>=0.19.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.1.0",
            "black>=23.0.0",
            "flake8>=6.1.0",
            "mypy>=1.6.0",
            "isort>=5.12.0",
        ],
        "docs": [
            "sphinx>=7.2.0",
            "sphinx-rtd-theme>=1.3.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "autonomous-robotics=autonomous_robotics.cli:main",
        ],
    },
)
