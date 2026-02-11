## prerequisites
```sh
dapr --version
# CLI version: 1.15.0
# Runtime version: 1.15.5
```

```sh
dapr init --container-runtime podman
```
Starts the daprd process as a local binary
Connects to the local placement service

## placement service
```sh
podman run -d \
  --name placement-lxi-v2 \
  -p 50000:50006 \
  daprio/placement:1.15.5-linux-arm64 \
  ./placement -port 50006
```

## embeddings service

```sh
cd src/embeddings-api/src/
```

```sh
dapr run --app-id lxi-embeddings-api \
    --placement-host-address localhost:50000 \
    --resources-path ../../dapr/components.localhost/ \
    --config ../../dapr/configuration/config.yaml \
    --app-port 6002 \
    -- python3 -m uvicorn app:app --host 0.0.0.0 --port 6002
```

**UV**
```sh
dapr run --app-id lxi-embeddings-api \
    --placement-host-address localhost:50000 \
    --resources-path ../../dapr/components.localhost/ \
    --config ../../dapr/configuration/config.yaml \
    --app-port 6002 \
    -- uv run uvicorn app:app --host 0.0.0.0 --port 6002
```

## qry service

```sh
dapr run --app-id lxi-qry-api \
    --placement-host-address localhost:50000 \
    --resources-path ../../dapr/components.localhost/ \
    --config ../../dapr/configuration/config.yaml \
    --app-port 6001 \
    -- uv run uvicorn app:app --host 0.0.0.0 --port 6001
```