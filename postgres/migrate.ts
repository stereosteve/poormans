import postgres, { type PendingQuery, type Row } from "postgres";

export async function migrate(sql: postgres.Sql, steps: PendingQuery<Row[]>[]) {
  const [probe] =
    await sql`SELECT to_regclass('public.pmigrate') IS NOT NULL AS exists;`;
  if (!probe!.exists) {
    await sql`
    create table if not exists pmigrate (
      raw text primary key,
      file_name text,
      ran_at timestamptz default now()
    )
    `;
  }

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
