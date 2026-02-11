# Troubleshooting Guide

## Common Issues

### Authentication Failures

- Verify Okta configuration in UI API settings
- Ensure PAT token has required permissions
- Check browser con
sole for CORS errors

### Repository Processing Issues

- Verify Git credentials are configured
- Check ChromaDB connection
- Monitor embeddings-api logs for timeout errors

### Real-time Communication Problems

- Verify SignalR hub connection in browser console
- Check websocket connectivity
- Ensure ports 5000-5004 are available

### Performance Issues

- Monitor MongoDB memory usage
- Check ChromaDB vector index performance
- Verify network latency between services

## Logging

Each service writes logs to:

- UI API: `/logs/ui-api.log`
- Query API: `/logs/query-api.log`
- Embeddings API: `/logs/embeddings-api.log`

## Health Checks

Monitor service health at:

- UI API: `http://localhost:5000/health`
- Query API: `http://localhost:5001/health`
- Embeddings API: `http://localhost:5002/health`
