# PRD: Aturan Input Chat Bot WA & Pengelolaan Rekening (Saldo)

## 1. Aturan Pengeluaran
*   **Format Utama**: `keluar [nominal] [keterangan]`
*   **Format Lain**:
    *   Minus prefix: `- 50000 jajan anak`
    *   Tebak parser (NLP): `beli beras 75 ribu`, `bayar listrik 200k`
    *   Nominal di belakang: `keluar Suntik 265k`
    *   Paksa kategori dengan `#`: `keluar 50rb bensin #transportasi`
    *   Pilih rekening dengan `@`: `keluar 50rb bensin @BCA YUNI` atau `keluar 50rb bensin @BCA-YUNI`
*   **Efek**: Menyimpan ke tabel `transactions` dan memotong saldo di `accounts` jika parameter `@rekening` diisi.

## 2. Aturan Pemasukan
*   **Format Utama**: `masuk [nominal] [keterangan]`
*   **Format Lain**:
    *   Plus prefix: `+ 200000 bonus kerja`
    *   Nominal di belakang: `masuk gaji 5jt`
    *   Ke rekening tertentu: `masuk 8jt gaji @BCA YUNI`
*   **Efek**: Menyimpan ke tabel `transactions` dan menambah saldo di `accounts` jika parameter `@rekening` diisi.

## 3. Aturan Pengelolaan Rekening (Sumber Dana)
*   **Ketik `sumber dana`**: Menampilkan daftar bank/e-wallet katalog beserta tanda `[✓]` jika sudah aktif.
*   **Ketik `aktifkan [nama_rekening]`**: Menambahkan rekening baru ke tabel `accounts` dengan saldo 0.
*   **Ketik `aktifkan [nama_rekening] [nominal]`**: Menambahkan rekening baru ke tabel `accounts` dengan saldo awal.
*   **Ketik `saldo awal [nominal] @[nama_rekening]`**: Mengupdate/overwrite saldo awal rekening yang terdaftar.
*   **Ketik `saldo`**: Menampilkan saldo per rekening beserta totalnya.
*   **Ketik `pindah [nominal] dari @[asal] ke @[tujuan]`** atau `transfer dana [nominal] dari [asal] ke [tujuan]`: Memindahkan saldo antar rekening (tanpa mencatat transaksi pengeluaran/pemasukan di laporan).

---

## Rencana Implementasi (Implementation Plan)

### Task 1: Modifikasi Skema DB & Parser Rekening
**Files**:
*   Modify: `/home/ubuntu/wafin-bot/parser.js` (tambahkan regex untuk `aktifkan`, `sumber dana`, `pindah`, `transfer`, `@rekening`, `#kategori`)
*   Modify: `/home/ubuntu/wafin-bot/db.js` (pastikan trigger saldo otomatis atau helper pemotong saldo ketika transaksi dicatat)

### Task 2: Modifikasi Message Handler `index.js`
**Files**:
*   Modify: `/home/ubuntu/wafin-bot/index.js` (implementasikan case `activate_account`, `transfer_funds`, `update_balance`, mapping rekening)

### Task 3: Modifikasi Form Transaksi di Dashboard
**Files**:
*   Modify: `/home/ubuntu/wafin-pwa/src/pages/Transactions.tsx` (tambahkan input dropdown pilih rekening/sumber dana saat mencatat transaksi manual)

---

## 4. Cek Saldo & Ringkasan

| Command | Hasil |
|---------|-------|
| `saldo` | Total uang + rincian per rekening aktif |
| `sumber dana` | Daftar bank & e-wallet (✓ = sudah aktif) |
| `aktifkan [nama]` | Aktifkan rekening (mis. `aktifkan BCA`) |
| `aktifkan [nama] [nominal]` | Aktifkan + saldo awal (mis. `aktifkan GoPay 500rb`) |
| `hari ini` | Laporan harian: masuk/keluar, kategori, 3 terbesar, insight arus kas |
| `minggu ini` | Laporan Senin–hari ini (format sama) |
| `bulan ini` | Laporan bulan: vs bulan lalu, kategori, budget, alert, insight |
| `riwayat` / `terakhir` | 5 transaksi terakhir, bernomor 1–5 (1 = paling baru) |

### Peringatan Otomatis
*   Setiap Senin pagi: ringkasan minggu lalu via WA (langganan aktif).
*   Saat pengeluaran: alert budget kategori mencapai 80% dan 100% dari limit bulan ini.

## 5. Hutang & Cicilan

| Command | Hasil |
|---------|-------|
| `hutang` / `lihat hutang` | Ringkasan semua hutang aktif |
| `hutang baru Kredivo 12jt 1.2jt` | Cicilan baru (bot tanya jatuh tempo) |
| `hutang baru Kredivo 12jt 1.2jt 10x` | Cicilan baru + tenor |
| `hutang baru Kredivo 12jt 1.2jt tgl 5` | Cicilan baru + jatuh tempo langsung |
| `utang Andi 500rb` | Hutang sekali bayar |
| `utang cc cimb 336000` | Hutang sekali bayar (kartu kredit) |
| `piutang Budi 300rb` | Piutang (uang dipinjamkan ke orang) |
| `bayar hutang Kredivo 1.2jt` | Bayar cicilan |
| `bayar hutang Kredivo 1.2jt @BCA YUNI` | Bayar cicilan dari rekening tertentu |

### Catatan Hutang
*   Cicilan jangka panjang pakai `hutang baru`, bukan `utang baru`.
*   Hutang sekali bayar cukup `utang [nama] [nominal]` — nominal harus kata terakhir, jangan tambahkan "baru" atau "- sekali bayar".
*   Jika nominal bayar > cicilan jatuh tempo, bot tanya: denda atau salah ketik?
    *   Balas `denda` → kelebihan dicatat denda, cicilan lunas.
    *   Balas `salah` / `batal` → pembayaran dibatalkan.

## 6. Format Lanjutan (Batch & Multi-baris)

### Beberapa baris dalam satu pesan
Setiap baris = satu transaksi (tanpa kata `keluar`/`masuk` di awal baris):
```
Cabut gigi 250k
Obat 81k
```

### Beberapa item dalam satu baris (tanpa enter)
Pola keterangan + nominal berulang:
```
Cabut gigi 250k Obat 81k Es cream 23k
```

### Beberapa perintah dalam satu pesan
Setiap baris harus perintah lengkap (diawali `keluar`, `masuk`, `saldo`, dll.):
```
keluar 50rb kopi
masuk 5000000 gaji
saldo
```

### Sumber dana di akhir (format bebas)
Tambahkan `@nama rekening` di akhir atau awal pesan. Spasi dan strip dianggap sama (`@BCA YUNI` = `@BCA-YUNI`):
```
keluar 50rb bensin @BCA YUNI
masuk 14.6jt transfer @BCA YUNI
bayar listrik 285k @Mandiri
```
*   Nama singkat tanpa spasi boleh tanpa `@` (mis. `50rb BCA`) — pakai `@` jika nama rekening ada spasi.
## 7. Format Nominal Uang
Bot mengerti format singkatan dan tanpa titik/Rp:
*   `50000` = 50.000
*   `50rb` atau `50k` = 50.000
*   `75 ribu` = 75.000
*   `1jt` atau `1 juta` = 1.000.000
*   `1.500.000` = 1.500.000
*(Contoh salah: "keluar lima puluh ribu" - harus pakai angka)*

## 8. Kategori & Profil (Dashboard Links)
| Command | Hasil |
|---------|-------|
| `kategori` | Menampilkan daftar kategori |
| `profil` | Info profil akun |
| `dashboard` | Link & petunjuk login ke web dashboard |

*Kategori default system-mapped:*
*   Makan, kopi, warung -> Makanan & Minuman
*   Bensin, grab, tol -> Transportasi
*   Belanja, indomaret -> Belanja Rumah
*   Listrik, pdam, pulsa -> Tagihan & Utilitas
*   Gaji, salary -> Gaji
*   Transfer, kiriman -> Transfer

## 9. Foto Nota / Struk
*   Kirim foto struk belanja/transfer (bisa dengan caption).
*   Bot membaca menggunakan OCR / Vision (menampilkan jenis, nominal, keterangan, sumber dana).
*   Bot meminta konfirmasi: Balas `ya` (atau `iya`, `ok`) untuk menyimpan, atau `batal` untuk membuang.
*   *Constraint*: Jika ada nota "pending" (belum di-ya/batal), bot menolak foto nota baru sampai yang lama diselesaikan.

## 10. Edit / Hapus (Koreksi)
| Command | Hasil |
|---------|-------|
| `batal` / `hapus` / `undo` | Hapus transaksi yang paling terakhir dicatat |
| `hapus [nomor]` | Hapus transaksi berdasarkan nomor urut di perintah `riwayat` (mis. `hapus 2`) |
*Atau edit dari menu Transaksi di dashboard PWA.*

## 11. Pengingat Tagihan (Reminders)
| Command | Hasil |
|---------|-------|
| `pengingat` | Lihat daftar semua pengingat aktif |
| `ingatkan [judul] [nominal] tiap tgl [tanggal]` | Buat pengingat dengan nominal (mis. `ingatkan listrik 250000 tiap tgl 5`) |
| `ingatkan [judul] tgl [tanggal]` | Buat pengingat tanpa nominal (mis. `ingatkan bayar kos tgl 1`) |
| `hapus pengingat [nomor]` | Menghapus pengingat berdasarkan nomor urut |
*Cron job bot (misal via Node-Cron/Agenda) mengecek setiap pagi (misal jam 08:00) dan mengirim WA.*

---
*(End of spec additions)*
