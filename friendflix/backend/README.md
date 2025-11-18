# Friendflix Admin Dashboard and Monitoring System

## Overview
This repository contains the complete implementation of the Friendflix admin dashboard, monitoring system, and advertisement integration.

## Features Implemented

### 1. Admin Dashboard
- Secure login system for administrators
- User management (view, block, unblock)
- Content management (view, delete posts)
- Advertisement management
- User reports handling
- Dashboard statistics

### 2. Advertisement System
- Banner, interstitial, and rewarded video ads
- AdMob integration
- Ad scheduling and configuration
- Ad metrics tracking (impressions, clicks, completions)

### 3. Docker Deployment
- Dockerfile for backend service
- Docker Compose configuration for:
  - MongoDB database
  - MinIO object storage
  - Backend API
  - Prometheus monitoring
  - Grafana dashboard
  - Node Exporter for system metrics

### 4. CI/CD Pipeline
- Automated deployment script for Linux servers
- Backup and rollback capabilities
- Health checks

### 5. Monitoring
- Prometheus metrics collection
- Grafana dashboard for visualization
- System resource monitoring
- API latency tracking
- Uptime monitoring

## Setup Instructions

### Prerequisites
- Docker and Docker Compose
- Git
- Node.js (for development)

### Quick Start
1. Clone the repository
2. Navigate to the backend directory
3. Run `docker-compose up -d`
4. Access services:
   - Admin Dashboard: http://localhost:5000
   - MongoDB: mongodb://localhost:27017
   - MinIO: http://localhost:9000
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000

### Admin Login
- Email: admin@friendflix.com
- Password: admin123

## API Endpoints

### Admin API
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/posts` - Get all posts
- `DELETE /api/admin/posts/:postId` - Delete post
- `POST /api/admin/users/:userId/block` - Block user
- `POST /api/admin/users/:userId/unblock` - Unblock user

### Ads API
- `GET /api/ads/type/:type` - Get active ads by type
- `POST /api/ads/:adId/impression` - Record ad impression
- `POST /api/ads/:adId/click` - Record ad click
- `POST /api/ads/:adId/completion` - Record ad completion

## Monitoring Endpoints
- `/metrics` - Prometheus metrics
- `/health` - Health check

## Directory Structure
```
backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── public/           # Admin frontend
├── grafana/          # Grafana configuration
├── prometheus/       # Prometheus configuration
├── scripts/          # CI/CD scripts
├── helpers/          # Utility functions
├── Dockerfile
├── docker-compose.yml
└── server.js
```

## Technologies Used
- Node.js with Express
- MongoDB with Mongoose
- MinIO for object storage
- Socket.IO for real-time communication
- Docker & Docker Compose
- Prometheus for monitoring
- Grafana for visualization
- Bootstrap 5 for frontend
- Chart.js for data visualization
- FFmpeg for video processing