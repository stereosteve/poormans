import { ShapeStream } from "@electric-sql/client";
import postgres from "postgres";

const sql = postgres({
  port: 50111,
  user: "postgres",
  password: "example",
});

await sql`
create table if not exists tasks (
  id serial primary key,
  queued_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  status text,
  input jsonb,
  output jsonb
);
`;

// Passes subscribers rows as they're inserted, updated, or deleted
const stream = new ShapeStream({
  url: `http://localhost:50112/v1/shape`,
  params: {
    table: `tasks`,
    where: `status = $1`,
    params: ["queued"],
    replica: "full",
  },
});

stream.subscribe((messages) => {
  console.log(messages);
  console.log(stream.shapeHandle, stream.lastOffset);
});

await sql`insert into tasks (status) values ('queued')`;
console.log("queued");

await new Promise((r) => setTimeout(r, 1000));

await sql`update tasks set status = 'done'`;
console.log("done");
