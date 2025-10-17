@echo off
REM Tazkartak Docker Development Helper Script for Windows
REM This script provides convenient commands for Docker development workflow

setlocal enabledelayedexpansion

REM Colors for output (Windows doesn't support colors in batch files easily)
REM We'll use echo statements with prefixes instead

REM Function to print status messages
:print_status
echo [INFO] %~1
goto :eof

:print_success
echo [SUCCESS] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

REM Function to check if Docker is running
:check_docker
docker info >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Docker is not running. Please start Docker Desktop and try again."
    exit /b 1
)
goto :eof

REM Function to check if docker-compose is available
:check_docker_compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit /b 1
)
goto :eof

REM Function to build and start services
:start_services
call :print_status "Building and starting Tazkartak services..."

call :check_docker
if %errorlevel% neq 0 exit /b %errorlevel%

call :check_docker_compose
if %errorlevel% neq 0 exit /b %errorlevel%

REM Build the backend image
call :print_status "Building backend Docker image..."
docker-compose build backend
if %errorlevel% neq 0 (
    call :print_error "Failed to build backend image"
    exit /b %errorlevel%
)

REM Start all services
call :print_status "Starting all services..."
docker-compose up -d
if %errorlevel% neq 0 (
    call :print_error "Failed to start services"
    exit /b %errorlevel%
)

REM Wait for services to be healthy
call :print_status "Waiting for services to be ready..."
timeout /t 10 /nobreak >nul

REM Check health
call :print_status "Checking service health..."
curl -f http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    call :print_success "Backend API is healthy!"
) else (
    call :print_warning "Backend API health check failed. Check logs with: docker-compose logs backend"
)

call :print_success "All services started successfully!"
call :print_status "Services available at:"
echo   - Backend API: http://localhost:3000
echo   - API Documentation: http://localhost:3000/api-docs
echo   - Health Check: http://localhost:3000/health
echo   - PostgreSQL: localhost:5432
echo   - Redis: localhost:6379
goto :eof

REM Function to show logs
:show_logs
set service=%~1
if "%service%"=="" set service=backend
call :print_status "Showing logs for %service%..."
docker-compose logs -f %service%
goto :eof

REM Function to stop services
:stop_services
call :print_status "Stopping all services..."
docker-compose down
call :print_success "All services stopped."
goto :eof

REM Function to reset everything (stop, remove volumes, start)
:reset_services
call :print_status "Resetting all services (this will remove all data)..."
set /p confirm="Are you sure? This will delete all database data. (y/N): "
if /i "%confirm%"=="y" (
    docker-compose down -v
    docker-compose up -d
    call :print_success "Services reset successfully!"
) else (
    call :print_status "Reset cancelled."
)
goto :eof

REM Function to access backend shell
:backend_shell
call :print_status "Accessing backend container shell..."
docker-compose exec backend sh
goto :eof

REM Function to access database shell
:db_shell
call :print_status "Accessing PostgreSQL shell..."
docker-compose exec postgres psql -U postgres -d tazkartak
goto :eof

REM Function to run database migrations
:run_migrations
call :print_status "Running database migrations..."
docker-compose exec backend npx prisma migrate deploy
call :print_success "Database migrations completed."
goto :eof

REM Function to seed database
:seed_database
call :print_status "Seeding database..."
docker-compose exec backend npx prisma db seed
call :print_success "Database seeded successfully."
goto :eof

REM Function to show service status
:show_status
call :print_status "Service status:"
docker-compose ps
echo.
call :print_status "Health check:"
curl -f http://localhost:3000/health >nul 2>&1
if %errorlevel% equ 0 (
    call :print_success "Backend API is healthy"
) else (
    call :print_error "Backend API is not responding"
)
goto :eof

REM Function to show help
:show_help
echo Tazkartak Docker Development Helper
echo.
echo Usage: %~nx0 [command]
echo.
echo Commands:
echo   start       Build and start all services
echo   stop        Stop all services
echo   restart     Restart all services
echo   reset       Stop, remove volumes, and start services (WARNING: deletes data)
echo   logs [service]  Show logs (default: backend)
echo   shell       Access backend container shell
echo   db          Access PostgreSQL database shell
echo   migrate     Run database migrations
echo   seed        Seed the database
echo   status      Show service status and health
echo   health      Check API health
echo   help        Show this help message
echo.
echo Examples:
echo   %~nx0 start              # Start all services
echo   %~nx0 logs backend       # Show backend logs
echo   %~nx0 logs postgres      # Show PostgreSQL logs
echo   %~nx0 shell              # Access backend shell
echo   %~nx0 db                 # Access database
goto :eof

REM Main script logic
set command=%~1
if "%command%"=="" set command=help

if "%command%"=="start" goto start_services
if "%command%"=="stop" goto stop_services
if "%command%"=="restart" goto restart_services
if "%command%"=="reset" goto reset_services
if "%command%"=="logs" goto show_logs
if "%command%"=="shell" goto backend_shell
if "%command%"=="db" goto db_shell
if "%command%"=="migrate" goto run_migrations
if "%command%"=="seed" goto seed_database
if "%command%"=="status" goto show_status
if "%command%"=="health" goto health_check
if "%command%"=="help" goto show_help
if "%command%"=="--help" goto show_help
if "%command%"=="-h" goto show_help

call :print_error "Unknown command: %command%"
echo.
goto show_help

:restart_services
call :print_status "Restarting services..."
docker-compose restart
call :print_success "Services restarted."
goto :eof

:health_check
call :print_status "Checking API health..."
curl -f http://localhost:3000/health
if %errorlevel% neq 0 call :print_error "Health check failed"
goto :eof
