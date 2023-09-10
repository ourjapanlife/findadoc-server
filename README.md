[![All Contributors](https://img.shields.io/github/all-contributors/ourjapanlife/findadoc-server?color=ee8449&style=for-the-badge)](#contributors)

# Find a Doc, Japan - Server

## Back-end Repository

Welcome to the back-end repository for Find a Doc, Japan! We're not currently looking for contributors in this particular repo, but you're free to have a look around. If you want to provide any suggestions or feedback, come have a chat with us in the [#backend-team channel on Slack](https://join.slack.com/t/find-a-doc/shared_invite/zt-s4744a6o-MGaGHzLN5wB9aXeha3vdsQ)!

### How to contribute

We love and welcome contributions to our front-end repository which can be found [here](https://github.com/ourjapanlife/findadoc-web)!

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.annkilzer.net/"><img src="https://avatars.githubusercontent.com/u/4602369?v=4?s=100" width="100px;" alt="Ann Kilzer キルザー杏"/><br /><sub><b>Ann Kilzer キルザー杏</b></sub></a><br /><a href="https://github.com/ourjapanlife/findadoc-server/commits?author=ann-kilzer" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/theyokohamalife"><img src="https://avatars.githubusercontent.com/u/31802656?v=4?s=100" width="100px;" alt="LaShawn Toyoda"/><br /><sub><b>LaShawn Toyoda</b></sub></a><br /><a href="https://github.com/ourjapanlife/findadoc-server/commits?author=theyokohamalife" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ermish"><img src="https://avatars.githubusercontent.com/u/4411499?v=4?s=100" width="100px;" alt="Philip Ermish"/><br /><sub><b>Philip Ermish</b></sub></a><br /><a href="https://github.com/ourjapanlife/findadoc-server/commits?author=ermish" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/RageZBla"><img src="https://avatars.githubusercontent.com/u/1196871?v=4?s=100" width="100px;" alt="Olivier Lechevalier"/><br /><sub><b>Olivier Lechevalier</b></sub></a><br /><a href="https://github.com/ourjapanlife/findadoc-server/commits?author=RageZBla" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/evan-desu"><img src="https://avatars.githubusercontent.com/u/86333067?v=4?s=100" width="100px;" alt="Evan Peterson"/><br /><sub><b>Evan Peterson</b></sub></a><br /><a href="https://github.com/ourjapanlife/findadoc-server/commits?author=evan-desu" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Anissa3005"><img src="https://avatars.githubusercontent.com/u/114712265?v=4?s=100" width="100px;" alt="Anissa Chadouli"/><br /><sub><b>Anissa Chadouli</b></sub></a><br /><a href="https://github.com/ourjapanlife/findadoc-server/commits?author=Anissa3005" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## Prerequisites

-   [Node](https://nodejs.org)
    -   We recommend using [nvm](https://github.com/nvm-sh/nvm) and running `nvm use` in this directory to sync with the project's Node version. However, if you wish to install Node your own way and ensure a consistent version with `.nvmrc`, that's fine too
-   [Yarn Berry](https://yarnpkg.com/getting-started/install)
-   [Docker Desktop](https://www.docker.com/products/docker-desktop/)

# Setup

## 1. Install dependencies

```sh
yarn
```

## 2. Set up Husky Hooks 🐕️

This will automatically run linting before commits and reduce common contributor mistakes.

```sh
yarn prepare
```

## 3. Setting up the Database 🐘

For simplicity, we use firebase!

For security, we run a local database so we don't break production!

(optional) You can point to different database environments simply by changing the firebase url and variables in the `.env.dev` file.

### 3.a Setup Firebase CLI

#### a.1 Install the Firebase CLI if you do not have it installed on your machine:

```sh
npm -g i firebase-tools
```

#### a.2 Install Java

on a mac, we recommend using [homebrew](https://brew.sh/)

```sh
brew install java
```

on a windows pc, we recommend using [chocolatey](https://chocolatey.org/)

```sh
choco install java
```

#### a.3 Log into Firebase CLI:

```sh
firebase login
```

#### a.4 Set the CLI to use the project:

```sh
firebase use --add
```

Select "Use an existing project"

### 3.b Running the database locally

```sh
yarn dev:startlocaldb
```

### 3.c Starting the dev server and seeding the emulator

```sh
yarn dev
```

This will run until you shut down the instance hitting `ctrl^+C`

### (Optional) Connecting to Production database

#### Setting Up Firebase Service Account

To set up the Firebase Service Account for this project, follow these steps:

1. Visit [Firebase console](https://console.firebase.google.com/project/find-a-doc-japan/overview).
2. Under "Project Overview", click on "Project Settings".
3. Navigate to the "Service Accounts" tab.
4. Click the "Generate new private key" button. Ensure that Node.js is selected.
5. Download the JSON file and add it to the root directory of this project. Rename the file to `firebaseServiceAccountKey.json`.
6. In your `.env` file, create an environment variable called `SERVICE_ACCOUNT_PATH` with the value `./firebaseServiceAccountKey.json`.

## 4. Run the API

```sh
yarn dev
```

That's it!

### (Optional) Running in production mode

In production, we use docker to run the app. You can validate your code works in production by running
Make sure that you have docker running beforehand.

```sh
yarn prod:build
yarn prod
```

# How to Debug your code

This runs locally and can easily be debugged with vscode!
Click on the `Run and Debug` vscode tab, and then choose `Javascript Debug Terminal`, then run `yarn dev` in there and the debugger will automatically connect.
Then, just add breakpoints by clicking on the line number of your code.

# How to Test your code

<details>
  <summary> Testing with Jest </summary>
  
  1. To run Jest directly from the CLI, install it globally with the following:
  
  ```sh
  npm install jest --global
  ```

2. Start the Docker container:

```sh
yarn test:dockerstart
```

3. Run the tests:

```sh
yarn test
```

</details>

<details>
  <summary>Testing GraphQL</summary>

1. Run `yarn generate` to generate the types locally
2. Run `yarn dev` to start the local server
3. Open your browser to <http://localhost:3001/>
4. Navigate to the Explorer section from the menu in the left pane.
5. Click `query: Query` under "Root Types
   ![image](./docs/root-types.png)
6. Click the `+` button to see the fields a **type** has that can be added to the query
   ![image](./docs/add-to-query.png)

7. Select the desired fields and they'll automatically get added to the query builder
   ![image](./docs/query-builder.png)

8. If you select a type that requires an ID (such as `Facility` or `HealthcareProfessional`) then add the ID in the "Variables" window at the bottom _as a string_.

![image](./docs/query-by-id.png)

9. If you'd like to share the query you built, such as demonstrating how you tested your code, check out [Apollo Explorer's sharing features](https://www.apollographql.com/blog/announcement/platform/save-and-share-your-graphql-operations-in-apollo-explorer/#sharing-a-collection).

</details>
