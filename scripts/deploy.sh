#!/bin/bash

# Create network if it doesn't exist
docker network create benji_network 2>/dev/null


# Build prod using new BuildKit engine
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker-compose -f docker-compose.yml build

# Start prod in detached mode
docker-compose -f docker-compose.yml up -d