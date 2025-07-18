import postgres from "postgres";

// inspired by:
// https://github.com/peterldowns/pgtestdb
// todo: let user specify template db
//       or maybe create test template db using some migrator,
//       similar to pgtestdb
export async function isolatedTestDb(
  cb: (sql: postgres.Sql) => Promise<unknown>
) {
  const conn = {
    port: 50111,
    user: "postgres",
    password: "example",
  };
  const parent = postgres(conn);

  const dbName = `testdb_${Math.random().toString(36).substring(2, 8)}`;
  console.log(dbName);
  await parent`CREATE DATABASE ${parent(dbName)}`;

  {
    const { user, host, port, pass } = parent.options as any;

    // console.log("HI", user, host, port, pass);

    const child = postgres({ user, host, port, pass, database: dbName });
    await cb(child);
    await child.end();

    await parent`DROP DATABASE ${parent(dbName)}`;
  }
}
