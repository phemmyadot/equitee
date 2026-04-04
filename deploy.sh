#!/bin/bash
echo "Pulling latest changes..."
git pull

echo "Rebuilding images..."
docker compose build

echo "Running migrations..."
docker compose run --rm backend alembic upgrade head

echo "Restarting backend..."
docker compose up -d --no-deps backend
docker compose up -d --no-deps frontend

echo "Done! Checking status..."
docker compose ps
