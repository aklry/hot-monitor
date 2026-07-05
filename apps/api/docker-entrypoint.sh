#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
cd /app/apps/api
npx prisma migrate deploy --schema=./prisma/schema.prisma

echo "==> Starting API server..."
cd /app
exec node apps/api/dist/main.js
