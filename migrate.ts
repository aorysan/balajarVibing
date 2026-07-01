import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/balajarvibing";
const sql = postgres(connectionString);

async function migrate() {
  console.log("🚀 Running migration...");
  
  try {
    const cols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `;
    
    if (cols.length > 0) {
      console.log("📋 Kolom yang ada sekarang:", cols.map((c: any) => c.column_name));
    } else {
      console.log("📋 Tabel users belum ada, akan dibuat...");
    }

    await sql`DROP TABLE IF EXISTS users CASCADE`;
    console.log("🗑️  Dropped old users table (if exists)");

    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log("✅ Tabel users berhasil dibuat dengan skema baru!");
    console.log("   Kolom: id, email, password, nama, created_at");

    await sql`DROP TABLE IF EXISTS sessions CASCADE`;
    console.log("🗑️  Dropped old sessions table (if exists)");

    await sql`
      CREATE TABLE sessions (
        id SERIAL PRIMARY KEY,
        token VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log("✅ Tabel sessions berhasil dibuat dengan skema baru!");
    console.log("   Kolom: id, token, user_id, created_at");

  } catch (err: any) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  } finally {
    await sql.end();
    console.log("🔌 Koneksi database ditutup.");
  }
}

migrate();
