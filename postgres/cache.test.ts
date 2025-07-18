import { describe, it, expect } from "bun:test";
import { createCache } from "./cache";
import { isolatedTestDb } from "./testdb";

describe("cache", () => {
  it("should store and retrieve a value", async () => {
    await isolatedTestDb(async (sql) => {
      const cache = await createCache(sql, "values");

      expect(await cache.get("foo")).toBeUndefined();

      // set + get
      {
        await cache.set("foo", 42);
        const val = await cache.get("foo");
        expect(val).toBe(42);
      }

      // ageOf
      const t0 = await cache.ageOf("foo");
      expect(t0).toBeDefined();

      // update
      {
        await cache.set("foo", 43);
        let val = await cache.get<number>("foo");
        expect(val).toBe(43);
      }

      // ageOf gets updated
      const t1 = await cache.ageOf("foo");
      expect(t1! > t0!).toBeTrue();

      // set a different key
      {
        await cache.set("bar", {
          fun: "times",
          numbers: [1, 2, 3],
          wow: undefined,
        });
        const val = await cache.get("bar");
        expect(val).toEqual({
          fun: "times",
          numbers: [1, 2, 3],
        });
      }

      // get all
      {
        const all = await cache.all();
        expect(all.length).toBe(2);
      }

      // delete
      await cache.delete("foo");
      expect(await cache.get("foo")).toBeUndefined();
    });
  });
});
