#!/bin/bash
echo "Pulling latest changes..."
git pull

echo "Rebuilding backend image..."
docker compose build backend

echo "Running migrations..."
docker compose run --rm backend alembic upgrade head

echo "Restarting backend..."
docker compose up -d --no-deps backend

echo "Done! Checking status..."
docker compose ps
