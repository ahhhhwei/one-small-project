#!/usr/bin/env bash
set -euo pipefail

if [[ "${SEED_DATA:-true}" != "true" ]]; then
    echo "sample data disabled"
    exit 0
fi

export MYSQL_PWD="${SHARDINGSPHERE_PASSWORD}"
mysql_args=(
    --protocol=tcp
    --connect-timeout=5
    --default-character-set=utf8mb4
    -h shardingsphere
    -P 3307
    -u root
    -D wenjw_db
)

until mysql "${mysql_args[@]}" -Nse 'SELECT 1;' >/dev/null 2>&1; do
    echo "waiting for ShardingSphere-Proxy"
    sleep 2
done

student_count="$(mysql "${mysql_args[@]}" -Nse 'SELECT COUNT(*) FROM wenjw_stu;')"

if [[ "${student_count}" =~ ^[0-9]+$ ]] && (( student_count > 0 )); then
    echo "sample data already exists (${student_count} students), skipping"
    exit 0
fi

# A previous interrupted import may have written broadcast data only.
mysql "${mysql_args[@]}" -e '
    DELETE FROM wenjw_sc;
    DELETE FROM wenjw_stu;
    DELETE FROM wenjw_cou;
'

mysql "${mysql_args[@]}" < /docker-seed/seed.sql
echo "sample data imported"
