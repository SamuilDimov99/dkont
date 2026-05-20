#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8082}"

if [ -n "${ADMIN_API_TOKEN:-}" ]; then
  curl -sS -H "X-Admin-Token: ${ADMIN_API_TOKEN}" "${API_BASE_URL}/api/user"
else
  curl -sS "${API_BASE_URL}/api/user"
fi
