# syntax=docker/dockerfile:1
# Medusa v2 backend + Admin dashboard. No credentials are baked into the image;
# DATABASE_URL and secrets are injected at runtime (docker compose env_file).
ARG NODE_IMAGE=node:22.23.4-bookworm-slim

# ---- build: compile server + bundle Admin into .medusa/server ----------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV MEDUSA_DISABLE_TELEMETRY=true
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx medusa build

# ---- runtime: production dependencies only ----------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    MEDUSA_DISABLE_TELEMETRY=true \
    PORT=9000
WORKDIR /app
COPY --from=build --chown=node:node /app/.medusa/server ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --chown=node:node docker-entrypoint.sh /app/docker-entrypoint.sh
# Strip CRLF in case the file was checked out on Windows; prepare the upload
# directory so the named volume inherits node ownership.
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh \
 && mkdir -p /app/static /app/certs \
 && chown node:node /app/static /app/certs
USER node
EXPOSE 9000
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
CMD ["start"]
