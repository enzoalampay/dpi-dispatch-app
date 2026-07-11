#!/usr/bin/env bash
# Netlify cloud build: generate client, apply migrations + seed (idempotent),
# then build Next.js. Uses DATABASE_URL / DIRECT_URL from Netlify env (Neon).
set -e

npx prisma generate
npx prisma migrate deploy
node prisma/seed.js   # idempotent: only seeds an empty database
npx next build
