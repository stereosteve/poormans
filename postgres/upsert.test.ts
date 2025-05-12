import { pgUpsert } from "./upsert";
import { sql } from "./sql";
import { expect, test } from "bun:test";
import postgres from "postgres";

// inspired by:
// https://github.com/peterldowns/pgtestdb
// todo: let user specify template db
//       or maybe create test template db using some migrator,
//       similar to pgtestdb
async function isolatedTestDb(cb: (sql: postgres.Sql) => Promise<unknown>) {
  const conn = {
    port: 50111,
    user: "postgres",
    password: "example",
  };
  const parent = postgres(conn);

  const dbName = `testdb_${Math.random().toString(36).substring(2, 8)}`;
  console.log(dbName);
  await parent`CREATE DATABASE ${sql(dbName)}`;

  const child = postgres({ ...conn, database: dbName });
  await cb(child);
  await child.end();

  await parent`DROP DATABASE ${sql(dbName)}`;
}

test("basic upsert", async () => {
  await isolatedTestDb(async (sql) => {
    await sql`create table users (id integer primary key, name text, email text)`;

    await pgUpsert(sql, "users", "id", {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    });
    let [u] = await sql`select * from users`;
    expect(u!.name).toBe("John Doe");

    await pgUpsert(sql, "users", "id", { id: 1, name: "Jane Doe" });
    [u] = await sql`select * from users`;
    expect(u!.id).toBe(1);
    expect(u!.name).toBe("Jane Doe");
    expect(u!.email).toBe("john@example.com");

    // with a undefined value
    await pgUpsert(sql, "users", "id", {
      id: 2,
      name: "u2",
      email: undefined,
    });

    [u] = await sql`select * from users where id = 2`;
    expect(u).toMatchObject({
      id: 2,
      name: "u2",
      email: null,
    });

    // you can null out a field using null
    await pgUpsert(sql, "users", "id", {
      id: 2,
      name: null,
      email: "fun@times.com",
    });

    [u] = await sql`select * from users where id = 2`;
    expect(u).toMatchObject({
      id: 2,
      name: null,
      email: "fun@times.com",
    });

    // but undefined is ignored
    await pgUpsert(sql, "users", "id", {
      id: 2,
      name: null,
      email: undefined,
    });

    [u] = await sql`select * from users where id = 2`;
    expect(u).toMatchObject({
      id: 2,
      name: null,
      email: "fun@times.com",
    });
  });
});

test("upsert compound key", async () => {
  await isolatedTestDb(async (sql) => {
    await sql`create table pairs (
      a text,
      b text,
      score integer,
      primary key(a, b)
    )`;

    await sql`insert into pairs ${sql({
      a: "blue",
      b: "green",
      score: 22,
    })}`;

    const [pair] = await sql`select * from pairs`;
    expect(pair!.score).toBe(22);

    await pgUpsert(sql, "pairs", ["a", "b"], {
      a: "blue",
      b: "green",
      score: 33,
    });

    const [after] = await sql`select * from pairs`;
    expect(after!.score).toBe(33);

    // upsert multiple
    await pgUpsert(
      sql,
      "pairs",
      ["a", "b"],
      [
        {
          a: "blue",
          b: "green",
          score: 44,
        },
        {
          a: "red",
          b: "blue",
          score: 123,
        },
      ],
    );

    const [blueGreen, redBlue] = await sql`select * from pairs order by score`;
    expect(blueGreen!.score).toBe(44);
    expect(redBlue!.score).toBe(123);
  });
});

// test('upsert multiple', async() => {
//   await isolatedTestDb(async (sql) => {

//   })
// })
