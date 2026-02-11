# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lxi is an AI-powered productivity tool that allows users to query repositories and collaborate with other users. The system uses a microservices architecture with Dapr (Distributed Application Runtime) for service-to-service communication, state management, and pub/sub messaging.

## Architecture

The system consists of 5 main services:

1. **UI-API** (.NET 8 WebAPI) - Main backend API handling authentication, chat, and repository management
2. **Embeddings-API** (Python FastAPI) - Processes and embeds repository content for search
3. **QRY-API** (Python FastAPI) - Handles AI queries and agent processing
4. **Workflows-API** (Python FastAPI) - Manages background workflows and processing
5. **UI** (React/TypeScript) - Frontend application using Vite, Mantine UI, and React Router

All Python services share a common `lxi-framework` package that provides shared utilities for Dapr communication, types, and utilities.

## Development Setup

### Prerequisites
- Python 3.12+ (for FastAPI services)
- .NET 8 SDK (for UI-API)
- Node.js/Yarn (for UI)
- Docker and Docker Compose
- Dapr CLI
- Azure DevOps PAT token

### Initial Setup

1. Create `.pat.env` file in root with your Azure DevOps PAT:
   ```
   export AZDO_PAT=<<your-azdo-pat-token>>
   ```

2. For UI-API, update `src/ui-api/appsettings.json`:
   ```json
   "AzureDevOps": {
      "Pat": "<<your-azdo-pat-token>>"
   }
   ```

### Build and Run Commands

**Full system (Docker Compose):**
```bash
make docker-compose           # Standard build
make docker-compose-arm       # ARM architecture
make docker-compose-arm-build # ARM with build
```

**Individual services (requires core services running):**

Core services needed: `placement-lxi`, `mongo`, `chromadb-lxi`, `rabbitmq-lxi`, `mongo-express-lxi`

```bash
# UI-API (.NET)
make run-ui-api
# or manually: cd src/ui-api && dapr run --app-id lxi-ui-api --placement-host-address localhost:50000 --resources-path ../dapr/components.localhost/ --config ../dapr/configuration/config.yaml --app-port 5000 -- dotnet run

# Embeddings-API (Python)
make run-embeddings-api

# QRY-API (Python)
make run-qry-api

# Workflows-API (Python)
make run-workflows-api
```

**Python services setup:**
```bash
# Create virtual environment
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Build and install lxi-framework
make build-framework-pkg
make install-framework-pkg
```

**Frontend (UI):**
```bash
cd src/ui
yarn install
yarn dev          # Development server
yarn build        # Production build
yarn test         # Run all tests (typecheck + prettier + lint + vitest)
yarn typecheck    # TypeScript checking
yarn lint         # ESLint + Stylelint
yarn vitest       # Unit tests only
```

## Key Development Patterns

### FastAPI Services Structure
- All Python services follow similar structure: `src/app.py` (main), `core/` (business logic), `endpoints/` (API routes)
- Use `lxi-framework` for Dapr communication patterns
- Each service has a `run.sh` script for container execution

### .NET UI-API Structure
- Uses Dapr Actors pattern for state management (ChatActor, UserActor, RepoActor)
- SignalR hubs for real-time communication
- Platform.Extensions.AspNet packages for telemetry and common functionality

### Frontend Architecture
- React 18 with TypeScript
- Mantine UI component library
- Context providers for state management (ChatContext, UserContext, RepositoryContext)
- SignalR for real-time updates
- Vite for build tooling

### Authentication
- Okta-based authentication with JWT tokens
- RBAC implementation through Platform.Extensions

## Test Commands

```bash
# Frontend tests
cd src/ui
yarn test                    # Full test suite
yarn vitest                  # Unit tests only
yarn typecheck               # TypeScript validation
yarn lint                    # Code linting

# Python services (if tests exist)
cd src/embeddings-api && python -m pytest
cd src/qry-api && python -m pytest
cd src/workflows-api && python -m pytest

# .NET API
cd src/ui-api && dotnet test
```

## Important Notes

- The `lxi-framework` package must be built and installed before running Python services
- All services communicate through Dapr sidecars - ensure Dapr is running locally
- The system requires external dependencies: MongoDB, RabbitMQ, ChromaDB
- Use the provided Makefile commands for consistent development workflow
- ARM architecture requires specific Docker Compose overrides

## Git Commit Guidelines

- Do NOT include "🤖 Generated with [Claude Code]" or "Co-Authored-By: Claude" signatures in commit messages
- Keep commit messages clean and professional without AI attribution

## Azure DevOps CLI Guidelines

### Creating and Managing Pull Requests
- Use `az repos pr create` for creating PRs
- Use `az repos pr update` for updating existing PRs

### Updating PR Titles and Descriptions
- When updating PR titles with spaces using `az repos pr update --title`, the CLI has issues parsing quoted strings directly
- **Solution**: Use file input with `@` prefix: `--title "@filepath"` instead of `--title "string with spaces"`
- Same issue applies to descriptions with complex formatting - use `--description "@filepath"`