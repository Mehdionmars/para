# Multi-stage build for the Payload CMS / Next.js backend.
# Requires `output: 'standalone'` in next.config.ts (already set).

FROM node:22-alpine AS base

# ---- deps -------------------------------------------------------------
FROM base AS deps
# libc6-compat: sharp and other native deps expect glibc-ish shims on musl.
RUN apk add --no-cache libc6-compat
# Match the npm version the lockfile was generated with — an older npm
# bundled with the base image can disagree with a newer npm's lockfile tree
# (especially with legacy-peer-deps=true in .npmrc) and reject `npm ci`.
RUN npm install -g npm@11
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# ---- builder ------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time-only placeholders so payload.config.ts can be evaluated during
# `next build` without a live database — real values are injected at
# container runtime via docker-compose `environment:`.
ARG DATABASE_URI=postgresql://postgres:postgres@localhost:5432/para_dhiver
ARG PAYLOAD_SECRET=build-time-placeholder-secret
ENV DATABASE_URI=$DATABASE_URI
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- runner -------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/media && \
    chown -R nextjs:nodejs /app/media

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001

CMD HOSTNAME="0.0.0.0" node server.js
