#!/bin/sh

dbuser="postgres"
dbname="findadoc"
shadow="shadow"

psql $dbuser << EOF
CREATE DATABASE $dbname;
CREATE DATABASE $shadow;
GRANT ALL PRIVILEGES ON DATABASE $dbname TO postgres;
GRANT ALL PRIVILEGES ON DATABASE $shadow TO postgres;
EOF