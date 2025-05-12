import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import postgres from "postgres";

const sql = postgres({
  port: 50111,
  user: "postgres",
  password: "example",
});

await sql`create table if not exists users (name text, age integer);`;

// Stream of users with the default tab delimitated cells and new-line delimitated rows
const userStream = Readable.from(["User\t68\n", "Walter\t80\n"]);

const query = await sql`copy users (name, age) from stdin`.writable();
await pipeline(userStream, query);

const rows = await sql`select * from users`;
console.log(rows);

await sql.end();
