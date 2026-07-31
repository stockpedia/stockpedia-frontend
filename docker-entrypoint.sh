#!/bin/sh
set -e
: "${API_BASE_URL:=}"
cat > /usr/share/nginx/html/config.js <<CONF
window.__APP_CONFIG__ = { API_BASE_URL: "${API_BASE_URL}" };
CONF
echo "[entrypoint] config.js 생성 완료 (API_BASE_URL=${API_BASE_URL})"