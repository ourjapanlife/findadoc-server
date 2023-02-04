FROM node:18.12.1

# ARGS
ARG pgUser=postgres
ARG pgPassword
ARG pgHost=database
ARG pgPort=5432
ARG dbName=findadoc

# Env variables
ENV DATABASE_URL="postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${dbName}?schema=public"

# Create app directore
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./

# Yarn Berry
RUN mkdir -p ./.yarn/releases
COPY .yarn/releases/yarn-*.cjs .yarn/releases/.
RUN corepack enable

# Follow the lockfile
RUN yarn install --immutable

# Prisma
RUN yarn prisma generate

# Bundle app source
COPY . .

# GraphQL types
RUN yarn generate

EXPOSE 3001

CMD [ "yarn", "prod" ]
