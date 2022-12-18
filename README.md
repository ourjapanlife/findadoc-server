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
<details>
  <summary>Click to expand</summary>

1. Run `yarn dev` to start the local server
2. Run `yarn generate` to generate the types locally
3. Open your browser to http://localhost:3000/
4. Navigate to the Explorer section from the menu in the left pane.
5. Click `query: Query` under "Root Types
6. Click the `+` button to see the fields a **type** has that can be added to the query
![image](./assets/add-to-query.png)

7. Select the desired fields and they'll automatically get added to the query builder
![image](./assets/query-builder.png)

8. If you select a type that requires an ID (such as `Facility` or `HealthcareProfessional`) then add the ID in the "Variables" window at the bottom *as a string*. 

![image](./assets/query-by-id.png)

</details>
