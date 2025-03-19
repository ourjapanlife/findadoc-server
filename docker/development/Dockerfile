FROM node:22.5.1

# Create app directore
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./

# Yarn
RUN mkdir -p ./.yarn/releases
COPY .yarn/releases/yarn-*.cjs .yarn/releases/.
RUN corepack enable

# Install yarn dependencies
RUN yarn install --immutable --frozen-lockfile

# Copy app source code
COPY . .

# Run 
EXPOSE 4500

CMD [ "yarn", "dev" ]
