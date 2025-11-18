#!/bin/bash

# Friendflix CI/CD Deployment Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    log_error "This script is designed for Linux systems only"
    exit 1
fi

# Check for required tools
check_tools() {
    log_info "Checking for required tools..."
    
    tools=("docker" "docker-compose" "git" "npm")
    
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            log_error "$tool is not installed. Please install it first."
            exit 1
        fi
    done
    
    log_info "All required tools are installed"
}

# Setup environment
setup_environment() {
    log_info "Setting up environment..."
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p backups
    
    # Set permissions
    chmod +x ./scripts/*.sh 2>/dev/null || true
    
    log_info "Environment setup complete"
}

# Backup current deployment
backup_deployment() {
    log_info "Creating backup of current deployment..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_DIR="backups/$TIMESTAMP"
    
    mkdir -p $BACKUP_DIR
    
    # Backup docker volumes
    docker run --rm -v friendflix_mongodb_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/mongodb_backup.tar.gz -C /data . 2>/dev/null || true
    docker run --rm -v friendflix_minio_data:/data -v $(pwd)/$BACKUP_DIR:/backup alpine tar czf /backup/minio_backup.tar.gz -C /data . 2>/dev/null || true
    
    log_info "Backup created at $BACKUP_DIR"
}

# Pull latest code
pull_latest_code() {
    log_info "Pulling latest code from repository..."
    
    git pull origin main
    
    if [ $? -ne 0 ]; then
        log_error "Failed to pull latest code"
        exit 1
    fi
    
    log_info "Code updated successfully"
}

# Build and deploy services
deploy_services() {
    log_info "Building and deploying services..."
    
    # Stop existing services
    docker-compose down
    
    # Build and start services
    docker-compose up -d --build
    
    if [ $? -ne 0 ]; then
        log_error "Failed to deploy services"
        exit 1
    fi
    
    log_info "Services deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Check if services are running
    services=("friendflix-mongodb" "friendflix-minio" "friendflix-backend" "friendflix-prometheus" "friendflix-grafana")
    
    for service in "${services[@]}"; do
        if docker ps | grep -q $service; then
            log_info "$service is running"
        else
            log_error "$service is not running"
            exit 1
        fi
    done
    
    # Check backend API
    sleep 10
    if curl -f http://localhost:5000/api/admin/dashboard/stats >/dev/null 2>&1; then
        log_info "Backend API is responding"
    else
        log_warn "Backend API health check failed - this might be expected if no admin user exists yet"
    fi
    
    log_info "Health checks completed"
}

# Cleanup old backups
cleanup_backups() {
    log_info "Cleaning up old backups..."
    
    # Keep only last 7 days of backups
    find backups -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
    
    log_info "Backup cleanup completed"
}

# Main deployment function
main() {
    log_info "Starting Friendflix CI/CD deployment..."
    
    check_tools
    setup_environment
    backup_deployment
    pull_latest_code
    deploy_services
    health_check
    cleanup_backups
    
    log_info "Friendflix deployment completed successfully!"
    log_info "Services are now running:"
    log_info "  - Backend API: http://localhost:5000"
    log_info "  - MongoDB: mongodb://localhost:27017"
    log_info "  - MinIO: http://localhost:9000"
    log_info "  - Prometheus: http://localhost:9090"
    log_info "  - Grafana: http://localhost:3000"
}

# Run main function
main "$@"