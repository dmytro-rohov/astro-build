# syntax=docker/dockerfile:1

# --------------------------------------------------
# 1. Shared Node.js base
# --------------------------------------------------
FROM node:24-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production

# --------------------------------------------------
# 2. Dependencies (including dev tools needed for the build)
# --------------------------------------------------
FROM base AS dependencies

COPY package.json package-lock.json ./
COPY scripts/check-node-version.js ./scripts/check-node-version.js

# NODE_ENV stays "production"; --include=dev installs the build tools anyway.
RUN npm ci --include=dev

# --------------------------------------------------
# 3. Astro build (production mode)
# --------------------------------------------------
FROM dependencies AS build

# Site to build: a directory with site.json (inside the build context).
ARG SITE_DIR=sites/_demo
ENV SITE_DIR=$SITE_DIR
# Public site URL is baked into the build (canonical, sitemap, Open Graph).
# When empty, meta.url from site.json is used.
ARG SITE_URL=
ENV SITE_URL=$SITE_URL
# PUBLIC_* variables are inlined into client code at build time.
ARG PUBLIC_GA_MEASUREMENT_ID=
ENV PUBLIC_GA_MEASUREMENT_ID=$PUBLIC_GA_MEASUREMENT_ID

COPY . .

RUN npm run build

RUN npm prune --omit=dev

# --------------------------------------------------
# 4. Minimal runtime image
# --------------------------------------------------
FROM base AS runtime

ENV HOST=0.0.0.0
ENV PORT=4321
# server.mjs sends HSTS when the site is served over https.
ARG SITE_URL=http://localhost:4321
ENV SITE_URL=$SITE_URL

USER node

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server.mjs ./server.mjs

EXPOSE 4321

CMD ["node", "./server.mjs"]
