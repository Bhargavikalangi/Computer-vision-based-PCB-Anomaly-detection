# PCB Anomaly Detection System

A production-ready computer vision system for detecting PCB (Printed Circuit Board) anomalies using deep learning.

## Tech Stack
- **Frontend**: Next.js 14 (App Router, plain JS)
- **Backend**: Python FastAPI
- **Database**: PostgreSQL
- **CV Model**: PyTorch + OpenCV + YOLOv8
- **Deployment**: Docker + Docker Compose

## Features
- Real-time PCB image analysis
- Multi-class anomaly detection (solder defects, missing components, shorts, opens)
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
