#!/bin/sh
set -e

# Docker entrypoint script for Tazkartak Backend API
# This script handles database initialization and starts the application

echo "🚀 Starting Tazkartak Backend API..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h ${DATABASE_HOST:-postgres} -p ${DATABASE_PORT:-5432} -U ${DATABASE_USER:-postgres}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until redis-cli -h ${REDIS_HOST:-redis} -p ${REDIS_PORT:-6379} ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Seed database in development
if [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed || echo "⚠️  Database seeding failed or already seeded"
fi

# Start the application
echo "🎉 Starting the application..."
exec node dist/index.js
