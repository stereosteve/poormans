import type postgres from "postgres";

export async function createCache(sql: postgres.Sql, name: string) {
  const tableName = `cache_${name}`;

  await sql`
    create table if not exists ${sql(tableName)} (
      key varchar(255) primary key,
      value json,
      set_at timestamptz default now()
    )`;

  return {
    async get<T = unknown>(key: string): Promise<T | undefined> {
      const [got] = await sql`
      select value from ${sql(tableName)} where key = ${key}`;
      if (got) return got.value as T;
    },

    async set(key: string, value: any): Promise<void> {
      await sql`
        insert into ${sql(tableName)} (key, value)
        values (${key}, ${sql.json(value)})
        on conflict (key) do update set value = excluded.value, set_at = now()
      `;
    },

    async delete(key: string): Promise<void> {
      await sql`
        delete from ${sql(tableName)} where key = ${key}
      `;
    },

    async ageOf(key: string): Promise<Date | undefined> {
      const [got] = await sql`
        select set_at from ${sql(tableName)} where key = ${key}`;
      if (got) return got.set_at;
    },

    async all<T>() {
      const rows = await sql<
        {
          key: string;
          value: T;
          set_at: Date;
        }[]
      >`select * from ${sql(tableName)} order by key`;
      return rows;
    },
  };
}
