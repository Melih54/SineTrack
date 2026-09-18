#!/bin/sh

echo "========================================"
echo "    SineTrack Sunucusu Baslatiliyor"
echo "========================================"

# Railway Volume kontrolu
if [ -d "/data" ]; then
  echo ">> Railway Volume (/data) algilandi."
  DB_FILE="/data/prod.db"
  
  # Veritabani yoksa veya 50KB'dan kucukse hazir dev.db'yi kopyala
  if [ ! -f "$DB_FILE" ] || [ $(wc -c < "$DB_FILE" 2>/dev/null || echo 0) -lt 50000 ]; then
    echo ">> Ilk kurulum: Hazir dev.db veritabani /data/prod.db adresine kopyalaniyor..."
    cp -f ./prisma/dev.db /data/prod.db 2>/dev/null || true
    chmod 666 /data/prod.db 2>/dev/null || true
  fi
  export DATABASE_URL="file:/data/prod.db"
else
  echo ">> Volume yok, yerel prisma/dev.db kullaniliyor."
  export DATABASE_URL="file:$(pwd)/prisma/dev.db"
fi

echo ">> DATABASE_URL: $DATABASE_URL"
echo ">> PORT: ${PORT:-3000}"
echo ">> HOSTNAME: ${HOSTNAME:-0.0.0.0}"
echo ">> Sunucu baslatiliyor..."

exec node server.js
