# ─── Stage 1: Install dependencies ─────────────────────────────────────────
FROM node:24-slim AS deps

RUN npm install -g pnpm@11.24.0

WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Copy all package manifests so pnpm can resolve the workspace graph
COPY lib/db/package.json                  lib/db/package.json
COPY lib/api-spec/package.json            lib/api-spec/package.json
COPY lib/api-zod/package.json             lib/api-zod/package.json
COPY lib/api-client-react/package.json    lib/api-client-react/package.json
COPY lib/replit-auth-web/package.json     lib/replit-auth-web/package.json
COPY artifacts/api-server/package.json    artifacts/api-server/package.json
COPY artifacts/gestao-servicos/package.json artifacts/gestao-servicos/package.json

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build frontend ────────────────────────────────────────────────
FROM deps AS frontend-builder

COPY . .

# PORT is required by vite.config.ts even during build
ENV PORT=3000
ENV NODE_ENV=production
ENV BASE_PATH=/

RUN pnpm --filter @workspace/gestao-servicos run build

# ─── Stage 3: Build API ──────────────────────────────────────────────────────
FROM deps AS api-builder

COPY . .
ENV NODE_ENV=production

RUN pnpm --filter @workspace/api-server run build

# ─── Stage 4: Production image ──────────────────────────────────────────────
FROM node:24-slim AS runner

RUN npm install -g pnpm@11.24.0

WORKDIR /app

# Copy pnpm workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/db/package.json                  lib/db/package.json
COPY lib/api-spec/package.json            lib/api-spec/package.json
COPY lib/api-zod/package.json             lib/api-zod/package.json
COPY lib/api-client-react/package.json    lib/api-client-react/package.json
COPY lib/replit-auth-web/package.json     lib/replit-auth-web/package.json
COPY artifacts/api-server/package.json    artifacts/api-server/package.json
COPY artifacts/gestao-servicos/package.json artifacts/gestao-servicos/package.json

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled API
COPY --from=api-builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Copy compiled frontend into public/ (API will serve it as static files)
COPY --from=frontend-builder /app/artifacts/gestao-servicos/dist/public ./public

# Copy DB sources for drizzle-kit migrations
COPY lib/db ./lib/db
COPY lib/api-zod ./lib/api-zod
COPY lib/api-spec ./lib/api-spec
COPY lib/api-client-react ./lib/api-client-react

# Copy start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

ENV NODE_ENV=production

EXPOSE 8080

CMD ["./start.sh"]
