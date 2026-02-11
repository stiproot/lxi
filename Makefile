docker-compose:
	docker compose -p lxi -f docker-compose.yml --env-file .pat.env up --build

docker-compose-arm:
	docker compose -p lxi -f docker-compose.yml -f docker-compose.arm.override.yml --env-file .pat.env up

podman-compose-arm-subset:
	podman-compose -p lxi \
		-f docker-compose.yml \
		-f docker-compose.arm.override.yml \
		--env-file .pat.env up \
		placement rabbitmq mongo mongo-express chromadb \
		lxi-qry-api lxi-qry-api-dapr \
		lxi-embeddings-api lxi-embeddings-api-dapr

podman-compose-arm-build:
	podman-compose -p lxi -f docker-compose.yml -f docker-compose.arm.override.yml --env-file .pat.env up --build

docker-compose-arm-build:
	docker compose -p lxi -f docker-compose.yml -f docker-compose.arm.override.yml --env-file .pat.env up --build

run-embeddings-api:
	cd src/embeddings-api/src && \
	dapr run --app-id lxi-embeddings-api \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.localhost/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6002 \
		-- python3 -m uvicorn app:app --host 0.0.0.0 --port 6002 --workers 2

run-qry-api:
	cd src/qry-api/src && \
	dapr run --app-id lxi-qry-api \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.localhost/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6001 \
		-- python3 -m uvicorn app:app --host 0.0.0.0 --port 6001 --workers 2

run-workflows-api:
	cd src/workflows-api/src && \
	dapr run --app-id lxi-workflows-api \
		--placement-host-address localhost:50000 \
		--resources-path ../../dapr/components.localhost/ \
		--config ../../dapr/configuration/config.yaml \
		--app-port 6003 \
		-- python3 -m uvicorn app:app --host 0.0.0.0 --port 6003 --workers 2

run-ui-api:
	cd src/ui-api && \
	dapr run --app-id lxi-ui-api \
		--placement-host-address localhost:50000 \
		--resources-path ../dapr/components.localhost/ \
		--config ../dapr/configuration/config.yaml \
		--app-port 5000 \
		-- dotnet run

build-framework-pkg:
	rm -rf src/modules/lxi-framework/dist
	python3.12 -m build src/modules/lxi-framework

install-framework-pkg:
	python3.12 -m pip uninstall lxi-framework -y
	tar -xvf src/modules/lxi-framework/dist/*.tar.gz -C src/modules/lxi-framework/dist/
	python3.12 -m pip install src/modules/lxi-framework/dist/lxi_framework-0.0.1/.
	cp -f src/modules/lxi-framework/dist/lxi_framework-0.0.1.tar.gz src/workflows-api/pkgs/
	cp -f src/modules/lxi-framework/dist/lxi_framework-0.0.1.tar.gz src/qry-api/pkgs/
	cp -f src/modules/lxi-framework/dist/lxi_framework-0.0.1.tar.gz src/embeddings-api/pkgs/
