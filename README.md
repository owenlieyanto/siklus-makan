# 🍽️ Rotasi Siklus Makan

Aplikasi web berbasis React untuk membantu mengelola dan merotasi daftar antrean makanan sehari-hari. Aplikasi ini memastikan Anda tidak perlu bingung memilih menu makan berikutnya dengan sistem rotasi otomatis dan manajemen antrean yang mudah.

## ✨ Fitur Utama

*   **🔒 Autentikasi Google Terisolasi:** Pengguna dapat masuk menggunakan akun Google. Data antrean setiap pengguna disimpan secara terpisah dan aman (tidak saling tumpang tindih).
*   **🔄 Sistem Rotasi Otomatis (Bawah ke Atas):** Tombol "SAYA MAKAN SEKARANG" akan mencabut menu yang berada di antrean paling bawah dan memindahkannya kembali ke posisi paling atas.
*   **↩️ Undo Dinamis:** Tidak sengaja menekan rotasi? Terdapat tombol *Undo* (dengan indikator jumlah riwayat) untuk mengembalikan urutan antrean ke status sebelumnya.
*   **📝 Manajemen Daftar Fleksibel:**
    *   **Batch Add:** Tambahkan banyak menu sekaligus dengan menempelkan (*paste*) daftar multi-baris pada kolom input.
    *   **Edit & Hapus:** Ubah teks item secara spesifik atau hapus item tunggal dari daftar.
    *   **Hapus Semua:** Kosongkan seluruh daftar antrean secara instan (dilengkapi dengan sistem konfirmasi peringatan agar tidak tidak sengaja terhapus).
*   **🖐️ Drag and Drop:** Sesuaikan urutan antrean secara manual hanya dengan menahan dan menggeser (*drag*) item ke posisi yang diinginkan.
*   **⚡ Real-time Synchronization:** Didukung oleh pendengar aktif Firestore (`onSnapshot`), perubahan antrean di satu perangkat (misal: *smartphone*) akan otomatis dan seketika diperbarui di layar perangkat lain (misal: komputer) tanpa perlu *refresh*.
*   **🚪 Logout Aman:** Dilengkapi dengan pop-up konfirmasi saat akan keluar dari akun.

## 🛠️ Teknologi yang Digunakan

*   **Frontend:** React.js (via Vite)
*   **Backend & Database:** Firebase (Authentication & Cloud Firestore)
*   **Deployment:** GitHub Pages
*   **Environment:** GitHub Codespaces

## 🚀 Cara Menjalankan Proyek (Development)

Proyek ini dikembangkan di dalam lingkungan **GitHub Codespaces**. Untuk menjalankannya secara lokal/di dalam *codespace*:

1. Pastikan Anda berada di *branch* utama (`main`).
2. Instal semua dependensi:
   ```bash
   npm install