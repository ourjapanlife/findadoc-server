FROM node:18

WORKDIR /usr/src/app

# Build it
COPY package.json ./
COPY yarn.lock ./

RUN npm install --global yarn 
RUN yarn install
RUN yarn build
