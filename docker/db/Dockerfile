
# This is the dockerfile for setting up postgres db. It is a multi-stage build

# Stage 1: Start up postgres db
FROM postgres:14-alpine as postgres-startup

ENV DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DOCKER_POSTGRES_HOST}:${DOCKER_INTERNAL_PORT}/${POSTGRES_DB}?schema=public
ENV SHADOW_DB_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DOCKER_POSTGRES_HOST}:${DOCKER_INTERNAL_PORT}/${SHADOW_DB}?schema=public

EXPOSE ${DOCKER_INTERNAL_PORT}

RUN echo "😃😃😃😃😃😃 DB SETUP TIME 😃😃😃😃😃"
COPY . ./docker/db-init.sh
COPY . ./docker/wait-for-it.sh
RUN chmod u+x ./docker/db-init.sh
RUN chmod u+x ./docker/wait-for-it.sh 127.0.0.1:5400 -- echo "postgres is running"

HEALTHCHECK --interval=2s --timeout=10s --start-period=2s --retries=3 CMD [ "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB2} || exit 1" ]




# # Stage 2: Seed data
# FROM node:18.12.1-alpine as seed-data
# # this seems to allow this stage to wait for postgres-startup to be finished first
# COPY --from=postgres-startup . ./  

# WORKDIR /target

# COPY . .

# RUN yarn install
# RUN yarn migrate
# RUN yarn prisma db seed