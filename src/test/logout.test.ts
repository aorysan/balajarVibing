import { describe, expect, it, beforeAll } from "bun:test";
import { app } from "../app";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const TEST_USER = {
  nama: "Logout Test",
  email: "test-logout@example.com",
  password: "secret123",
};

interface LogoutResponse {
  data?: string;
  error?: string;
}

let validToken: string = "";

beforeAll(async () => {
  await db.delete(sessions);
  await db.delete(users).where(eq(users.email, TEST_USER.email));

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

describe("GET /api/users/logout", () => {
  it("should return 200 and success message with valid token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        headers: { Authorization: `Bearer ${validToken}` },
      })
    );

    expect(res.status).toBe(200);

    const body = (await res.json()) as LogoutResponse;
    expect(body).toEqual({ data: "berhasil logout" });

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, validToken))
      .limit(1);

    expect(session.length).toBe(0);
  });

  it("should return 401 when using the same token after logout", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        headers: { Authorization: `Bearer ${validToken}` },
      })
    );

    expect(res.status).toBe(401);

    const body = (await res.json()) as LogoutResponse;
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should return 401 without Authorization header", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout")
    );

    expect(res.status).toBe(401);

    const body = (await res.json()) as LogoutResponse;
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should return 401 with malformed Authorization header", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        headers: { Authorization: `Token ${validToken}` },
      })
    );

    expect(res.status).toBe(401);

    const body = (await res.json()) as LogoutResponse;
    expect(body).toEqual({ error: "unauthorized" });
  });

  it("should return 401 with invalid token", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        headers: { Authorization: `Bearer ${randomUUID()}` },
      })
    );

    expect(res.status).toBe(401);

    const body = (await res.json()) as LogoutResponse;
    expect(body).toEqual({ error: "unauthorized" });
  });
});
