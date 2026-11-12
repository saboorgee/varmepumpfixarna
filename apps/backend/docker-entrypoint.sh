#!/bin/sh
# Entrypoint for the Medusa backend container (runs from the built .medusa/server).
#
#   start         (default) preflight → migrate → medusa start (shared worker mode)
#   migrate       preflight → medusa db:migrate
#   seed          preflight → idempotent seed (SEK, region Sverige, 3 products, …)
#   create-admin  <email> <password>  – create a Medusa Admin user
#   preflight     database checks only
#   <anything>    exec'd as-is (e.g. `sh`)
set -eu

MEDUSA="./node_modules/.bin/medusa"

preflight() {
  node src/lib/db-preflight.js
}

migrate() {
  # Never prompts; never drops link tables or search indexes ("safe" actions only).
  "$MEDUSA" db:migrate --execute-safe-links --execute-safe-search
}

cmd="${1:-start}"
[ "$#" -gt 0 ] && shift

case "$cmd" in
  start)
    preflight
    if [ "${MIGRATE_ON_START:-true}" = "true" ]; then
      migrate
    fi
    exec "$MEDUSA" start
    ;;
  migrate)
    preflight
    migrate
    ;;
  seed)
    preflight
    exec "$MEDUSA" exec ./src/scripts/seed.js
    ;;
  create-admin)
    if [ "$#" -ne 2 ]; then
      echo "Usage: create-admin <email> <password>" >&2
      exit 64
    fi
    preflight
    exec "$MEDUSA" user -e "$1" -p "$2"
    ;;
  preflight)
    preflight
    ;;
  *)
    exec "$cmd" "$@"
    ;;
esac
