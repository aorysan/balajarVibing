import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

interface CreateUserInput {
  nama: string;
  email: string;
  password: string;
}

export async function createUser(input: CreateUserInput): Promise<void> {
  const { nama, email, password } = input;

  // Cek apakah email sudah digunakan
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("email telah digunakan");
  }

  // Hash password menggunakan bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user baru ke database
  await db.insert(users).values({
    nama,
    email,
    password: hashedPassword,
  });
}
