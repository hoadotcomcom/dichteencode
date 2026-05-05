#!/bin/bash

# TeenCode - Quick Start Script

echo "🚀 Starting TeenCode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Please edit .env with your LLM proxy credentials"
fi

# Start Docker Compose
echo "📦 Starting PostgreSQL..."
docker compose up -d

# Wait for postgres to be ready
echo "⏳ Waiting for database..."
sleep 5

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the services:"
echo "  1. Backend:  cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo "  2. Frontend: cd frontend && npm run dev"
echo ""
echo "Access:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:8000"
echo "  - API Docs: http://localhost:8000/docs"
echo ""
