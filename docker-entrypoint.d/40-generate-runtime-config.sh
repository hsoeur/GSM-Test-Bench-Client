#!/bin/sh
set -eu

CONFIG_DIR="/usr/share/nginx/html/config"
CONFIG_FILE="$CONFIG_DIR/runtime-config.json"
TEMPLATE_FILE="$CONFIG_DIR/runtime-config.template.json"

if [ -n "${RUNTIME_CONFIG_JSON:-}" ]; then
  printf '%s\n' "$RUNTIME_CONFIG_JSON" > "$CONFIG_FILE"
  echo "Runtime config written from RUNTIME_CONFIG_JSON"
  exit 0
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "Runtime config template not found, keeping existing config"
  exit 0
fi

if [ -z "${GENERATE_RUNTIME_CONFIG:-}" ] \
  && [ -z "${API_TEST_GSM_BASE:-}" ] \
  && [ -z "${API_DATA_BASE:-}" ] \
  && [ -z "${API_MO_BASE:-}" ] \
  && [ -z "${API_PRINT_BASE:-}" ] \
  && [ -z "${PRODUCT_STATUS_OK_UID:-}" ] \
  && [ -z "${PRODUCT_STATUS_KO_UID:-}" ] \
  && [ -z "${MACHINE_UID:-}" ]; then
  echo "No runtime config environment override detected, keeping existing config"
  exit 0
fi

export API_TEST_GSM_BASE="${API_TEST_GSM_BASE:-/gsm-api}"
export API_DATA_BASE="${API_DATA_BASE:-/data-api}"
export API_MO_BASE="${API_MO_BASE:-/mo-api}"
export API_PRINT_BASE="${API_PRINT_BASE:-/print-api}"
export PRODUCT_STATUS_OK_UID="${PRODUCT_STATUS_OK_UID:-OK}"
export PRODUCT_STATUS_KO_UID="${PRODUCT_STATUS_KO_UID:-NOK}"
export MACHINE_UID="${MACHINE_UID:-MO03A}"
export API_STATUS_POLL_INTERVAL_MS="${API_STATUS_POLL_INTERVAL_MS:-10000}"
export API_STATUS_TIMEOUT_MS="${API_STATUS_TIMEOUT_MS:-4000}"
export API_STATUS_DEBUG="${API_STATUS_DEBUG:-false}"
export LOG_LEVEL="${LOG_LEVEL:-warn}"
export HTTP_LOGGING="${HTTP_LOGGING:-false}"

envsubst < "$TEMPLATE_FILE" > "$CONFIG_FILE"
echo "Runtime config generated from container environment"
