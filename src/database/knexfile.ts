interface DBConn {
  client: string;
  connection: {
    host: string | undefined;
    port: number;
    user: string | undefined;
    password: string | undefined;
    database: string | undefined;
  };
  searchPath: string[];
  debug?: boolean;
}

const development: DBConn = {
  client: "pg",
  connection: {
    host: process.env.POSTGRES_HOST,
    port: 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  searchPath: ["knex", "public"],
  debug: true,
};
const production: DBConn = {
  client: "pg",
  connection: {
    host: process.env.POSTGRES_HOST,
    port: 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  },
  searchPath: ["knex", "public"],
};

export default { production, development };
