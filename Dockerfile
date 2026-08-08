# syntax=docker/dockerfile:1

# --------------------------------------------------
# 1. Wspólna baza Node.js
# --------------------------------------------------
FROM node:24-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production

# --------------------------------------------------
# 2. Zależności aplikacji i narzędzia buildowe
# --------------------------------------------------
FROM base AS dependencies

ENV NODE_ENV=development

# pyftsubset pochodzi z pakietu fonttools.
# Instalujemy go tylko w warstwie potrzebnej do buildu.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
  && python3 -m pip install \
    --no-cache-dir \
    --break-system-packages \
    fonttools \
    brotli \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY scripts/check-node-version.js ./scripts/check-node-version.js

RUN npm ci

# --------------------------------------------------
# 3. Build aplikacji Astro
# --------------------------------------------------
FROM dependencies AS build

COPY . .

RUN npm run build

RUN npm prune --omit=dev

# --------------------------------------------------
# 4. Minimalny obraz produkcyjny
# --------------------------------------------------
FROM base AS runtime

ENV HOST=0.0.0.0
ENV PORT=4321

USER node

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]