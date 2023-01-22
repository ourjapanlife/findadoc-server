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
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

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

3. Init Prisma 💠
```sh
yarn prisma generate
```

### Database Setup 🐘

For simplicity we provide a dockerized postgres. As a prerequisite, you will need to install 
[Docker Desktop](https://www.docker.com/products/docker-desktop/).


1. Set up `env` variables

```sh
cp .env.sample .env
```

Edit the .env file and set the database password

⚠️ DO NOT CHECK IN PASSWORDS OR ENV FILES INTO GITHUB. ALL SECRETS SHOULD BE MANAGED VIA GITHUB SECRETS OR SECURE VAULTS

2. Run docker compose
```sh
docker compose up
```

### Database and ORM commands

Re-run migrations with `yarn prisma migrate dev`

Create a new migration by:
1. Editing schema.prisma and save
2. Run `yarn prisma migrate  dev --name snake_case_title`
3. Before running the backend, regenerate the Prisma Client with `yarn prisma generate`

### Note about migration files

Migration files should never edited after merging to `main` in order to keep an accurate database history. If you want
to make a change to the database schema, make a new migration:

1. Edit `prisma/prisma.schema`
2. Run `yarn prisma migrate dev --name [description_of_changes]`
3. Check in the prisma changes as well as the new migration file

Read more about migrations here: https://www.prisma.io/docs/concepts/components/prisma-migrate

## How to Test

<details>
  <summary>Testing GraphQL</summary>

1. Run `yarn dev` to start the local server
2. Run `yarn generate` to generate the types locally
3. Open your browser to http://localhost:3001/
4. Navigate to the Explorer section from the menu in the left pane.
5. Click `query: Query` under "Root Types
6. Click the `+` button to see the fields a **type** has that can be added to the query
   ![image](./assets/add-to-query.png)

7. Select the desired fields and they'll automatically get added to the query builder
   ![image](./assets/query-builder.png)

8. If you select a type that requires an ID (such as `Facility` or `HealthcareProfessional`) then add the ID in the "Variables" window at the bottom _as a string_.

![image](./assets/query-by-id.png)

9. If you'd like to share the query you built, such as demonstrating how you tested your code, check out [Apollo Explorer's sharing features](https://www.apollographql.com/blog/announcement/platform/save-and-share-your-graphql-operations-in-apollo-explorer/#sharing-a-collection).

</details>

<details>
  <summary>Testing Prisma and Postgres</summary>

0. Make sure you have your database set up and the migrations run (See Database Setup above)

1. Run Prisma Studio with `yarn prisma studio`
2. Go to http://localhost:5555
3. Click on the table you'd like to inspect. You should be able to view and even modify the database through this interface, kind 
of like in a spreadsheet. You can open many tabs for various tables and preview your changes before saving them


For more details on how to use this tool, check out: https://www.prisma.io/docs/concepts/components/prisma-studio

</details>
