# 🍽️ Rotasi Siklus Makan

Aplikasi web untuk mengelola antrean pilihan makan dan memutarnya secara teratur. Masuk dengan Google untuk menyimpan antrean dan daftar pengecualian secara pribadi melalui Firebase.

## ✨ Fitur

### Antrean menu

- **Rotasi menu:** tombol **Saya makan sekarang** memindahkan menu paling bawah ke posisi teratas.
- **Undo rotasi:** kembalikan urutan antrean setelah rotasi.
- **Tambah banyak menu sekaligus:** masukkan satu menu per baris.
- **Peringatan keyword pengecualian:** aplikasi meminta konfirmasi jika menu baru mengandung keyword yang ada di daftar pengecualian. Pencocokan tidak membedakan huruf besar dan kecil.
- **Edit menu:** ubah menu melalui dialog custom.
- **Hapus menu:** hapus item dan pulihkan dalam beberapa detik melalui snackbar **Urungkan**.
- **Hapus semua:** kosongkan antrean setelah konfirmasi.
- **Drag and drop:** susun ulang antrean secara manual.

### Daftar pengecualian

- Tambahkan beberapa keyword atau catatan, satu item per baris.
- Edit dan hapus item dengan tombol aksi bergaya konsisten.
- Pulihkan item yang baru dihapus melalui snackbar **Urungkan**.
- Popup mengunci scroll halaman utama, sementara daftar di dalamnya tetap dapat digulir.

### Antarmuka dan akun

- Masuk dengan Google; antrean dan pengecualian disimpan per pengguna di Cloud Firestore dan diperbarui secara real-time.
- Dialog custom untuk mengedit menu, mengedit pengecualian, dan mengonfirmasi logout.
- Tombol navigasi atas/bawah dan tombol floating pengecualian memudar saat halaman digulir, lalu muncul kembali setelah jeda.
- Dialog dan kontrol mendukung penggunaan keyboard, termasuk Escape untuk menutup dialog yang dapat dibatalkan.

## 🛠️ Teknologi

- **Frontend:** React 19, Vite
- **Drag and drop:** dnd-kit
- **Autentikasi dan database:** Firebase Authentication dan Cloud Firestore
- **Hosting:** GitHub Pages

## 🚀 Menjalankan secara lokal

Pastikan Node.js dan npm sudah terpasang, lalu jalankan:

```bash
npm install
npm run dev
```

Pastikan konfigurasi Firebase di `src/firebase.js` sesuai dengan project yang digunakan.

## ✅ Validasi dan build

```bash
npm run lint
npm run build
npm run preview
```

## 🚢 Deploy

Deploy ke GitHub Pages dengan:

```bash
npm run deploy
```

Perintah ini membangun aplikasi lalu menerbitkan folder `dist`. Pastikan GitHub CLI atau Git sudah memiliki autentikasi dan izin untuk mengakses repository.
