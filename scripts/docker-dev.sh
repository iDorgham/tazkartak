#!/bin/bash

# Tazkartak Docker Development Helper Script
# This script provides convenient commands for Docker development workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed. Please install docker-compose and try again."
        exit 1
    fi
}

# Function to build and start services
start_services() {
    print_status "Building and starting Tazkartak services..."
    
    check_docker
    check_docker_compose
    
    # Build the backend image
    print_status "Building backend Docker image..."
    docker-compose build backend
    
    # Start all services
    print_status "Starting all services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check health
    print_status "Checking service health..."
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Backend API is healthy!"
    else
        print_warning "Backend API health check failed. Check logs with: docker-compose logs backend"
    fi
    
    print_success "All services started successfully!"
    print_status "Services available at:"
    echo "  - Backend API: http://localhost:3000"
    echo "  - API Documentation: http://localhost:3000/api-docs"
    echo "  - Health Check: http://localhost:3000/health"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
}

# Function to show logs
show_logs() {
    local service=${1:-backend}
    print_status "Showing logs for $service..."
    docker-compose logs -f $service
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker-compose down
    print_success "All services stopped."
}

# Function to reset everything (stop, remove volumes, start)
reset_services() {
    print_status "Resetting all services (this will remove all data)..."
    read -p "Are you sure? This will delete all database data. (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose down -v
        docker-compose up -d
        print_success "Services reset successfully!"
    else
        print_status "Reset cancelled."
    fi
}

# Function to access backend shell
backend_shell() {
    print_status "Accessing backend container shell..."
    docker-compose exec backend sh
}

# Function to access database shell
db_shell() {
    print_status "Accessing PostgreSQL shell..."
    docker-compose exec postgres psql -U postgres -d tazkartak
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose exec backend npx prisma migrate deploy
    print_success "Database migrations completed."
}

# Function to seed database
seed_database() {
    print_status "Seeding database..."
    docker-compose exec backend npx prisma db seed
    print_success "Database seeded successfully."
}

# Function to show service status
show_status() {
    print_status "Service status:"
    docker-compose ps
    echo
    print_status "Health check:"
    if curl -f http://localhost:3000/health 2>/dev/null; then
        print_success "Backend API is healthy"
    else
        print_error "Backend API is not responding"
    fi
}

# Function to show help
show_help() {
    echo "Tazkartak Docker Development Helper"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  start       Build and start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  reset       Stop, remove volumes, and start services (WARNING: deletes data)"
    echo "  logs [service]  Show logs (default: backend)"
    echo "  shell       Access backend container shell"
    echo "  db          Access PostgreSQL database shell"
    echo "  migrate     Run database migrations"
    echo "  seed        Seed the database"
    echo "  status      Show service status and health"
    echo "  health      Check API health"
    echo "  help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start              # Start all services"
    echo "  $0 logs backend       # Show backend logs"
    echo "  $0 logs postgres      # Show PostgreSQL logs"
    echo "  $0 shell              # Access backend shell"
    echo "  $0 db                 # Access database"
}

# Main script logic
case "${1:-help}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        print_status "Restarting services..."
        docker-compose restart
        print_success "Services restarted."
        ;;
    reset)
        reset_services
        ;;
    logs)
        show_logs $2
        ;;
    shell)
        backend_shell
        ;;
    db)
        db_shell
        ;;
    migrate)
        run_migrations
        ;;
    seed)
        seed_database
        ;;
    status)
        show_status
        ;;
    health)
        print_status "Checking API health..."
        curl -f http://localhost:3000/health || print_error "Health check failed"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac
