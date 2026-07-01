import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";
import { randomUUID } from "node:crypto";

interface CreateUserInput {
  nama: string;
  email: string;
  password: string;
}

interface LoginUserInput {
  email: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<void> {
  const { nama, email, password } = input;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("email telah digunakan");
  }

  const hashedPassword = await Bun.password.hash(password);

  await db.insert(users).values({
    nama,
    email,
    password: hashedPassword,
  });
}

export async function loginUser(input: LoginUserInput): Promise<string> {
  const { email, password } = input;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length === 0) {
    throw new Error("email salah");
  }

  const user = existingUser[0]!;
  const isPasswordValid = await Bun.password.verify(password, user.password);

  if (!isPasswordValid) {
    throw new Error("email salah");
  }

  const token = randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
}

export async function getCurrentUser(token: string): Promise<{
  email: string;
  createdAt: Date;
}> {
  const sessionResult = await db
    .select({
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (sessionResult.length === 0) {
    throw new Error("unauthorized");
  }

  return sessionResult[0]!;
}
