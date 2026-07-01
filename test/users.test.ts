import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../src/app";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER = {
  nama: "Register User",
  email: "test-register@example.com",
  password: "rahasia123",
};

beforeEach(async () => {
  await db.delete(sessions);
  await db.delete(users);
});

describe("POST /api/users", () => {
  it("should return 200 and create a new user", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_USER),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: "ok" });

    const createdUser = await db
      .select()
      .from(users)
      .where(eq(users.email, TEST_USER.email))
      .limit(1);

    expect(createdUser.length).toBe(1);
    expect(createdUser[0]!.nama).toBe(TEST_USER.nama);
    expect(createdUser[0]!.email).toBe(TEST_USER.email);
    expect(createdUser[0]!.password).not.toBe(TEST_USER.password);
  });

  it("should return 409 when email is already used", async () => {
    await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_USER),
      })
    );

    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TEST_USER),
      })
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toEqual({ error: "email telah digunakan" });
  });

  it("should return 422 when nama is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("should return 422 when email is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: TEST_USER.nama,
          password: TEST_USER.password,
        }),
      })
    );

    expect(res.status).toBe(422);
  });

  it("should return 422 when password is missing", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: TEST_USER.nama,
          email: TEST_USER.email,
        }),
      })
    );

    expect(res.status).toBe(422);
  });
});
