#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 4 ]; then
  echo "Usage: $0 <username> <password> <email> <ADMIN|EMPLOYEE|CLIENT>" >&2
  exit 2
fi

API_BASE_URL="${API_BASE_URL:-http://localhost:8082}"
USERNAME="$1"
PASSWORD="$2"
EMAIL="$3"
ROLE="$4"
AUTH_HEADER=()
if [ -n "${ADMIN_API_TOKEN:-}" ]; then
  AUTH_HEADER=(-H "X-Admin-Token: ${ADMIN_API_TOKEN}")
fi

curl -sS -X POST "${API_BASE_URL}/api/user" \
  "${AUTH_HEADER[@]}" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${USERNAME}\",\"passwordHash\":\"${PASSWORD}\",\"email\":\"${EMAIL}\",\"role\":\"${ROLE}\"}"
