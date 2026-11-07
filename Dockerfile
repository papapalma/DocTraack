# Multi-stage Dockerfile for MinSU DocTrack

# Stage 1: Base Alpine image with native runtime libraries
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Stage 3: Build application & generate Prisma client
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/db_TDP?schema=public"
RUN npx prisma generate
RUN npm run build

# Stage 4: Database Migrator & Seeder (ephemeral init service)
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN sed -i 's/\r$//' prisma/docker-init.sh && chmod +x prisma/docker-init.sh
CMD ["sh", "prisma/docker-init.sh"]

# Stage 5: Production Runner (minimal standalone server)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create storage and public directories with correct permissions
RUN mkdir -p /app/storage/uploads/logos /app/public && \
    chown -R nextjs:nodejs /app/storage /app/public

# Copy pre-configured storage assets and templates
COPY --from=builder --chown=nextjs:nodejs /app/storage ./storage

# Copy public assets and Next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure prisma schema & engines are available if needed at runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
