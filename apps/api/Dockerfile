# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder

RUN npm install -g pnpm@9.15.0
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN pnpm --filter @hots-monitor/api prisma:generate
RUN pnpm --filter @hots-monitor/shared build
RUN pnpm --filter @hots-monitor/api build

FROM node:22-alpine AS production

RUN apk add --no-cache libstdc++ wget

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

RUN chmod +x ./apps/api/docker-entrypoint.sh && mkdir -p /app/data

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/prod.db
ENV API_PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

ENTRYPOINT ["./apps/api/docker-entrypoint.sh"]
