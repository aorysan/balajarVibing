# Hello World Proyek (Bun + ElysiaJS + Drizzle + PostgreSQL)

Proyek ini adalah contoh inisialisasi dasar menggunakan **Bun** sebagai runtime dan package manager, **ElysiaJS** sebagai web framework, **Drizzle ORM** untuk pemetaan database, dan **PostgreSQL** sebagai database.

## Prasyarat
- [Bun](https://bun.sh/) terinstal di sistem Anda.

## Persiapan Proyek

### 1. Instalasi Dependensi
Jalankan perintah berikut untuk menginstal semua dependensi proyek:
```bash
bun install
```

### 2. Konfigurasi Database (Environment Variables)
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Buka file `.env` dan sesuaikan nilai variabel `DATABASE_URL` dengan kredensial PostgreSQL Anda:
```env
DATABASE_URL=postgres://username:password@host:port/database_name
PORT=3000
```

### 3. Migrasi Database
Untuk memigrasikan perubahan skema database langsung ke database PostgreSQL (menggunakan fitur push Drizzle Kit):
```bash
bun run db:migrate
```
Atau jika Anda ingin men-generate file migrasi SQL terlebih dahulu:
```bash
bun run db:generate
```

## Cara Menjalankan

Jalankan development server dengan mengaktifkan hot-reloading:
```bash
bun run dev
```

Server akan aktif dan berjalan di `http://localhost:3000`.

## Endpoint yang Tersedia

1. **`GET /`**
   - Mengembalikan respons sederhana `"Hello World"`.
2. **`GET /db-check`**
   - Memvalidasi koneksi ke database PostgreSQL Anda secara dinamis.
