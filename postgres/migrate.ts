import postgres, { type PendingQuery, type Row } from "postgres";

const sql = postgres({
  port: 50111,
  user: "postgres",
  password: "example",
});

const steps = [
  sql`create table if not exists dogs (
    "name" text primary key,
    "breed" text,
    "good_dog" boolean
  )`,
  sql`create table if not exists cats (
    "name" text primary key,
    "breed" text,
    "good_cat" boolean
  )`,
];

async function migrate(steps: PendingQuery<Row[]>[]) {
  await sql`
  create table if not exists pmigrate (
    raw text primary key,
    file_name text,
    ran_at timestamptz default now()
  )
  `;

  for (const step of steps) {
    const { string: raw } = await step.describe();
    const [exists] = await sql`select ran_at from pmigrate where raw = ${raw}`;
    if (!exists) {
      console.log("running", raw);
      await sql.begin(async (tx) => {
        await tx.unsafe(raw);
        await tx`insert into pmigrate values (${raw}, null, now())`;
      });
    } else {
      console.log("already ran", exists.ran_at, raw);
    }
  }
}

await sql`drop table if exists dogs`;
await sql`drop table if exists cats`;
await migrate(steps);
await sql.end();
