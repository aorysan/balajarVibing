import { Elysia } from "elysia";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { userRoute } from "./routes/user.route";

export const app = new Elysia()
  .get("/", () => "Hello World")
  .get("/db-check", async ({ set }) => {
    try {
      const result = await db.execute(sql`SELECT 1 as connection_test`);
      return {
        status: "success",
        message: "Database connection works",
        data: result,
      };
    } catch (error: any) {
      set.status = 500;
      return {
        status: "error",
        message: "Database connection failed",
        error: error.message,
      };
    }
  })
  .use(userRoute);
