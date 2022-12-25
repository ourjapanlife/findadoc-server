#!/bin/bash
set -e

echo "Running init-user-db"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE USER postgres;
    CREATE DATABASE findadoc;
    CREATE DATABASE shadow;
    GRANT ALL PRIVILEGES ON DATABASE findadoc TO postgres;
    GRANT ALL PRIVILEGES ON DATABASE shadow TO postgres;
EOSQL