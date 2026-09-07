# Dockerfile for IVAgent on Google Cloud Run
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Vite client and bundle server into dist/server.cjs
RUN npm run build

# Production runtime stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Start compiled CommonJS server on Cloud Run
CMD ["node", "dist/server.cjs"]
