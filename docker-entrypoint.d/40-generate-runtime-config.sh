#!/bin/sh
set -eu

CONFIG_DIR="/usr/share/nginx/html/config"
CONFIG_FILE="$CONFIG_DIR/runtime-config.json"

if [ -n "${RUNTIME_CONFIG_JSON:-}" ]; then
  printf '%s\n' "$RUNTIME_CONFIG_JSON" > "$CONFIG_FILE"
  echo "Runtime config written from RUNTIME_CONFIG_JSON"
  exit 0
fi

echo "Using the runtime config embedded in the image"
