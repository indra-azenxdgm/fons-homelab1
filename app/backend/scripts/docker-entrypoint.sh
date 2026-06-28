#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATIONS:-false}" = "true" ]; then
  echo "[backend] applying prisma migrations"
  max_attempts="${DB_MIGRATION_MAX_ATTEMPTS:-20}"
  retry_delay="${DB_MIGRATION_RETRY_DELAY_SECONDS:-3}"
  attempt=1

  while true; do
    if ./node_modules/.bin/prisma migrate deploy; then
      break
    fi

    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "[backend] prisma migrate deploy failed after ${attempt} attempts"
      exit 1
    fi

    echo "[backend] prisma migrate deploy failed on attempt ${attempt}/${max_attempts}; retrying in ${retry_delay}s"
    attempt=$((attempt + 1))
    sleep "$retry_delay"
  done
fi

exec "$@"
