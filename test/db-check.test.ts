import { describe, it, expect } from "bun:test";
import { app } from "../src/app";

describe("GET /db-check", () => {
  it("should return 200 with success status when DB is reachable", async () => {
    const res = await app.handle(new Request("http://localhost/db-check"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status", "success");
    expect(body).toHaveProperty("message", "Database connection works");
  });
});
