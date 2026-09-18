#!/bin/sh
set -e

# DATABASE_URL yoksa Railway volume path'ini kullan
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/data/prod.db"
fi

# /data dizini varsa (Railway volume mount), DB orada olsun
if [ -d "/data" ]; then
  export DATABASE_URL="file:/data/prod.db"
  DB_PATH="/data/prod.db"
else
  # Volume yoksa uygulama dizininde oluştur
  DB_PATH="./prisma/prod.db"
  export DATABASE_URL="file:./prisma/prod.db"
fi

echo "DATABASE_URL: $DATABASE_URL"
echo "Prisma migrate deploy..."

# Migrate (schema oluştur)
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

# DB boşsa seed et
DB_SIZE=$(stat -c%s "$DB_PATH" 2>/dev/null || echo "0")
if [ "$DB_SIZE" -lt "50000" ]; then
  echo "DB boş görünüyor, seed uygulanıyor..."
  node scripts/seed_catalog.js 2>/dev/null || true
  node scripts/seed_large_library.js 2>/dev/null || true
fi

echo "Uygulama başlatılıyor..."
exec node server.js
