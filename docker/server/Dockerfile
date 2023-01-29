FROM node:18.12.1

# Create app directore
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./

# Yarn Berry
RUN corepack enable
RUN yarn set version stable
RUN echo `yarn --version`

# install ts-node
RUN yarn dlx ts-node

# Follow the lockfile, error on cache modify, ensure checksums match
RUN yarn install --immutable --immutable-cache --check-cache

# Prisma
RUN yarn prisma generate

# Bundle app source
COPY . .

# GraphQL types
RUN yarn generate

EXPOSE 3001

CMD [ "ts-node", "src/index.ts" ]
