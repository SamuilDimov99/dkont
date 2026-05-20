#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8082}"

mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=${PORT}"
