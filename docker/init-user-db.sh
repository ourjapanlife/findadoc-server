#!/bin/sh

# load env variables
source ./.env

echo "😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃😃"

psql $POSTGRES_USER << EOF
CREATE DATABASE IF NOT EXISTS $POSTGRES_DB;
CREATE DATABASE IF NOT EXISTS $SHADOW_DB;
GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO postgres;
GRANT ALL PRIVILEGES ON DATABASE $SHADOW_DB TO postgres;
EOF