# Multi-stage Docker build for Tazkartak Backend API
# Stage 1: Base image with Node.js and common dependencies
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory and user
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Stage 2: Dependencies
FROM base AS deps

# Copy package files
COPY apps/backend/package*.json ./
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Development dependencies for build
FROM base AS build-deps

# Copy package files
COPY apps/backend/package*.json ./
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci && npm cache clean --force

# Stage 4: Build the application
FROM build-deps AS builder

# Copy source code and configuration
COPY apps/backend/ ./
COPY packages/ ../packages/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 5: Production runtime
FROM base AS runner

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application and production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create entrypoint script
COPY --chown=nodejs:nodejs apps/backend/scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["/usr/local/bin/docker-entrypoint.sh"]
