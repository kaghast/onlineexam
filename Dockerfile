# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies reliably (works whether package-lock.json exists in git or not)
RUN if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi

# Copy all source files and compile Vite SPA
COPY . .
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./

# Install production dependencies and ensure tsx is globally installed for server runtime
RUN if [ -f package-lock.json ]; then npm ci --omit=dev || npm install --omit=dev; else npm install --omit=dev; fi \
    && npm install -g tsx

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
