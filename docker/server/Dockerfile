FROM node:18.12.1

# Create app directore
WORKDIR /usr/src/app

# test
RUN pwd

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN yarn install
# TODO flags for production build

# Bundle app source
COPY . .

EXPOSE 8080


CMD [ "node", "src/index.ts" ]
