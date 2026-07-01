import { describe, expect, it, beforeAll } from "bun:test";
import { app } from "../app";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

const TEST_USER = {
  nama: "Test User",
  email: "test-login@example.com",
  password: "rahasia123",
};

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
});

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

    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(typeof body.data).toBe("string");

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(body.data).toMatch(uuidRegex);

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, body.data))
      .limit(1);

    expect(session.length).toBe(1);
    expect(session[0]!.token).toBe(body.data);
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

    const body = await res.json();
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

    const body = await res.json();
    expect(body).toEqual({ error: "email salah" });
  });

  it("should return 422 when body is invalid (missing email)", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: TEST_USER.password }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("should return 422 when body is invalid (missing password)", async () => {
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
