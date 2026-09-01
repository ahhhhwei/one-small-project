#!/usr/bin/env bash
set -euo pipefail

: "${MYSQL_ROOT_PASSWORD:?MYSQL_ROOT_PASSWORD is required}"
: "${OPENGAUSS_PASSWORD:?OPENGAUSS_PASSWORD is required}"
: "${SHARDINGSPHERE_PASSWORD:?SHARDINGSPHERE_PASSWORD is required}"

template_variables='${MYSQL_ROOT_PASSWORD} ${OPENGAUSS_PASSWORD} ${SHARDINGSPHERE_PASSWORD}'
proxy_home=/opt/shardingsphere-proxy

envsubst "${template_variables}" \
    < /opt/course-config/config-docker.yaml.template \
    > "${proxy_home}/conf/config-wenjw.yaml"

envsubst "${template_variables}" \
    < /opt/course-config/server-docker.yaml.template \
    > "${proxy_home}/conf/server.yaml"

exec "${proxy_home}/bin/start.sh" "${PORT:-3307}" "${proxy_home}/conf"
