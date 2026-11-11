# syntax=docker/dockerfile:1
# Use Debian-based node:22-slim (glibc) instead of Alpine (musl)
# This completely prevents "Cannot find native binding" / npm bug #4828 issues with Rolldown, Vite and esbuild
FROM node:22-slim AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy all source files and compile Vite SPA
COPY . .
RUN npm run build

# Production runner stage
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./

# Install production dependencies and tsx for TypeScript runtime
RUN npm install --omit=dev && npm install -g tsx

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend TypeScript source and tsconfig
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Persistent volume for SQLite / JSON database storage
VOLUME /app/data

EXPOSE 3000

CMD ["tsx", "server.ts"]
