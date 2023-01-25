FROM node:18.12.1

# Create app directore
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# install ts-node
RUN npm install -g ts-node

# TODO flags for production build
RUN yarn install

# Prisma
RUN yarn prisma generate

# Bundle app source
COPY . .

# GraphQL
RUN yarn generate

EXPOSE 3001

CMD [ "ts-node", "src/index.ts" ]
