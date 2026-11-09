# Production image: the adapter-node server (`node build`), run behind a reverse proxy (Dokploy, Caddy, …).
# Migrations run on start; set DATABASE_URL, ORIGIN and BETTER_AUTH_SECRET at runtime.
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

FROM node:24-alpine AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY drizzle ./drizzle
COPY scripts/migrate.ts ./scripts/migrate.ts
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["sh", "-c", "node scripts/migrate.ts && node build"]
