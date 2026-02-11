dapr run --app-id lxi-embeddings-api \
    --placement-host-address localhost:50000 \
    --resources-path ../../dapr.localhost/components/ \
    --config ../../dapr.localhost/configuration/config.yaml \
    --app-port 6002 \
    -- python3 -m uvicorn app:app --host 0.0.0.0 --port 6002
