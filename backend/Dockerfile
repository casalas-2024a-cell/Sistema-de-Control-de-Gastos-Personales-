# ─────────────────────────────────────────────
# Dockerfile — NestJS Backend
# HU-11: Multi-stage build para reducir tamaño de imagen
# ─────────────────────────────────────────────

# Stage 1: Build (includes devDependencies for compilation)
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client for Alpine linux target
RUN npx prisma generate

# Compile TypeScript → JavaScript
RUN npm run build

# Also compile seed for production use (ts-node is a devDep)
RUN npx tsc prisma/seed.ts --outDir dist/prisma --esModuleInterop --skipLibCheck --module commonjs --target ES2021 2>/dev/null || true

# ─────────────────────────────────────────────
# Stage 2: Production image (lean)
# ─────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# curl = healthcheck, openssl = Prisma engine
RUN apk add --no-cache curl openssl

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled app + Prisma artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Copy compiled seed script
COPY --from=builder /app/dist/prisma ./dist/prisma

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 1) Apply DB migrations  2) Seed reference data  3) Start NestJS
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js; node dist/main"]
