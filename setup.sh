#!/bin/bash
set -e

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║          DevAtlas — Setup Script          ║"
echo "  ║      Crafting knowledge for engineers     ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ─── Check prerequisites ────────────────────────────────────────────
echo -e "${CYAN}[1/8]${NC} Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js is not installed.${NC}"
  echo "  Install it from: https://nodejs.org"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"

if ! command -v pnpm &> /dev/null; then
  echo -e "  ${YELLOW}→ Installing pnpm...${NC}"
  npm install -g pnpm
fi
echo -e "  ${GREEN}✓${NC} pnpm $(pnpm --version)"

# ─── Install dependencies ───────────────────────────────────────────
echo ""
echo -e "${CYAN}[2/8]${NC} Installing dependencies..."
pnpm install

# ─── Setup environment ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}[3/8]${NC} Setting up environment..."

if [ ! -f .env ]; then
  cp .env.example .env 2>/dev/null || true

  # Generate a random JWT secret
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -d '\n/+=' | head -c 64)

  cat > .env <<EOF
# DevAtlas Environment Variables
DATABASE_URL="${DATABASE_URL:-}"
JWT_SECRET="${JWT_SECRET}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="DevAtlas"
CLOUDINARY_CLOUD_NAME="${CLOUDINARY_CLOUD_NAME:-}"
CLOUDINARY_API_KEY="${CLOUDINARY_API_KEY:-}"
CLOUDINARY_API_SECRET="${CLOUDINARY_API_SECRET:-}"
EOF

  echo -e "  ${GREEN}✓${NC} Created .env file"
else
  echo -e "  ${GREEN}✓${NC} .env file already exists"
fi

# ─── Check DATABASE_URL ────────────────────────────────────────────
echo ""
echo -e "${CYAN}[4/8]${NC} Checking database connection..."

if grep -q 'DATABASE_URL=""' .env 2>/dev/null || ! grep -q 'DATABASE_URL=' .env 2>/dev/null; then
  echo ""
  echo -e "  ${YELLOW}⚠  DATABASE_URL is not configured.${NC}"
  echo ""
  echo "  You need a PostgreSQL database. Here are your options:"
  echo ""
  echo "  Option 1 — Neon (Free, Recommended):"
  echo "    1. Go to https://neon.tech and create a free account"
  echo "    2. Create a new project"
  echo "    3. Copy the connection string"
  echo ""
  echo "  Option 2 — Local PostgreSQL:"
  echo "    brew install postgresql@16 && brew services start postgresql@16"
  echo "    createdb devatlas"
  echo "    DATABASE_URL=\"postgresql://localhost:5432/devatlas\""
  echo ""

  read -p "  Paste your DATABASE_URL (or press Enter to skip for now): " DB_URL

  if [ -n "$DB_URL" ]; then
    # Update .env with the DATABASE_URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|DATABASE_URL=\".*\"|DATABASE_URL=\"${DB_URL}\"|" .env
    else
      sed -i "s|DATABASE_URL=\".*\"|DATABASE_URL=\"${DB_URL}\"|" .env
    fi
    echo -e "  ${GREEN}✓${NC} DATABASE_URL configured"
  else
    echo -e "  ${YELLOW}→ Skipping database setup. You can configure it later.${NC}"
  fi
else
  echo -e "  ${GREEN}✓${NC} DATABASE_URL is configured"
fi

# ─── Generate Prisma client ────────────────────────────────────────
echo ""
echo -e "${CYAN}[5/8]${NC} Generating Prisma client..."
pnpm db:generate 2>/dev/null || npx prisma generate

# ─── Push schema to database ───────────────────────────────────────
echo ""
echo -e "${CYAN}[6/8]${NC} Syncing database schema..."

if grep -q 'DATABASE_URL=""' .env 2>/dev/null || ! grep -q 'postgresql://' .env 2>/dev/null; then
  echo -e "  ${YELLOW}→ Skipping (no DATABASE_URL). Run 'pnpm db:push' after configuring.${NC}"
else
  pnpm db:push 2>/dev/null || npx prisma db push
  echo -e "  ${GREEN}✓${NC} Database schema synced"
fi

# ─── Seed database ─────────────────────────────────────────────────
echo ""
echo -e "${CYAN}[7/8]${NC} Seeding database..."

if grep -q 'DATABASE_URL=""' .env 2>/dev/null || ! grep -q 'postgresql://' .env 2>/dev/null; then
  echo -e "  ${YELLOW}→ Skipping (no DATABASE_URL). Run 'pnpm db:seed' after configuring.${NC}"
else
  pnpm db:seed 2>/dev/null || npx tsx prisma/seed.ts
  echo -e "  ${GREEN}✓${NC} Database seeded"
fi

# ─── Start dev server ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}[8/8]${NC} Starting DevAtlas..."
echo ""
echo "  ╔══════════════════════════════════════════════════╗"
echo "  ║              DevAtlas is ready!                  ║"
echo "  ╠══════════════════════════════════════════════════╣"
echo "  ║                                                  ║"
echo "  ║  Local:   http://localhost:3000                  ║"
echo "  ║  Admin:   http://localhost:3000/admin            ║"
echo "  ║                                                  ║"
echo "  ║  Login:   admin@123                             ║"
echo "  ║  Pass:    admin123                               ║"
echo "  ║                                                  ║"
echo "  ╚══════════════════════════════════════════════════╝"
echo ""

pnpm dev
