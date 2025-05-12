import { expect, test } from "bun:test";
import { isolatedTestDb } from "./testdb";
import { migrate } from "./migrate";

test("migrations", async () => {
  await isolatedTestDb(async (sql) => {
    await migrate(sql, [
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
    ]);

    {
      const cols = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'dogs'
        AND table_schema = 'public';
      `;
      expect(cols.length).toBe(3);
    }

    await migrate(sql, [
      sql`alter table dogs add column weight float`,
      sql`alter table cats add column is_indoor boolean default true`,
    ]);

    {
      const cols = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'dogs'
          AND table_schema = 'public';
        `;
      expect(cols.length).toBe(4);
    }

    for (let i = 0; i < 5; i++) {
      await migrate(sql, [
        sql`insert into dogs (name, good_dog) values ('ollie', true)`,
      ]);
    }

    {
      const dogs = await sql`select * from dogs`;
      expect(dogs.length).toBe(1);
    }
  });
});
