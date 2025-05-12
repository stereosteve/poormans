import postgres from "postgres";

export const sql = postgres({
  port: 50111,
  user: "postgres",
  password: "example",
});
