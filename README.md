# findadoc-server

## Prerequisites

- Node 
  - We recommend using [nvm](https://github.com/nvm-sh/nvm) and running `nvm use` in this directory to sync with the project's Node version. However, if you wish to install Node your own way and ensure a consistent version with `.nvmrc`, that's fine too

## Setup

1. Install dependencies
```sh
yarn install
```
2. Set up Husky Hooks 🐕️
```sh
yarn prepare
```

## How to Test
1. Run `yarn dev`
2. Open your browser to http://localhost:3000/
3. Navigate to the Explorer section from the menu in the left pane.
4. Run the following query and confirm that you get a response with status code 200:
```
query Query {
  ok
}
```