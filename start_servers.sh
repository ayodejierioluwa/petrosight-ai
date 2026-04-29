#!/bin/bash

# Start FastAPI backend on port 8005
echo "Starting PetroSight AI Backend (Port 8005)..."
cd /Users/macbook/.gemini/antigravity/scratch/petrosight_ai/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8005 --reload &
BACKEND_PID=$!

# Start Next.js frontend on port 3005
echo "Starting PetroSight AI Frontend (Port 3005)..."
cd /Users/macbook/.gemini/antigravity/scratch/petrosight_ai/frontend
npm run dev &
FRONTEND_PID=$!

echo "Servers are running."
echo "Frontend: http://localhost:3005"
echo "Backend API: http://localhost:8005"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
