#!/bin/sh

# USED TO BUILD, RUN AND EXEC AND INTERACTIVE TERMAINAL IN THE CONTAINER OF THIS SERVICE.

docker build -f Dockerfile -t img-lxi-workflows-api-$1 .

docker run --name lxi-workflows-api-$1 \
    -p 8005:8001 \
    -e ENVIRONMENT=aks \
    -e KEY_VAULT_URL=https://kvprojectmetricsdevtest.vault.azure.net/ \
    -e COSMOS_DATABASE_NAME=cossqldb-lxi-devtest \
    -e COSMOS_URL=https://cosacc-auto-promo-creation-devtest.documents.azure.com:443/ \
    -e STORE_QUERY_URL= \
    -it --detach \
    img-lxi-workflows-api-$1

docker exec -it lxi-workflows-api-$1 sh