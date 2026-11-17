#!/bin/sh
set -e

echo "=========================================================="
echo "MinSU DocTrack: Initializing Database Schema"
echo "=========================================================="

# Push schema changes to PostgreSQL
npx prisma db push --skip-generate

# Check if database is already seeded
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(c => { process.stdout.write(String(c)); })
  .catch(() => { process.stdout.write('0'); })
  .finally(() => prisma.\$disconnect());
" 2>/dev/null || echo "0")

if [ "$FORCE_SEED" = "true" ] || [ "$USER_COUNT" = "0" ] || [ "$ALLOW_DEMO_SEED" = "true" ]; then
  if [ "$FORCE_SEED" = "true" ] || [ "$USER_COUNT" = "0" ]; then
    echo "▶ Seeding database (Initial bootstrap or FORCE_SEED=true)..."
    npx tsx prisma/seed.ts
    echo "✔ Database seeding completed successfully."
  else
    echo "✔ Existing records detected ($USER_COUNT users found). Skipping seed to preserve data."
  fi
else
  echo "ℹ Existing records detected ($USER_COUNT users found) and ALLOW_DEMO_SEED is not enabled; skipping seed."
fi

