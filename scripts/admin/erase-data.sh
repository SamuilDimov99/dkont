#!/usr/bin/env bash
set -euo pipefail

# Erases all application data from the MariaDB database.
#
# Usage:
#   scripts/admin/erase-data.sh --yes
#
# Optional environment:
#   DB_HOST=localhost
#   DB_PORT=3306
#   DB_NAME=dkont
#   DB_USER=dkont
#   DB_PASSWORD=dkont
#
# This script deletes rows from every known application table and resets
# auto-increment counters. It intentionally does not drop tables.

if [ "${1:-}" != "--yes" ]; then
  cat >&2 <<USAGE
Refusing to erase data without explicit confirmation.

Usage:
  $0 --yes

Optional environment:
  DB_HOST=localhost DB_PORT=3306 DB_NAME=dkont DB_USER=dkont DB_PASSWORD=dkont $0 --yes
USAGE
  exit 2
fi

if ! command -v mariadb >/dev/null 2>&1; then
  echo "Missing required command: mariadb" >&2
  exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-dkont}"
DB_USER="${DB_USER:-dkont}"
DB_PASSWORD="${DB_PASSWORD:-dkont}"

echo "Erasing all application data from ${DB_NAME} at ${DB_HOST}:${DB_PORT} as ${DB_USER}..."

mariadb \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  "$DB_NAME" <<'SQL'
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE shipment;
TRUNCATE TABLE employee;
TRUNCATE TABLE client;
TRUNCATE TABLE office;
TRUNCATE TABLE users;
TRUNCATE TABLE company;

SET FOREIGN_KEY_CHECKS = 1;
SQL

echo "Data erased."
