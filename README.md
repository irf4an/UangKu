# UangKu — WhatsApp Financial Tracker & PWA Dashboard

Aplikasi pencatatan keuangan pribadi berbasis WhatsApp (Baileys) dengan Dashboard PWA modern (React, Tailwind CSS, Vite) dan fitur pemindaian struk otomatis berbasis Gemini Vision.

## Struktur Project

*   `backend/` (WA Bot & API Service SQLite)
*   `frontend/` (Dashboard PWA React)

## Cara Menjalankan Aplikasi

1. **Jalankan Bot & API Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *Scan QR Code WhatsApp yang muncul di terminal.*

2. **Jalankan PWA Dashboard:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 📱 Panduan Penggunaan Bot WhatsApp

Kirim pesan langsung ke nomor bot WhatsApp kamu dengan format bahasa sehari-hari. Bot mendukung deteksi otomatis rekening tujuan/sumber dan kategorisasi cerdas (NLP).

### 1. Mencatat Transaksi 💸
Secara default, bot menggunakan awalan `+` untuk Pemasukan dan `-` (atau tanpa awalan) untuk Pengeluaran.
*   **Pengeluaran:** `-50k makan siang` (atau cukup `50k makan siang`)
*   **Pemasukan:** `+10jt gaji bulanan`
*   **Pilih Rekening Spesifik:** Tambahkan nama bank/e-wallet di awal, tengah, atau dengan prefix `@`.
    *   `Beli kuota 150rb @BCA`
    *   `+500k dari teman ke Dana`
    *   `Mandiri 50k beli bensin`

*Bot sudah mengenali nama rekening seperti BCA, Mandiri, BRI, BNI, Jago, Dana, OVO, GoPay, Tunai, dll tanpa harus pakai @.*

### 2. Multi-Item (Batch Input) 🛒
Bisa mencatat banyak transaksi dalam satu pesan (pisahkan per baris atau langsung sejajar):
```text
Beli ayam 25k
Telur 15k
Beras 60k
```
Atau 1 baris: `Beli ayam 25k Telur 15k Beras 60k`

### 3. Cek Saldo & Mutasi Rekening 🏦
*   `saldo` — Cek saldo keseluruhan.
*   `saldo bca` — Cek saldo khusus rekening BCA.
*   `sumber dana` — Lihat daftar semua rekening & e-wallet beserta saldonya.
*   `pindah 50k dari bca ke dana` — Transfer saldo antar rekening sendiri.
*   `aktifkan jago 500k` — Menambahkan akun rekening baru beserta saldo awalnya.

### 4. Hutang & Piutang 🤝
*   `utang Andi 500k` — Catat Andi hutang ke kamu.
*   `piutang Budi 200k` — Catat kamu hutang ke Budi.
*   `bayar hutang Andi 100k @Dana` — Catat pembayaran hutang/piutang ke rekening tertentu.
*   `hutang baru Kredivo 12jt 1.2jt 10x` — Catat cicilan bulanan (Total, Cicilan per bulan, Tenor).
*   `hutang` — Lihat daftar ringkasan hutang dan piutang saat ini.

### 5. Koreksi / Pembatalan ✏️
*   `batal` atau `hapus` — Menghapus transaksi yang paling terakhir kamu input.
*   `riwayat` — Melihat 10 transaksi terakhir (lengkap dengan ID angka).
*   `hapus 3` — Menghapus transaksi urutan ke-3 dari riwayat.
*   `hapus 2 dari bca` — Menghapus mutasi urutan ke-2 dari riwayat rekening BCA.

### 6. Laporan Keuangan 📊
*   `hari ini` — Ringkasan pemasukan & pengeluaran hari ini.
*   `minggu ini` — Ringkasan pekan ini.
*   `bulan ini` — Ringkasan bulan ini per kategori.
*   `ringkasan` — Laporan komprehensif.
*   `budget` — Cek sisa anggaran yang masih bisa dipakai.
*   `dashboard` — Dapatkan link akses PWA Dashboard kamu.

### 7. Fitur AI Scan Struk (OCR) 📸
*   **Kirim Gambar Struk:** Kirim foto struk belanja (Indomaret, restoran, dsb) langsung ke bot.
*   Bot akan menggunakan AI Vision untuk mengekstrak total belanja dan daftar item secara otomatis.
*   Tambahkan *caption* nama rekening jika dibayar pakai e-wallet/bank tertentu (contoh kirim foto dengan caption: `@BCA`).

### 8. Pengingat / Reminder ⏰
*   `ingatkan Bayar Listrik tiap tgl 20` — Set reminder otomatis setiap tanggal 20.
*   `pengingat` — Cek daftar reminder aktif.
*   `hapus pengingat 1` — Menghapus reminder.

---

*(Panduan lengkap untuk mengakses dashboard ada di menu PWA `dashboard` dari bot).*