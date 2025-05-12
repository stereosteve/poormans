import type postgres from "postgres";

// inspired by: https://github.com/porsager/postgres/issues/88#issuecomment-1162270739
export async function pgUpsert(
  sql: postgres.Sql,
  table: string,
  pkField: string | string[],
  inp: Record<string, unknown> | Array<Record<string, unknown>>,
) {
  let data = Array.isArray(inp) ? inp : [inp];
  data = data.map(omitUndefined);
  await sql`
    INSERT INTO ${sql(table)} ${sql(data)}
    ON CONFLICT (${sql(pkField)}) DO UPDATE
    SET ${Object.keys(data[0]!).map(
      (x, i) => sql`${i ? sql`,` : sql``}${sql(x)} = excluded.${sql(x)}`,
    )}
  `;
}

function omitUndefined(obj: Record<string, unknown>) {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries);
}
