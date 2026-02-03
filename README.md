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

## License

MIT
