#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <user-id> <ADMIN|EMPLOYEE|CLIENT>" >&2
  exit 2
fi

API_BASE_URL="${API_BASE_URL:-http://localhost:8082}"
USER_ID="$1"
ROLE="$2"
AUTH_HEADER=()
if [ -n "${ADMIN_API_TOKEN:-}" ]; then
  AUTH_HEADER=(-H "X-Admin-Token: ${ADMIN_API_TOKEN}")
fi

curl -sS -X PUT "${API_BASE_URL}/api/user/${USER_ID}/role?role=${ROLE}" "${AUTH_HEADER[@]}"
