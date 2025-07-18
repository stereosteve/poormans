import { pgUpsert } from "./upsert";
import { expect, test } from "bun:test";
import postgres from "postgres";
import { isolatedTestDb } from "./testdb";

test("jsonb", async () => {
  await isolatedTestDb(async (sql) => {
    await sql`create table stuff (rowid integer primary key, cells jsonb)`;

    const rowOne = {
      rowid: 1,
      cells: {
        first: "steve",
        last: "dave",
      },
    };

    await sql`insert into stuff ${sql(rowOne)}`;

    {
      const [got] = await sql`select * from stuff`;
      console.log(got);
    }

    const pathToSet = `{last}`;
    const newVal = "davie";
    await sql`
      update stuff
      set cells = jsonb_set(cells, ${pathToSet}, ${newVal})
      where rowid = 1
      `;

    {
      const [got] = await sql`select * from stuff`;
      console.log(got);
    }
  });
});
