#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROXY_DIR="${PROXY_DIR:-${PROJECT_ROOT}/infra/shardingsphere/proxy}"
JAVA_BIN="${JAVA_BIN:-java}"

if [[ ! -d "${PROXY_DIR}/lib" || ! -d "${PROXY_DIR}/conf" ]]; then
  echo "未找到 ShardingSphere-Proxy：${PROXY_DIR}" >&2
  exit 1
fi

exec "${JAVA_BIN}" \
  -Djava.awt.headless=true \
  -server \
  -Xms512m \
  -Xmx1g \
  -Xmn256m \
  -Xss1m \
  -XX:AutoBoxCacheMax=4096 \
  -XX:+DisableExplicitGC \
  -Dio.netty.leakDetection.level=DISABLED \
  -classpath "${PROXY_DIR}/conf:${PROXY_DIR}:${PROXY_DIR}/lib/*:${PROXY_DIR}/ext-lib/*" \
  org.apache.shardingsphere.proxy.Bootstrap \
  -1 "${PROXY_DIR}/conf" 0.0.0.0 false
