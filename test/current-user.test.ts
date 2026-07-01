import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER = {
  nama: "Current User Test",
  email: "test-current@example.com",
  password: "secret123",
};

let validToken: string = "";

beforeEach(async () => {
  await db.delete(sessions);
  await db.delete(users);

  await app.handle(
    new Request("http://localhost/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    })
  );

  const loginRes = await app.handle(
    new Request("http://localhost/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    })
  );

  const body = (await loginRes.json()) as { data: string };
  validToken = body.data;
});

interface CurrentUserResponse {
  data?: {
    email: string;
    createdAt: string;
  };
  error?: string;
}

describe("GET /api/users/current", () => {
  it("should return 200 and user data with valid token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        headers: { Authorization: `Bearer ${validToken}` },
      })
    );

    expect(res.status).toBe(200);

    const body = (await res.json()) as CurrentUserResponse;
    expect(body.data).toBeDefined();
    expect(body.data!.email).toBe(TEST_USER.email);
    expect(body.data!.createdAt).toBeDefined();
  });

  it("should return 401 without Authorization header", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current")
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as CurrentUserResponse;
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should return 401 with malformed Authorization header (no Bearer)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        headers: { Authorization: `Token ${validToken}` },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as CurrentUserResponse;
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should return 401 with empty Bearer token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        headers: { Authorization: "Bearer " },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as CurrentUserResponse;
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should return 401 with invalid token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        headers: { Authorization: `Bearer invalid-token-123` },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as CurrentUserResponse;
    expect(body).toEqual({ error: "unauthorized" });
  });
});
