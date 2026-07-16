# 🤖 DeepCloneAI

> A completely local, private AI clone of yourself — no cloud, no API keys, no external API calls, and zero tracking.

[![Java](https://img.shields.io/badge/Java-21%20to%2026-orange.svg)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-green.svg)](https://spring.io/projects/spring-boot)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-blue.svg)](https://ollama.ai/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-purple.svg)](https://qdrant.tech/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

---

## ✨ Overview

DeepCloneAI is a production-grade personal AI assistant that **mimics your tone, remembers your details, and retrieves information from your documents**—powered entirely by local, offline models. By learning from your:

- 💬 **Previous conversations** — remembers long-term context across chat sessions.
- 🧠 **Memories** — explicitly stores facts, preferences, and details you tell it to remember.
- 📄 **Indexed Documents** — RAG (Retrieval-Augmented Generation) search over uploaded files (PDF, DOCX, Markdown, Text, CSV, JSON, and chat exports).
- 🎭 **Personality profile** — adapts tone, humor, vocabulary, sentence structure, and reasoning style to match yours.

**Everything runs on your local machine. No data is ever sent to OpenAI, Anthropic, Google, or any other third-party cloud service.**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 React Frontend (Vite + TS)                  │
│                     http://localhost:3000                   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP REST / SSE (Event Stream)
┌───────────────────────────▼─────────────────────────────────┐
│                 Spring Boot API (Java 21)                   │
│                     http://localhost:8080                   │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │  Auth & JWT  │  │  Chat & RAG   │  │  Memory Engine   │  │
│  │  + Devices   │  │  + Streaming  │  │  + Personality   │  │
│  └──────────────┘  └───────┬───────┘  └──────────────────┘  │
└────────────────────────────│────────────────────────────────┘
                             │ Local Connections
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐    ┌───────────────┐   ┌──────────────┐
  │   Ollama    │    │  PostgreSQL   │   │    Qdrant    │
  │  Local LLM  │    │ Conversations │   │  Vector DB   │
  │   :11434    │    │ & Metadata    │   │  Embeddings  │
  └─────────────┘    └───────────────┘   └──────────────┘
```

---

## 🚀 Quick Start (Recommended)

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- At least 8 GB RAM (16 GB recommended for running models comfortably)
- ~5 GB free disk space to store LLM and Embedding weights

### 1. Simple One-Command Setup
DeepCloneAI includes an automated setup script that configures all environment variables, launches the Docker containers, pulls the default models, and waits until the environment is healthy.

```bash
# Clone the repository
git clone <repo-url> deepclone-ai
cd deepclone-ai

# Make the setup script executable and run it
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Manual Setup
If you prefer to configure the environment step-by-step:

```bash
# 1. Copy the example env file and generate secure secrets
cp .env.example .env
# Edit .env and customize secrets/ports if necessary

# 2. Spin up core database and vector services
docker compose up -d postgres qdrant ollama

# 3. Download the default LLM and embedding model
docker compose exec ollama ollama pull qwen2.5:latest
docker compose exec ollama ollama pull nomic-embed-text:latest

# 4. Start the backend API and frontend
docker compose up -d
```

---

## 🛠️ Step-by-Step Installation & Configuration

### 1. Configuration variables (`.env`)
Create a `.env` file at the root. The following configuration is required:

```properties
# PostgreSQL Password
DB_PASSWORD=your_secure_db_password

# JWT Signature Secret (HMAC-SHA512 needs at least 512 bits / 64 characters)
JWT_SECRET=your_super_secret_jwt_key_at_least_64_characters_long_1234567890

# CORS Allowed Origins (Comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Default LLM name pulled in Ollama
OLLAMA_DEFAULT_MODEL=qwen2.5:latest

# URL of the API as accessed by the frontend
VITE_API_URL=http://localhost:8080/api
```

### 2. Ollama Setup & Model Pulling
Ensure Ollama is running locally. You can download and install Ollama from [ollama.com](https://ollama.com) or run it inside Docker.

Before using chat, you **must** pull the default model:
```bash
docker compose exec ollama ollama pull qwen2.5:latest
docker compose exec ollama ollama pull nomic-embed-text:latest
```

If you wish to pull additional models (e.g. Llama 3.2 or Gemma 3):
```bash
docker compose exec ollama ollama pull llama3.2:latest
docker compose exec ollama ollama pull gemma3:4b
```

---

## 🎯 Application Usage Guide

Once started, the services can be accessed at:
- **Frontend App**: `http://localhost:3000`
- **Backend API Docs (Swagger UI)**: `http://localhost:8080/api/swagger-ui.html`
- **Spring Actuator Health**: `http://localhost:8080/api/actuator/health`

### 1. Register Owner Account
DeepCloneAI is a private, single-owner system. You must register the owner account before logging in.
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"owner", "email":"owner@example.com", "password":"your_secure_password"}'
```

### 2. Running Frontend Locally (Development Mode)
If you wish to run the frontend app in dev mode outside of Docker:
```bash
cd frontend
npm install
npm run dev -- --port 3000
```

### 3. Running Backend Locally (Development Mode)
If you wish to compile and start the backend directly using your local JVM:
```bash
cd backend
mvn clean spring-boot:run -Dspring-boot.run.profiles=dev
```

### 4. Packaging and Running Production JAR
To package the compiled class files into a standalone production JAR:
```bash
cd backend
mvn clean package
java -jar target/deepclone-ai-1.0.0-SNAPSHOT.jar
```

---

## 📁 Project Architecture & Components

```
deepclone-ai/
├── backend/                         # Spring Boot Java Application
│   ├── src/main/java/ai/deepclone/
│   │   ├── auth/                    # Register, Login, Refresh handlers
│   │   ├── security/                # JWT Filter, IP Rate Limiting (Bucket4j)
│   │   ├── chat/                    # SSE Streaming, Message history, Prompts
│   │   ├── memory/                  # Memory CRUD, vector + DB hybrid matching
│   │   ├── documents/               # Parser (PDF, DOCX), Chunker, Vectorizer
│   │   ├── personality/             # Personality traits prompt builder
│   │   ├── ollama/                  # Ollama Service (blocking + reactive)
│   │   ├── vector/                  # Qdrant Vector database integrations
│   │   ├── search/                  # Hybrid Search logic
│   │   └── devices/                 # Session & whitelist tracking for devices
│   └── src/test/                    # Unit, Integration & Controller tests
├── frontend/                        # React + TypeScript + Vite UI
│   ├── src/pages/                   # Login, Chat, Docs, Memories, Settings...
│   ├── src/components/              # Navigation, layouts, UI components
│   ├── src/api/                     # Axios client with Token auto-rotation
│   └── src/store/                   # State stores (auth states)
├── scripts/
│   └── setup.sh                     # Launch scripts & automation
├── docker-compose.yml               # PostgreSQL, Qdrant, Ollama, API, Frontend
└── .gitignore & .dockerignore       # Clean exclude files
```

---

## 🔒 Advanced Security Configuration

DeepCloneAI implements top-tier security models to ensure secure remote internet access:

1. **IP Rate Limiting**: The `RateLimitFilter` uses the **Bucket4j** library to protect endpoints from brute force and denial of service. The default is set to a capacity of 100 requests per minute, refilling continuously.
2. **Device Fingerprinting**: JWT Access tokens contain a custom claim containing a cryptographic hash of the user's IP and User-Agent. Access from a different browser/IP on the same session will be flagged and rejected.
3. **Single-Use Refresh Token Rotation**: Refresh tokens are rotated on every use. Old tokens are instantly invalidated. If an old token is reused (indicating a token theft attack), all active sessions for that user are revoked.
4. **Device Whitelisting**: The app tracks active devices. An owner can inspect registered devices via the **Devices** page and block/revoke a device's access at any time.

---

## 🌐 Remote Access (Cloudflare Tunnel)

To access your offline clone while traveling without exposing your local network ports:

1. Install `cloudflared`:
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```
2. Start an instantaneous tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```
3. Update `CORS_ORIGINS` in your `.env` file to authorize requests originating from the resulting `.trycloudflare.com` domain.

---

## 🧪 Testing

We verify code changes and regressions via Maven test execution.

```bash
cd backend
mvn clean test
```

### Mocking Details
- **No Mocking Errors**: Mockito uses `mock-maker-subclass` to guarantee compatibility under newer Java versions (including JDK 21+ and JDK 26) without encountering bytecode modification issues.
- **Embedded Database**: Unit tests use an in-memory **H2 Database** profile to verify token rotation, parsing, prompt assembly, and memory engines without needing external database Docker volumes active.
- **Disconnected Vector Store**: The vector store is mocked out during basic context loading sanity checks (`DeepCloneAIApplicationTests`) so that the build succeeds without requiring a live, running Qdrant instance.

---

## ❓ Troubleshooting

### Port Conflict
If `8080`, `3000`, `6333`, `6334`, or `5432` are already bound, edit their mappings in `docker-compose.yml` or declare custom ports inside `.env`.

### Qdrant DB Connection Error
If the API fails to connect to Qdrant, ensure Qdrant is running, and that the container has initialized successfully. You can verify container logs:
```bash
docker compose logs qdrant
```

### Ollama Model Download Failed
If the `setup.sh` script fails to pull `qwen2.5:latest`, ensure your host machine is connected to the internet and that Ollama has enough disk space to save the weights (~3GB per model).

---

## 📄 License
DeepCloneAI is licensed under the MIT License.
