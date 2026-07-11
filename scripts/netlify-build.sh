#!/usr/bin/env bash
# Netlify cloud build: generate client, apply migrations + seed against the
# auto-provisioned Netlify DB (Neon), then build Next.js.
set -e

npx prisma generate

if [ -n "$NETLIFY_DATABASE_URL" ]; then
  echo "Netlify DB detected — applying migrations…"
  export DATABASE_URL="$NETLIFY_DATABASE_URL"
  export DIRECT_URL="${NETLIFY_DATABASE_URL_UNPOOLED:-$NETLIFY_DATABASE_URL}"
  npx prisma migrate deploy
  node prisma/seed.js   # idempotent: only seeds an empty database
else
  echo "NETLIFY_DATABASE_URL not set — skipping migrate/seed."
fi

npx next build
