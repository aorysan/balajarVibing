import { describe, it, expect } from "bun:test";
import { app } from "../src/app";

describe("GET /", () => {
  it("should return 200 with Hello World", async () => {
    const res = await app.handle(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("Hello World");
  });
});
