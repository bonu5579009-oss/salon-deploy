#!/bin/bash
# Quick Start Guide - Barber Queue System

# Build all images
docker compose build

# Start all services in background
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f backend    # Backend API
docker compose logs -f bot        # Telegram bot
docker compose logs -f frontend   # Web frontend

# Check status
docker compose ps

# Run a single service (useful for debugging)
docker compose up backend

# Remove all containers and volumes (WARNING: deletes database!)
docker compose down -v

# Rebuild without cache (useful if dependencies changed)
docker compose build --no-cache

# Access services
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - API ReDoc: http://localhost:8000/redoc

# Useful commands
docker ps                         # List running containers
docker logs <container_name>      # View container logs
docker exec -it <container_name> /bin/bash  # Shell into container
docker compose config             # Validate compose file
