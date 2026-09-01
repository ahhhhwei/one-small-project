#!/usr/bin/env bash
set -euo pipefail

OPEN_GAUSS_CLIENT=/usr/local/opengauss/bin/gsql
export LD_LIBRARY_PATH=/usr/local/opengauss/lib

connection=(
    "${OPEN_GAUSS_CLIENT}"
    -h opengauss
    -p 5432
    -U gaussdb
    -W "${OPENGAUSS_PASSWORD}"
)

until "${connection[@]}" -d postgres -At -c 'SELECT 1;' >/dev/null 2>&1; do
    echo "waiting for openGauss"
    sleep 2
done

database_exists="$(
    "${connection[@]}" -d postgres -At \
        -c "SELECT 1 FROM pg_database WHERE datname = 'wenjw_db1';"
)"

if [[ "${database_exists}" != "1" ]]; then
    "${connection[@]}" -d postgres -c 'CREATE DATABASE wenjw_db1 OWNER gaussdb;'
fi

"${connection[@]}" -d wenjw_db1 -f /docker-init/init.sql
