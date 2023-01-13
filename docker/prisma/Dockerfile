# Stage 2: Seed data
FROM node:18.12.1-alpine as seed-data

WORKDIR /target

COPY . .

RUN yarn install
RUN yarn migrate
RUN yarn prisma db seed