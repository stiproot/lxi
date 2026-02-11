dapr run --app-id lxi-ui-api \
    --placement-host-address localhost:50000 \
    --resources-path ../.dapr.local/components/ \
    --config ../dapr/configuration/config.yaml \
    --app-port 5001 \
    -- dotnet run --urls "http://localhost:5001"
