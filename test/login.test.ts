import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER = {
  nama: "Login User",
  email: "test-login@example.com",
  password: "rahasia123",
};

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
});

interface LoginResponse {
  data?: string;
  error?: string;
}

describe("POST /api/users/login", () => {
  it("should return 200 and a UUID token with correct credentials", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
        }),
      })
    );

    expect(res.status).toBe(200);

    const body = (await res.json()) as LoginResponse;
    expect(body).toHaveProperty("data");
    expect(typeof body.data).toBe("string");

    const token = body.data!;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(token).toMatch(uuidRegex);

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    expect(session.length).toBe(1);
    expect(session[0]!.token).toBe(token);
  });

  it("should return 401 when email is wrong", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "wrong@email.com",
          password: TEST_USER.password,
        }),
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as LoginResponse;
    expect(body).toEqual({ error: "email salah" });
  });

  it("should return 401 when password is wrong", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: "wrongpassword",
        }),
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as LoginResponse;
    expect(body).toEqual({ error: "email salah" });
  });

  it("should return 422 when email is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: TEST_USER.password }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("should return 422 when password is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: TEST_USER.email }),
      })
    );

    expect(res.status).toBe(422);
  });
});
