# PCB Anomaly Detection System

A production-ready computer vision system for detecting PCB (Printed Circuit Board) anomalies using **OpenCV rule-based** image analysis (thresholds, morphology, color/texture heuristics). There is **no** trainable deep-learning detector in the analysis pipeline; the API reports the engine as **OpenCV Rule-Based**.

## Tech Stack
- **Frontend**: Next.js 14 (App Router, plain JS)
- **Backend**: Python FastAPI
- **Database**: PostgreSQL
- **Detection**: OpenCV (rule-based pipeline)
- **Deployment**: Docker + Docker Compose

## Features
- Real-time PCB image analysis
- Rule-based anomaly categories (e.g. burn-like regions, corrosion-like color, texture anomalies)
- Interactive results with bounding box overlays
- Historical analysis dashboard
- Report generation (PDF)
- Batch processing support
- WebSocket live progress

## Project Structure
```
pcb-anomaly-detection/
├── frontend/          # Next.js 14 app
├── backend/           # FastAPI Python server
├── docker-compose.yml
└── README.md
```

## Quick Start
```bash
docker-compose up --build
```
Frontend: http://localhost:3000
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs
