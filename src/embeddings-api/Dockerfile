FROM itartifacts.co.uk/imagebuild/docker.io/python:3.12-slim AS base

ARG AZDO_PAT

COPY ["/trusted_certs.crt", "/usr/local/share/ca-certificates/"]

RUN update-ca-certificates
RUN apt-get update && apt-get install -y git vim gcc python3-dev build-essential && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN python -m pip install --upgrade certifi

# Set environment variables for SSL
ENV REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
ENV SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt


FROM base AS extdeps
# Using public PyPI only - configure custom package repositories via .env if needed
WORKDIR /app

# Copy and install requirements in separate steps for better caching
COPY requirements.txt .

# Install torch and sentence-transformers first (biggest dependencies)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install torch>=1.11.0 --index-url https://download.pytorch.org/whl/cpu
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install sentence-transformers --use-feature=truststore

# Install remaining dependencies with prefer-binary to avoid compilation
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --prefer-binary $(grep -v "torch\|sentence-transformers" requirements.txt)

# Pre-download the embedding model to avoid runtime download
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"


FROM extdeps AS localdeps
WORKDIR /app
COPY ./pkgs/lxi_framework-0.0.1.tar.gz /app/
RUN tar -xvf /app/lxi_framework-0.0.1.tar.gz -C /app/.
RUN pip install /app/lxi_framework-0.0.1/.


FROM localdeps AS runtime
WORKDIR /app
COPY src/ .
ENV PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
EXPOSE 8001
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "3"]
# uvicorn app:app --host 0.0.0.0 --port 8001 --workers 1
