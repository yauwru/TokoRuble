# rubelindo

Website online penukaran mata uang IDR ⇌ RUB (`index.html`, pakai Firebase).

## TokoRuble Kios (offline / walk-in)

Sistem antrian untuk layanan tatap muka di toko fisik (seperti talonchik):

- `kios.html` — dibuka customer via scan QR code. Pilih layanan, isi data, dapat nomor antrian, status update otomatis.
- `admin-kios.html` — dashboard internal tim untuk melihat & melayani antrian secara real-time, atur rekening bank Rusia toko, dan cetak QR code.
- `api/` — Vercel Serverless Functions (backend kios, terpisah dari Firebase yang dipakai `index.html`).

### Deploy ke Vercel

1. Import repo ini ke Vercel (New Project → pilih repo `TokoRuble`). Framework preset: **Other**.
2. Tambahkan database **KV** (Storage tab di dashboard project → Create Database → pilih penyedia KV/Redis, mis. Upstash → hubungkan ke project ini). Vercel otomatis mengisi env var `KV_REST_API_URL` dan `KV_REST_API_TOKEN`.
3. Tambahkan Environment Variables berikut di Project Settings → Environment Variables:
   - `KIOS_ADMIN_PASSWORD` — password untuk login `admin-kios.html` (dipakai bersama oleh tim).
   - `SESSION_SECRET` — string acak panjang (mis. hasil `openssl rand -hex 32`), untuk menandatangani sesi login admin.
   - `TG_BOT_TOKEN`, `TG_CHAT_ID` — (opsional) supaya tim dapat notifikasi Telegram tiap ada antrian baru.
4. Deploy. Setelah live, buka `admin-kios.html`, login, lalu isi rekening bank Rusia toko & kurs kios di panel Pengaturan. Cetak QR code yang tersedia di sana dan tempel di konter.

### Catatan

- Data antrian (`offlineQueue`) di-reset otomatis tiap hari berdasarkan nomor urut (prefix `J` untuk transfer Rubel masuk, `B` untuk beli Rubel).
- Sinkronisasi papan admin & tiket customer menggunakan polling (refresh otomatis tiap 3 detik), bukan koneksi realtime.
