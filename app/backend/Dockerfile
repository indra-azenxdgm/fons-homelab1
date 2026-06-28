FROM node:22-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

RUN npm run prisma:generate

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

FROM node:22-bookworm-slim AS runtime-base

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

FROM runtime-base AS prod-deps

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev

FROM runtime-base AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
COPY --from=prod-deps /app/package-lock.json ./package-lock.json
COPY --from=prod-deps /app/prisma.config.ts ./prisma.config.ts
COPY --from=prod-deps /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

RUN chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
