# 🤖 Bot Monitoring Wiko (WiFi Koin)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Sebuah bot WhatsApp otomatis yang berfungsi untuk memonitoring status perangkat WiFi Koin (Wiko). Bot ini mengambil data dari API, mengolahnya menjadi laporan ringkas, dan mengirimkannya secara terjadwal ke grup WhatsApp.


---

### ✨ Fitur Utama

-   ✅ **Laporan Otomatis**: Mengirim laporan status perangkat secara otomatis ke WhatsApp.
-   schedule **Jadwal Kustom**: Dikonfigurasi untuk mengirim laporan pada waktu tertentu (contoh: pagi dan sore).
-   📊 **Perbandingan Data**: Melacak dan menampilkan penambahan jumlah pelanggan yang dilayani (`customer_served`) sejak laporan terakhir.
-   💻 **Antarmuka Web**: Dilengkapi web interface sederhana untuk melihat daftar grup dan memicu pengiriman laporan secara manual.
-   💡 **Status Perangkat**: Memberikan ringkasan cepat jumlah perangkat yang online dan yang tidak terjangkau.

---

### 🛠️ Dibangun Dengan

Proyek ini dibuat menggunakan beberapa teknologi utama:

-   **Runtime**: [Node.js](https.nodejs.org/)
-   **WhatsApp API**: [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
-   **Web Server**: [Express.js](https://expressjs.com/)
-   **Penjadwal Tugas**: [node-cron](https://github.com/node-cron/node-cron)

---------------------------------------------------------------------------------

### 🚀 Cara Instalasi dan Menjalankan

Ikuti langkah-langkah berikut untuk menjalankan bot ini di server atau komputer lokal Anda.

#### 1. Prasyarat

Pastikan Anda sudah menginstal **Node.js** (direkomendasikan versi 20 atau lebih tinggi).

#### 2. Instalasi

1.  **Clone repositori ini:**
    ```sh
    git clone [https://github.com/SoeLss/bot-wiko.git](https://github.com/SoeLss/bot-wiko.git)
    ```

2.  **Masuk ke direktori proyek:**
    ```sh
    cd bot-wiko
    ```

3.  **Install semua dependensi yang dibutuhkan:**
    ```sh
    npm install
    ```

#### 3. Konfigurasi

Buka file kode utama (misalnya `index.js`) dan sesuaikan beberapa konstanta di bagian atas file sesuai dengan kebutuhan Anda:

-   `SERVER_HOST`: Alamat IP tempat server web akan berjalan (misal: `'127.0.0.1'`).
-   `SERVER_PORT`: Port untuk server web (misal: `3005`).
-   `TARGET_ID`: ID Grup WhatsApp atau nomor pribadi tujuan laporan (contoh: `'120363xxxxxxxxxx@g.us'`).
-   `DATA_URL`: URL API endpoint dari sistem Wiko Anda.
-   `TIMEZONE`: Zona waktu untuk penjadwalan (misal: `'Asia/Jakarta'`).
-   Ubah jadwal `cron` jika diperlukan.

#### 4. Menjalankan Bot

1.  **Jalankan aplikasi:**
    ```sh
    node index.js
    ```

2.  **Scan QR Code**: Pada saat pertama kali dijalankan, sebuah QR code akan muncul di terminal. Scan QR code tersebut menggunakan aplikasi WhatsApp di ponsel Anda (Link devices > Link a new device).

3.  Setelah berhasil, bot akan berjalan di latar belakang dan sesi login akan tersimpan di folder `auth`.

---

### 📖 Cara Penggunaan

-   **Otomatis**: Bot akan secara otomatis mengirimkan laporan ke `TARGET_ID` sesuai dengan jadwal `cron` yang telah diatur dalam kode.
-   **Manual**: Buka browser dan akses alamat `http://SERVER_HOST:SERVER_PORT` (misal: `http://127.0.0.1:3005`). Halaman ini akan menampilkan daftar grup WhatsApp yang diikuti oleh bot, dan Anda dapat menekan tombol **"Kirim Uji"** untuk mengirim laporan saat itu juga.

---

### 📄 Lisensi

Proyek ini dilisensikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.
