#!/bin/sh
set -euo pipefail
echo "😃😃😃😃😃😃DB SETUP TIME😃😃😃😃😃"

echo $POSTGRES_DB


until PGPASSWORD=$POSTGRES_PASSWORD psql -h database -U $POSTGRES_USER -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done
  
>&2 echo "Postgres is up - executing command"

function create_database_if_not_exists() {
    local db="$1"
    PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -h database -tc "SELECT 1 FROM pg_database WHERE datname = '$db'" | grep -q 1 || \
    PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -h database << EOF
       CREATE DATABASE $db;
       GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;
EOF
}

create_database_if_not_exists $POSTGRES_DB
create_database_if_not_exists $SHADOW_DB
touch out/db-init-done
