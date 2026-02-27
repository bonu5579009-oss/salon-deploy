# Docker Setup for Barber Queue System

## Overview
This project uses Docker Compose to orchestrate three services:
- **Backend**: FastAPI application (Python) on port 8000
- **Bot**: Telegram bot (Python aiogram)
- **Frontend**: Next.js application on port 3000

## Quick Start

### Build Images
```bash
docker compose build
```

### Start All Services
```bash
docker compose up -d
```

### Access Services
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Backend Docs: http://localhost:8000/docs

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
docker compose logs -f backend  # Backend logs
docker compose logs -f bot      # Bot logs
docker compose logs -f frontend # Frontend logs
```

## Environment Configuration

### Bot Configuration
The bot reads from `./bot/.env`:
- `BOT_TOKEN`: Your Telegram bot token
- `ADMIN_IDS`: Admin user IDs (JSON array)
- `API_URL`: Backend API URL (default: http://backend:8000)

### Backend Configuration
Update in `docker-compose.yml` environment section:
- `DATABASE_URL`: SQLite database path (persisted in volume)
- `SECRET_KEY`: Change this in production!
- `ALGORITHM`: JWT algorithm (default: HS256)

### Frontend Configuration
Update in `docker-compose.yml` environment section:
- `NEXT_PUBLIC_API_URL`: Backend API URL for frontend client (default: http://localhost:8000)
- `NODE_ENV`: Set to production

## Database Persistence
- SQLite database is stored at `./backend/barber_queue.db`
- Persists between container restarts via Docker volume mount

## Development Mode with Hot Reload

### Backend (with code watch)
```bash
docker compose up -d
# Edit Python files - uvicorn will auto-reload
```

### Frontend (with hot reload)
Edit `docker-compose.yml` frontend service:
```yaml
frontend:
  volumes:
    - ./frontend/src:/app/src
    - ./frontend/public:/app/public
```

Then restart:
```bash
docker compose up -d frontend
```

## Production Considerations

1. **Change SECRET_KEY**: Update the FastAPI SECRET_KEY in docker-compose.yml
2. **SSL/TLS**: Add nginx reverse proxy with SSL certificates
3. **Environment Variables**: Use a secure .env file (add to .gitignore)
4. **Database**: Consider migrating to PostgreSQL for production
5. **Resource Limits**: Add `resources` section to services in docker-compose.yml

## Troubleshooting

### Backend won't start
```bash
docker compose logs backend
```

### Frontend build fails
Ensure Node.js LTS compatible version in base image (node:20-alpine)

### Database issues
Remove the volume and rebuild:
```bash
docker compose down -v
docker compose up -d
```

### Bot not connecting
- Verify BOT_TOKEN in `./bot/.env`
- Check API_URL is accessible from bot container
- View logs: `docker compose logs bot`

## Architecture

```
┌─────────────────────────────────────┐
│      Frontend (Next.js)             │
│      Port: 3000                     │
└────────────┬────────────────────────┘
             │ HTTP (NEXT_PUBLIC_API_URL)
             ▼
┌─────────────────────────────────────┐
│  Backend (FastAPI + SQLite)         │
│  Port: 8000                         │
│  WebSocket: /ws/queue               │
└────────────┬────────────────────────┘
             ▲
             │ HTTP
             │
        ┌────┴─────────┐
        │              │
   ┌────▼────┐  ┌─────▼──────┐
   │   Bot   │  │  Other     │
   │(Telegram)  │Clients     │
   └─────────┘  └────────────┘
```

## Multi-Stage Docker Builds

All Dockerfiles use multi-stage builds for optimal image size:
1. **Builder stage**: Compiles/prepares dependencies
2. **Runtime stage**: Only includes runtime files

This reduces image sizes significantly:
- Backend: ~70MB (vs ~400MB single-stage)
- Bot: ~54MB (vs ~300MB single-stage)
- Frontend: ~80MB (vs ~500MB single-stage)
