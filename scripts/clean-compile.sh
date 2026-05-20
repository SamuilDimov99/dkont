#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Cleaning and compiling..."
mvn clean compile -q
echo "Done."
