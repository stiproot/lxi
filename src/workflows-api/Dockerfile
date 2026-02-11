FROM itartifacts.co.uk/imagebuild/docker.io/python:3.12-slim AS base
  COPY ["/trusted_certs.crt", "/usr/local/share/ca-certificates/"]
  RUN update-ca-certificates
  RUN apt-get update && apt-get install -y vim curl && rm -rf /var/lib/apt/lists/*
  RUN pip install --upgrade pip

FROM base AS extdeps
  WORKDIR /app
  COPY requirements.txt .
  RUN pip download -r requirements.txt
  RUN pip install -r requirements.txt

FROM extdeps AS localdeps
  WORKDIR /app
  COPY ./pkgs/lxi_framework-0.0.1.tar.gz /app/
  RUN tar -xvf /app/lxi_framework-0.0.1.tar.gz -C /app/.
  RUN pip download /app/lxi_framework-0.0.1/.
  RUN pip install /app/lxi_framework-0.0.1/.

FROM localdeps AS runtime
  WORKDIR /app
  COPY src/ .
  EXPOSE 8001
  CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "3"]
