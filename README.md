# balajarVibing

Proyek backend API untuk aplikasi vibing, dibangun dengan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **PostgreSQL**.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Runtime | [Bun](https://bun.sh/) |
| Web Framework | [ElysiaJS](https://elysiajs.com/) v1.4 |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) v0.45 |
| Database | PostgreSQL |
| Database Client | [postgres.js](https://github.com/porsager/postgres) v3.4 |
| Test Runner | Bun built-in (`bun test`) |

## Arsitektur

```
src/
├── index.ts              # Entry point — menjalankan server
├── app.ts                # Instance Elysia, registrasi route & middleware
├── db/
│   ├── index.ts          # Koneksi database (postgres.js + drizzle)
│   └── schema.ts         # Definisi tabel users & sessions
├── routes/
│   └── user.route.ts     # Route definitions untuk /api/users/*
├── services/
│   └── user.service.ts   # Business logic untuk user operations
└── utils/
    └── auth.ts           # Utility parsing Bearer token
```

**Alur request:**
1. Request masuk ke Elysia router
2. Route handler memanggil service layer
3. Service layer berinteraksi dengan database via Drizzle ORM
4. Response dikembalikan ke client

## Database Schema

### Table: `users`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `serial` | PRIMARY KEY |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `password` | `varchar(255)` | NOT NULL |
| `nama` | `varchar(255)` | NOT NULL |
| `created_at` | `timestamp` | DEFAULT NOW(), NOT NULL |

### Table: `sessions`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `serial` | PRIMARY KEY |
| `token` | `varchar(255)` | NOT NULL |
| `user_id` | `integer` | NOT NULL, FK → users.id |
| `created_at` | `timestamp` | DEFAULT NOW(), NOT NULL |

## API Endpoints

### `GET /`
Health check sederhana.

**Response:** `200` — `"Hello World"`

---

### `GET /db-check`
Memvalidasi koneksi database.

**Response:**
- `200` — `{ status: "success", message: "Database connection works", data: ... }`
- `500` — `{ status: "error", message: "Database connection failed", error: "..." }`

---

### `POST /api/users`
Mendaftarkan user baru.

**Request Body:**
```json
{
  "nama": "string (max 255)",
  "email": "string (max 255)",
  "password": "string (max 255)"
}
```

**Response:**
- `200` — `{ data: "ok" }`
- `409` — `{ error: "email telah digunakan" }`
- `422` — Validation error (body tidak sesuai)
- `500` — `{ error: "Terjadi kesalahan pada server" }`

---

### `POST /api/users/login`
Login dengan email & password. Mengembalikan UUID token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
- `200` — `{ data: "uuid-token" }`
- `401` — `{ error: "email salah" }`
- `422` — Validation error
- `500` — `{ error: "Terjadi kesalahan pada server" }`

---

### `GET /api/users/current`
Mendapatkan data user yang sedang login. Memerlukan header `Authorization: Bearer <token>`.

**Response:**
- `200` — `{ data: { email: "string", createdAt: "string" } }`
- `401` — `{ error: "unauthorized" }`
- `500` — `{ error: "Terjadi kesalahan pada server" }`

---

### `GET /api/users/logout`
Menghapus session (logout). Memerlukan header `Authorization: Bearer <token>`.

**Response:**
- `200` — `{ data: "berhasil logout" }`
- `401` — `{ error: "unauthorized" }`
- `500` — `{ error: "Terjadi kesalahan pada server" }`

## Cara Setup

### Prasyarat
- [Bun](https://bun.sh/) terinstal
- PostgreSQL running

### 1. Clone & Install
```bash
git clone https://github.com/aorysan/balajarVibing.git
cd balajarVibing
bun install
```

### 2. Konfigurasi Environment
```bash
cp .env.example .env
```
Sesuaikan `DATABASE_URL` di file `.env`:
```env
DATABASE_URL=postgres://username:password@host:port/database_name
PORT=3000
```

### 3. Migrasi Database
```bash
bun run db:migrate
```

Atau untuk generate file migrasi:
```bash
bun run db:generate
```

## Cara Menjalankan

```bash
bun run dev
```

Server akan berjalan di `http://localhost:3000`.

## Cara Testing

Semua test menggunakan `bun test` (test bawaan Bun). Setiap test menggunakan `beforeEach` untuk membersihkan data database agar tidak terjadi kebocoran state antar test.

```bash
bun test
```

Struktur file test:
```
test/
├── hello.test.ts          # GET /
├── db-check.test.ts       # GET /db-check
├── users.test.ts          # POST /api/users
├── login.test.ts          # POST /api/users/login
├── current-user.test.ts   # GET /api/users/current
└── logout.test.ts         # GET /api/users/logout
```

Cakupan test mencakup positive case (sukses) dan negative case (validasi error, unauthorized, conflict, dll.) serta assertion ke database untuk memverifikasi side-effect.
