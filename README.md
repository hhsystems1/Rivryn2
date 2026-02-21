# RivRyn - AI-Powered Coding IDE

An open-source, multi-agent AI coding IDE like Replit.

## Architecture

- **Frontend**: React + TypeScript + Vite + Monaco Editor + xterm.js
- **Backend**: Node.js + Express + TypeScript + WebSocket
- **Container Manager**: Docker-based sandbox environments
- **LLM**: Ollama integration for local AI

## Quick Start

### Prerequisites

- Node.js 18+
- Docker
- Ollama (for AI features)

### Installation

```bash
# Install dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Build Docker base image
docker build -t rivryn-base:latest ./docker/base
```

### Development

```bash
# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
cd frontend && npm run dev

# Or run both
npm run dev
```

### Project Structure

```
rivryn/
├── backend/          # API server, agents, sandbox
│   ├── src/
│   │   ├── api/      # Express routes
│   │   ├── llm/      # Ollama client, prompt loader
│   │   ├── sandbox/  # Docker container manager
│   │   └── types/    # TypeScript types
├── frontend/         # React IDE
│   ├── src/
│   │   ├── components/
│   │   ├── services/ # API clients
│   │   └── styles/
├── docker/           # Container configurations
└── rivryn-prompts/   # Agent prompts (Markdown)
```

## Features

- Monaco code editor
- File explorer with CRUD operations
- Integrated terminal (xterm.js + WebSocket)
- Multi-agent AI system
- Docker sandbox for safe code execution
- Live preview of running projects

## Sidekick Integration Contract (`v1`)

If `hhssidekick` and `riv` stay in one product surface, keep an internal API contract so build flows stay stable.

1. Create build job: `POST /api/build-jobs/v1`
2. Poll build job: `GET /api/build-jobs/v1/:id`
3. Optional history: `GET /api/build-jobs/v1?limit=20`

Example create request:

```json
{
  "apiVersion": "v1",
  "projectName": "customer-portal",
  "prompt": "Build a Next.js dashboard with auth and billing pages",
  "template": "nextjs",
  "context": "Target deployment is Vercel",
  "requestedBy": "hhssidekick",
  "maxRetries": 1
}
```

Response status lifecycle: `queued` -> `running` -> `completed` or `failed`.
Each job includes structured `logs` and generated `artifacts` (`plan`, `specification`) so sidekick can render progress and failure details.

## Runtime Readiness

Use `GET /api/health` before enabling build actions in sidekick.  
It returns:

- `200` with `status: "ready"` when Docker is reachable and Ollama has the configured model.
- `503` with `status: "degraded"` plus detailed check errors when dependencies are unavailable.

Backend LLM settings:

- `OLLAMA_HOST` (default: `http://127.0.0.1:11434`)
- `OLLAMA_MODEL` (default: `codellama`)

If the model is missing, API errors now include a direct pull hint:
`ollama pull <model>`.

## Frontend Environment (Netlify)

Set these in Netlify for the `frontend` build:

- `VITE_API_BASE_URL=https://your-backend-domain.com`
- `VITE_WS_BASE_URL=wss://your-backend-domain.com`
- `VITE_SUPABASE_URL=https://xztpkgnorbltoksucckc.supabase.co`
- `VITE_SUPABASE_ANON_KEY=<supabase anon key>`
- `VITE_SIDEKICK_GOOGLE_CONNECT_URL=https://xztpkgnorbltoksucckc.supabase.co/functions/v1/google-connect`
- `VITE_SIDEKICK_GOOGLE_STATUS_URL=https://xztpkgnorbltoksucckc.supabase.co/functions/v1/google-status`
- `VITE_SIDEKICK_GOOGLE_DISCONNECT_URL=https://xztpkgnorbltoksucckc.supabase.co/functions/v1/google-disconnect`
- `VITE_SIDEKICK_MEMORY_SYNC_URL=<optional memory sync endpoint>`
- `VITE_SIDEKICK_PROJECT_CONTEXT_SYNC_URL=<optional project-context sync endpoint>`
- `VITE_SIDEKICK_DEPLOY_STATUS_URL=<optional deploy status endpoint>`

If omitted in local development, the frontend falls back to relative `/api` and `/ws` paths (using Vite proxy).

## License

MIT
