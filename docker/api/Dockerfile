FROM node:21.3.0

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

# Install yarn dependencies
RUN yarn install --immutable --frozen-lockfile

# Copy app source code
COPY . .

# Build
RUN yarn prod:build


# Run 
EXPOSE 4000

CMD [ "yarn", "prod:startserver" ]
