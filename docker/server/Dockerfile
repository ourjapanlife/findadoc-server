FROM node:18.12.1

# Create app directore
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY yarn.lock ./

# install ts-node
RUN npm install -g ts-node

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
