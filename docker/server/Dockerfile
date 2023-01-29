FROM node:18.12.1

# Create app directore
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./

# Yarn Berry
RUN mkdir -p ./.yarn/global/cache
RUN mkdir -p ./.yarn/releases
RUN corepack enable
RUN yarn set version stable

# Follow the lockfile, error on cache modify, ensure checksums match
RUN yarn install --immutable --immutable-cache --check-cache

# Prisma
RUN yarn prisma generate

# Bundle app source
COPY . .

# GraphQL types
RUN yarn generate

EXPOSE 3001

CMD [ "yarn ts-node", "src/index.ts" ]
