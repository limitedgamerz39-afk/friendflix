@echo off
echo Friendflix CI/CD Deployment Script
echo ===================================

echo Checking for required tools...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker Compose is not installed
    exit /b 1
)

echo All required tools are installed

echo Setting up environment...
mkdir logs 2>nul
mkdir backups 2>nul

echo Creating backup of current deployment...
set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
mkdir backups\%TIMESTAMP% 2>nul

echo Pulling latest code from repository...
git pull origin main
if %errorlevel% neq 0 (
    echo Error: Failed to pull latest code
    exit /b 1
)

echo Building and deploying services...
docker-compose down
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo Error: Failed to deploy services
    exit /b 1
)

echo Deployment completed successfully!
echo Services are now running:
echo   - Backend API: http://localhost:5000
echo   - MongoDB: mongodb://localhost:27017
echo   - MinIO: http://localhost:9000
echo   - Prometheus: http://localhost:9090
echo   - Grafana: http://localhost:3000