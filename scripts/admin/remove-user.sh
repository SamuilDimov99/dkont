#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <user-id>" >&2
  exit 2
fi

API_BASE_URL="${API_BASE_URL:-http://localhost:8082}"
USER_ID="$1"
AUTH_HEADER=()
if [ -n "${ADMIN_API_TOKEN:-}" ]; then
  AUTH_HEADER=(-H "X-Admin-Token: ${ADMIN_API_TOKEN}")
fi

curl -sS -X DELETE "${API_BASE_URL}/api/user/${USER_ID}" "${AUTH_HEADER[@]}"
