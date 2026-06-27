# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl needed for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and Prisma schema
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Push database schema and seed data into SQLite dev.db
RUN npx prisma db push --accept-data-loss && node dist/prisma/seed.js

# Production stage
FROM node:20-slim

WORKDIR /app

# Install openssl needed for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled code and Prisma generated client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "dist/server.js"]
