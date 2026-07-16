#!/bin/bash
# DeepCloneAI Setup Script
# Pulls required Ollama models and initializes the environment

set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[DeepCloneAI]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

log "Starting DeepCloneAI setup..."

# Check dependencies
command -v docker >/dev/null 2>&1 || error "Docker is required but not installed."
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || error "Docker Compose is required."

# Create .env file if not present
if [ ! -f .env ]; then
    log "Creating .env file..."
    cat > .env <<EOF
# DeepCloneAI Environment Configuration
DB_PASSWORD=deepclone_$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 64)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
OLLAMA_DEFAULT_MODEL=qwen2.5:latest
VITE_API_URL=http://localhost:8080/api
EOF
    success ".env file created with secure random secrets"
else
    warn ".env file already exists, skipping creation"
fi

# Start core services first (Ollama, Postgres, Qdrant)
log "Starting infrastructure services..."
docker compose up -d postgres qdrant ollama

log "Waiting for Ollama to be ready..."
sleep 10

# Pull AI models
log "Pulling default AI model: qwen2.5:latest (~2.5GB)"
docker compose exec ollama ollama pull qwen2.5:latest || warn "qwen2.5 pull failed, you can do this manually"

log "Pulling embedding model: nomic-embed-text:latest (~274MB)"
docker compose exec ollama ollama pull nomic-embed-text:latest || warn "nomic-embed-text pull failed"

# Optionally pull additional models
if [ "${PULL_EXTRA_MODELS:-false}" = "true" ]; then
    log "Pulling optional models..."
    docker compose exec ollama ollama pull gemma3:4b || warn "gemma3:4b pull failed"
    docker compose exec ollama ollama pull llama3.2:latest || warn "llama3.2 pull failed"
fi

# Start remaining services
log "Starting application services..."
docker compose up -d

log "Waiting for API to be ready..."
for i in {1..30}; do
    if curl -sf http://localhost:8080/api/actuator/health > /dev/null 2>&1; then
        success "API is ready!"
        break
    fi
    echo -n "."
    sleep 5
done

echo ""
success "DeepCloneAI is running!"
echo ""
echo "  API:       http://localhost:8080/api"
echo "  Swagger:   http://localhost:8080/api/swagger-ui.html"
echo "  Frontend:  http://localhost:3000"
echo "  Ollama:    http://localhost:11434"
echo "  Qdrant:    http://localhost:6333"
echo ""
echo "  First, register the owner account:"
echo "  curl -X POST http://localhost:8080/api/v1/auth/register \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"you\",\"email\":\"you@example.com\",\"password\":\"your-password\"}'"
