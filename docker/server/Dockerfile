FROM node:18.15.0

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

# Bundle app source
COPY . .

# GraphQL types
RUN yarn generate

EXPOSE 3001

CMD [ "yarn", "prod" ]
