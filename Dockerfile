# --- STAGE 1: Build Next.js Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Set API URL to relative so it works on any domain
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# --- STAGE 2: Python Backend + Bot ---
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for qrcode and pillow
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all files from root
COPY . .

# Copy the built frontend from Stage 1 into 'out' folder
COPY --from=frontend-builder /app/out ./out

# Expose the port (Render uses $PORT)
ENV PORT=10000
EXPOSE 10000

# Start everything
CMD ["python", "run_all.py"]
