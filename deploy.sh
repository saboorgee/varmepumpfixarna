#!/bin/sh
# Server deploy: fetch the latest compose files and images, then restart.
# The backend runs preflight + `medusa db:migrate` on start (MIGRATE_ON_START),
# so database migrations are applied as part of `up`.
set -eu
cd "$(dirname "$0")"

git pull --ff-only
docker compose pull
docker compose up -d --no-build --remove-orphans
docker image prune -f
docker compose ps
