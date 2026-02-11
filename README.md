# Lxi

AI-powered repository intelligence and collaboration platform.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development](#development)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Lxi** is an AI-powered productivity tool that enables intelligent querying of code repositories and seamless collaboration between users. Built on a microservices architecture using Dapr, it provides semantic search, code embeddings, and workflow orchestration for development teams.

The platform combines multiple specialized services to deliver fast, context-aware repository analysis powered by modern AI techniques.

---

## Features

- **Semantic Code Search** - Query repositories using natural language
- **AI-Powered Analysis** - Leverage embeddings and vector search for intelligent code understanding
- **Workflow Orchestration** - Coordinate complex multi-step operations across services
- **Real-time Collaboration** - Share insights and queries with team members
- **Microservices Architecture** - Scalable, distributed design using Dapr runtime
- **Multi-Repository Support** - Work across multiple codebases simultaneously

---

## Architecture

Lxi is built using a microservices architecture with the following key components:

- **UI API** (.NET) - WebAPI serving the frontend and coordinating service calls
- **Embeddings API** (Python/FastAPI) - Generates and manages code embeddings
- **Query API** (Python/FastAPI) - Handles semantic search and repository queries
- **Workflows API** (Python/FastAPI) - Orchestrates complex multi-step operations

All services communicate via [Dapr](https://dapr.io/) (Distributed Application Runtime) for service invocation, pub/sub messaging, and state management.

**Detailed Architecture Documentation:**

- [Architecture Overview](docs/architecture.md)
- [C4 System Context Diagram](docs/c4-system-context-diagram.md)
- [C4 Container Diagram](docs/c4-container-diagram.md)
- [C4 Component Diagram](docs/c4-component-diagram.md)
- [Workflows](docs/workflows.md)

---

## Prerequisites

- **Docker & Docker Compose** - For running the full solution
- **Dapr CLI** - For local development of individual services
- **.NET 8.0 SDK** - For UI API development
- **Python 3.12** - For FastAPI services development
- **Azure DevOps PAT** - Personal Access Token with repository read access
- **OpenAI API Key** - For AI-powered features

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/stiproot/lxi.git
cd lxi
```

### 2. Configure Credentials

**Important:** Before running the application, you need to configure several settings:

#### A. Azure DevOps Configuration

Update `src/ui-api/appsettings.json`:

```json
{
  "AzureDevOps": {
    "Organization": "your-organization-name",
    "Pat": "your-pat-token"
  }
}
```

Create a `.pat.env` file in the root directory for Docker Compose:

```bash
export AZDO_PAT=your-pat-token
```

Set environment variables for Python services (or use `.env.local` files):

```bash
export AZDO_ORGANIZATION=your-organization-name
export PAT=your-pat-token
```

#### B. OAuth Configuration (Optional)

If using OAuth authentication, update `src/ui-api/appsettings.json`:

```json
{
  "OktaOptions": {
    "Issuer": "https://your-okta-domain.okta.com/oauth2/default",
    "ClientId": "your-client-id",
    "ClientSecret": "your-client-secret",
    "TokenUri": "https://your-okta-domain.okta.com/oauth2/default/v1/token"
  }
}
```

And update `src/ui/public/envconfig.js`:

```javascript
window.envconfig = {
  "VITE_OKTA_CLIENT_ID": "your-client-id",
  "VITE_OKTA_ISSUER": "https://your-okta-domain.okta.com/oauth2/default"
};
```

#### C. CORS Configuration

Update allowed origins in `src/ui-api/appsettings.json`:

```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000", "http://localhost:8080"]
  }
}
```

### 3. Run with Docker Compose

```bash
# Standard architecture
make docker-compose

# ARM architecture (Apple Silicon)
make docker-compose-arm
```

This starts all services including:

- Dapr placement service
- MongoDB (state store)
- ChromaDB (vector database)
- RabbitMQ (message broker)
- All microservices (UI API, Embeddings API, Query API, Workflows API)

### 4. Access the Application

Once running, access the UI at the configured endpoint (see docker-compose.yml for ports).

---

## Development

### Running Individual Services

For faster iteration during development, run only the required infrastructure services and launch individual services locally.

**Required Infrastructure Services:**

- `placement-lxi` - Dapr placement service
- `mongo` - MongoDB state store
- `chromadb-lxi` - Vector database
- `rabbitmq-lxi` - Message broker
- `mongo-express-lxi` - MongoDB admin UI (optional)

Start these with:

```bash
docker compose up placement-lxi mongo chromadb-lxi rabbitmq-lxi
```

### UI API (.NET)

Configure credentials in `src/ui-api/appsettings.json`:

```json
{
  "AzureDevOps": {
    "Pat": "<your-azdo-pat-token>"
  }
}
```

Run the service:

```bash
make run-ui-api
```

Or manually:

```bash
cd src/ui-api
dapr run --app-id lxi-ui-api \
  --placement-host-address localhost:50000 \
  --resources-path ../dapr/components.localhost/ \
  --config ../dapr/configuration/config.yaml \
  --app-port 5000 \
  -- dotnet run
```

### Python Services (Embeddings API, Query API, Workflows API)

**1. Configure environment variables:**

Each Python service has a `.env.template` file. Copy it to `.env.local` and add your credentials:

```bash
# For each service (embeddings-api, qry-api, workflows-api)
cp src/{service-name}/.env.template src/{service-name}/.env.local

# Edit .env.local with your actual values:
# - AZDO_ORGANIZATION=your-organization
# - PAT=your-pat-token
# - OPENAI_API_KEY=your-api-key
```

**2. Set up Python environment:**

```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**2. Build and install the lxi-framework module:**

```bash
make build-framework-pkg
make install-framework-pkg
```

Or manually:

```bash
pip install build
python3.12 -m build src/modules/lxi-framework
tar -xvf src/modules/lxi-framework/dist/*.tar.gz -C src/modules/lxi-framework/dist/
python3.12 -m pip install src/modules/lxi-framework/dist/lxi_framework-0.0.1/.
```

**3. Run individual services:**

```bash
# Embeddings API
make run-embeddings-api

# Query API
make run-qry-api

# Workflows API
make run-workflows-api
```

### Local Development Without Committing Credentials

To prevent accidentally committing credentials:

**1. Copy template files:**

```bash
# Embeddings API
cp src/embeddings-api/src/.env.template src/embeddings-api/src/.env.local

# Query API
cp src/qry-api/src/.config/openai_config.local.json.template src/qry-api/src/.config/openai_config.local.json

# UI API
cp src/ui-api/appsettings.local.json.template src/ui-api/appsettings.local.json
```

**2. Add your actual credentials to the `.local` files**

All `.local` files are gitignored and cannot be accidentally committed.

**3. Run with local overrides:**

```bash
make run-ui-api        # Uses appsettings.local.json
make run-embeddings-api # Uses .env.local
make run-qry-api       # Uses openai_config.local.json
```

---

## Documentation

- [Architecture Overview](docs/architecture.md) - System design and component interactions
- [Workflows](docs/workflows.md) - Common workflows and orchestration patterns
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [C4 Diagrams](docs/) - System context, container, and component diagrams
- [Makefile](Makefile) - All available commands and shortcuts

---

## Contributing

Contributions are welcome! Please feel free to:

- Report bugs via GitHub Issues
- Submit pull requests for bug fixes or features
- Improve documentation
- Share feedback and suggestions

---

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.
