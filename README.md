# Keuangan Keluarga

Aplikasi web (PWA) untuk keuangan dan keseharian keluarga. Dipakai berdua di ponsel masing-masing, dan datanya tersimpan di **Google Sheets milik Anda sendiri**. Tanpa server berbayar, tanpa langganan.

Fitur:

- **Beranda:** nama keluarga, jadwal salat dan tanggal Hijriah, kisi menu modul, ringkasan sisa kas bulan ini, pengeluaran per bulan, dan ikon mata untuk menyembunyikan semua nominal.
- **Keuangan:** catat transaksi, pos tabungan dengan target, total tabungan, dan ekspor CSV.
- **Kategori:** ubah nama, ikon, warna, dan anggaran tiap kategori, urutkan dengan tombol naik/turun, tambah kategori baru, atau hapus (catatan lama dipindahkan ke kategori lain lebih dulu).
- **Laporan per pos:** grafik donat dan daftar pengeluaran, pemasukan, serta setoran tabungan per pos untuk bulan terpilih, ditambah grafik 6 bulan yang bertumpuk per pos. Ketuk satu pos untuk melihat catatannya.
- **Kalender keluarga:** agenda, acara berulang (mingguan, bulanan, tahunan), dan tagihan yang bisa langsung dicatat sebagai pengeluaran.
- **Google Calendar dua arah:** agenda di aplikasi muncul di Google Calendar, dan acara yang dibuat atau diubah di Google Calendar muncul di aplikasi. Tiap agenda bisa diberi **pengingat** (notifikasi Google Calendar), misalnya sehari sebelum tagihan jatuh tempo.
- **Masuk dengan Google (opsional):** hanya email keluarga yang terdaftar yang bisa membuka data, tanpa kunci rahasia yang harus dibagikan.
- **Groceries:** daftar belanja bersama yang bisa dicentang saat di toko.
- **Zakat:** perkiraan zakat penghasilan, zakat maal, dan fitrah dari catatan keluarga.
- **Umroh:** rencana biaya, tabungan khusus, dan daftar persiapan.
- Tampilan serba putih dengan ikon maskot warna-warni yang lucu, dan bisa dipakai tanpa sinyal.

## Cara kerjanya

```
ponsel Ayah ─┐                                  ┌─►  Google Sheets Anda
             ├─►  Web app Apps Script  ─────────┤     Transaksi · Kategori · Pos Tabungan · Groceries
ponsel Ibu  ─┘     (apps-script/Code.gs)         │     Kalender · Umroh · Pengaturan · Ringkasan
                         ▲                       └─►  Google Calendar "Kalender Keluarga"
                         └── Masuk dengan Google (opsional)
```

- Aplikasi (`index.html`) di-host gratis di **GitHub Pages**.
- Data dibaca dan ditulis lewat **Web app Apps Script** yang Anda pasang di spreadsheet sendiri.
- Alamat Web app dan kunci rahasia (atau sesi masuk Google) hanya disimpan di browser tiap ponsel. Isi repositori ini tidak memuat data atau kunci apa pun, jadi repositori boleh publik.
- Catatan yang dibuat saat offline antre di ponsel dan terkirim otomatis begitu internet kembali.

## Langkah 1: Siapkan Google Sheets dan Apps Script

1. Buka [sheets.new](https://sheets.new) dan beri nama spreadsheet, misalnya **Keuangan Keluarga**.
2. Di menu spreadsheet pilih **Ekstensi (Extensions) › Apps Script**.
3. Hapus semua isi `Code.gs`, lalu tempel seluruh isi berkas [`apps-script/Code.gs`](apps-script/Code.gs) dari repositori ini.
4. Di bagian atas kode, pilih **salah satu** cara mengamankan akses:
   - **Kunci rahasia (paling sederhana):** ganti nilai `KUNCI` dengan kalimat acak yang panjang (disarankan 20 karakter atau lebih). Catat kuncinya, nanti diisi di aplikasi.
   - **Masuk dengan Google:** biarkan `KUNCI` apa adanya, lalu isi `GOOGLE_CLIENT_ID` dan `EMAIL_BOLEH` setelah mengikuti bagian *Masuk dengan Google* di bawah. Anda boleh melewati ini sekarang dan menambahkannya nanti.

   Klik **Simpan** (ikon disket).
5. Pilih fungsi **siapkan** di daftar fungsi atas editor, lalu klik **Jalankan (Run)**. Google akan meminta izin:
   - klik **Tinjau izin**, pilih akun Anda,
   - jika muncul peringatan *Google belum memverifikasi aplikasi ini*, klik **Lanjutan (Advanced)** lalu **Buka … (tidak aman)**. Ini wajar karena skripnya milik Anda sendiri,
   - klik **Izinkan**. Izin yang diminta mencakup spreadsheet ini, **Google Calendar**, dan **menghubungkan ke layanan eksternal** (dipakai untuk memeriksa akun Google saat Masuk dengan Google).
   Fungsi ini membuat tab `Transaksi`, `Kategori`, `Pos Tabungan`, `Groceries`, `Kalender`, `Umroh`, `Pengaturan`, dan `Ringkasan`, serta kalender **Kalender Keluarga** di Google Calendar Anda.
6. Klik **Deploy (Terapkan) › Deployment baru**. Pilih jenis **Aplikasi web (Web app)** lalu isi:
   - **Jalankan sebagai (Execute as):** Saya (akun Anda)
   - **Yang memiliki akses (Who has access):** Siapa saja (Anyone)
7. Klik **Deploy** dan salin **URL aplikasi web**. Bentuknya `https://script.google.com/macros/s/…/exec`.

> "Siapa saja" artinya Google tidak meminta login untuk memanggil alamat Web app. Yang melindungi data Anda adalah `KUNCI` di langkah 4, atau daftar email di `EMAIL_BOLEH` bila memakai Masuk dengan Google. Jangan membagikan alamat dan kunci kecuali ke pasangan.

### Sudah memakai versi sebelumnya?

**Dari versi 3 (Google Calendar dan Masuk dengan Google sudah aktif):** `Code.gs` tidak berubah di rilis ini. Cukup ganti `index.html`, `sw.js`, `manifest.webmanifest`, dan folder `icons/` di repositori, lalu buka aplikasi dua kali di tiap ponsel (kali pertama mengunduh versi baru, kali kedua memakainya). Tidak perlu deploy ulang Apps Script dan data tidak berubah. Ikon di layar utama ponsel mungkin baru berganti setelah aplikasi dipasang ulang.

**Dari versi 2 atau lebih lama:** versi ini menambah Google Calendar, Masuk dengan Google, dan pengingat, jadi `Code.gs` perlu diperbarui. Data lama tidak berubah.

1. Buka **Ekstensi › Apps Script**, hapus isi `Code.gs`, tempel isi [`apps-script/Code.gs`](apps-script/Code.gs) yang baru, dan isi `KUNCI` dengan kunci yang sama seperti sebelumnya.
2. Jalankan fungsi **siapkan** sekali lagi. Google meminta izin **baru** (Google Calendar dan layanan eksternal): setujui seperti langkah 5 di atas. Fungsi ini juga membuat kalender **Kalender Keluarga** dan menyalakan sinkronnya.
3. **Deploy › Kelola deployment › ikon pensil › Versi: Versi baru › Deploy.** Alamat Web app tidak berubah, jadi ponsel tidak perlu disambungkan ulang.
4. Ganti `index.html` dan `sw.js` di repositori dengan yang baru, lalu buka aplikasi dua kali di tiap ponsel.

Sebelum langkah 1 dan 3 dilakukan, aplikasi baru tetap bisa mencatat transaksi, tetapi Google Calendar menampilkan peringatan *butuh Code.gs terbaru*.

## Masuk dengan Google (opsional)

Dengan ini, data hanya terbuka untuk email yang Anda daftarkan. Tidak ada kunci rahasia yang dibagikan, dan tautan "Bagikan ke pasangan" tidak berisi rahasia apa pun. Anda membutuhkan **OAuth Client ID** gratis dari Google Cloud Console. Tampilan Google Cloud Console kadang berubah, jadi nama menu di bawah bisa sedikit berbeda (di tampilan baru berada di **Google Auth Platform**).

1. Buka [console.cloud.google.com](https://console.cloud.google.com) dan masuk dengan akun Google Anda. Buat proyek baru, misalnya **Keuangan Keluarga**.
2. Buka **APIs & Services › OAuth consent screen** (Layar persetujuan OAuth). Pilih jenis pengguna **External**, isi nama aplikasi (misalnya *Keuangan Keluarga*), email dukungan, dan email kontak developer, lalu simpan. Anda tidak perlu menambah *scope* apa pun.
3. Di bagian **Test users** (Pengguna uji), tambahkan email **Anda dan pasangan**. Selama status aplikasi *Testing*, hanya email ini yang bisa masuk. Tidak perlu mengirim aplikasi untuk diverifikasi Google.
4. Buka **APIs & Services › Credentials › Create credentials › OAuth client ID**. Pilih **Web application**, beri nama, lalu di **Authorized JavaScript origins** tambahkan alamat GitHub Pages Anda **tanpa garis miring di akhir dan tanpa nama repositori**, misalnya `https://nama-anda.github.io`. (Untuk mencoba di komputer, tambahkan juga `http://localhost:8000`.) Klik **Create**.
5. Salin **Client ID** (berakhiran `.apps.googleusercontent.com`). *Client secret* tidak dipakai.
6. Di `Code.gs` isi bagian atas:
   ```js
   var GOOGLE_CLIENT_ID = '1234567890-abc….apps.googleusercontent.com';
   var EMAIL_BOLEH = 'ayah@gmail.com, ibu@gmail.com';
   ```
   Pemilik skrip selalu boleh masuk. Simpan, lalu **Deploy › Kelola deployment › ikon pensil › Versi baru › Deploy**.
7. Di aplikasi: **Lainnya › Sambungkan ke Google Sheets**, tempel **alamat Web app saja** (kolom kunci dikosongkan), ketuk **Tes dan simpan**, lalu **Masuk dengan Google**.

Catatan:

- Setelah `GOOGLE_CLIENT_ID` diisi, `KUNCI` tidak dipakai lagi dan permintaan tanpa sesi masuk ditolak.
- Sesi berlaku 30 hari per perangkat. Mencabut email dari `EMAIL_BOLEH` (lalu deploy versi baru) langsung memutus akses email itu. **Lainnya › Keluar** mengakhiri sesi di satu perangkat dan menghapus salinan data di perangkat itu. Catatan yang belum terkirim tetap tersimpan dan terkirim setelah masuk lagi.
- Jika tombol masuk tidak muncul atau Google menampilkan *origin_mismatch*, alamat di **Authorized JavaScript origins** belum sama persis dengan alamat tempat aplikasi dibuka. Jika muncul *Access blocked*, email itu belum ada di **Test users**.
- Di aplikasi yang sudah dipasang di layar utama, jendela masuk Google kadang ditolak oleh ponsel. Jika itu terjadi, buka alamat aplikasi di browser, masuk sekali di sana, lalu pasang ulang atau lanjutkan di browser.

## Google Calendar

`siapkan` membuat kalender **Kalender Keluarga** di akun Google Anda dan menyalakan sinkronnya. Status, **Nyalakan**, **Sinkronkan sekarang**, dan **Matikan** ada di **Lainnya › Google Calendar**, dan ringkasannya tampil di atas halaman Kalender.

**Cara kerja sinkron**

- Agenda yang Anda simpan di aplikasi langsung dikirim ke Google Calendar. Perubahan dari Google Calendar masuk ke aplikasi paling lama sekitar 45 detik setelah aplikasi memeriksa, atau saat Anda mengetuk **Sinkronkan sekarang**.
- Acara dari Google Calendar tampil di aplikasi dengan tanda **Google**. Acara yang dihapus di salah satu sisi ikut terhapus di sisi lain. Jika kedua sisi diubah bersamaan, yang paling baru menang.
- Yang disinkronkan: judul, tanggal, jam, catatan, jumlah tagihan (ditulis di deskripsi), dan pengulangan mingguan, bulanan, atau tahunan. Acara berjam berdurasi 1 jam.
- Acara dari Google yang lebih lama dari seminggu tidak diimpor. Agenda aplikasi yang sudah lewat lebih dari 30 hari tidak dikirim ke Google. Pemindaian mencakup 30 hari ke belakang sampai 1 tahun ke depan.

**Pengingat**

- Di formulir agenda, kolom **Pengingat** mengatur notifikasi Google Calendar: tepat waktu, 30 menit, 1 jam, atau sehari, 3 hari, dan seminggu sebelumnya (pukul 09.00). Tagihan baru otomatis memakai *sehari sebelumnya, jam 09.00*. *Bawaan Google Calendar* membiarkan pengaturan kalender Anda sendiri.
- Pengingat dikirim sebagai notifikasi dan email ke akun pemilik skrip.
- Untuk pasangan: buka [calendar.google.com](https://calendar.google.com), arahkan ke **Kalender Keluarga › ⋮ › Pengaturan dan berbagi › Bagikan dengan orang atau grup tertentu**, tambahkan email pasangan (izin *Melakukan perubahan pada acara* jika ia boleh mengubah dari Google Calendar). Kalender itu muncul di Google Calendar pasangan, dan ia mengatur notifikasinya sendiri di **Pengaturan kalender › Notifikasi acara**.

**Batasan yang perlu diketahui**

- Acara berulang yang dibuat di Google tampil di aplikasi sebagai satu baris per kejadian untuk 90 hari ke depan, dan pengulangannya diatur di Google Calendar. Menghapus satu baris hanya menghapus kejadian itu.
- Tamu, lokasi, jam selesai, dan lampiran acara tidak dibawa ke aplikasi. Mengubah jam atau pengulangan agenda di aplikasi bisa membuat acaranya dibuat ulang di Google.
- Tagihan bulanan pada tanggal 29 sampai 31 di aplikasi jatuh pada hari terakhir bulan pendek, sedangkan Google Calendar melewati bulan yang tidak punya tanggal itu.
- Jangan mengubah baris agenda yang sudah tersinkron langsung di spreadsheet. Ubah lewat aplikasi atau Google Calendar. Kolom *ID Google Calendar* dan *Terakhir sinkron* diisi otomatis, jangan diubah.
- Jika kalender dihapus di Google Calendar, aplikasi menampilkan galat. Ketuk **Matikan** lalu **Nyalakan** untuk membuat kalender baru.
- Versi ini dicoba dengan tiruan Google Calendar. Jika Anda menemukan perilaku yang berbeda di Google Calendar asli, kabari agar bisa diperbaiki.

## Langkah 2: Terbitkan di GitHub Pages

1. Buat repositori baru di GitHub, misalnya `keuangan-keluarga` (publik tidak masalah, lihat catatan di atas).
2. Unggah semua berkas dari folder ini: `index.html`, `manifest.webmanifest`, `sw.js`, folder `icons`, folder `apps-script`, dan `README.md`. Lewat web: **Add file › Upload files**, lalu seret berkas dan folder (pakai Chrome, Edge, atau Firefox agar folder bisa diseret). Berkas `.nojekyll` boleh ikut atau tidak.
3. Buka **Settings › Pages**. Di *Build and deployment* pilih **Deploy from a branch**, branch **main**, folder **/ (root)**, lalu **Save**.
4. Tunggu satu sampai dua menit. Alamat aplikasi muncul di halaman itu, bentuknya `https://NAMA-ANDA.github.io/keuangan-keluarga/`.

## Langkah 3: Sambungkan aplikasi ke spreadsheet

1. Buka alamat GitHub Pages di ponsel pertama. Pilih nama pemakai ("Ayah" atau "Ibu").
2. Buka tab **Lainnya › Sambungkan ke Google Sheets**, tempel **URL aplikasi web** dan **kunci** (kosongkan kunci jika memakai Masuk dengan Google), lalu ketuk **Tes dan simpan**. Dengan Masuk dengan Google, lanjutkan dengan tombol **Masuk dengan Google**.
3. Jika berhasil, penanda di Beranda berubah menjadi **Tersinkron** dan kategori bawaan muncul di tab `Kategori` pada spreadsheet.

## Langkah 4: Pasangan ikut memakai

1. Di ponsel pertama buka **Lainnya › Bagikan ke pasangan**, lalu kirim tautannya lewat pesan pribadi.
2. Pasangan membuka tautan itu, mengetuk **Sambungkan**, lalu memilih namanya.

Jika memakai kunci rahasia, tautan itu berisi kunci akses, jadi perlakukan seperti kata sandi. Jika memakai Masuk dengan Google, tautan tidak berisi rahasia, dan pasangan masuk dengan email yang ada di `EMAIL_BOLEH`. Nama keluarga dan nama pengguna bisa diganti lewat ikon anggota di Beranda, atau **Lainnya › Nama keluarga dan pengguna**.

## Pasang di layar utama

- **Android (Chrome):** ketuk **Pasang** di Lainnya, atau menu ⋮ › **Instal aplikasi**.
- **iPhone (Safari):** tombol Bagikan › **Tambah ke Layar Utama**.

Setelah dibuka sekali dengan internet, aplikasi bisa dibuka lagi tanpa sinyal.

## Hal yang perlu diketahui

- **Offline:** catatan baru tersimpan di ponsel dan terkirim begitu ada internet, selama aplikasinya sedang dibuka. Aplikasi tidak mengirim di latar belakang. Menghapus data situs di browser sebelum catatan terkirim akan menghapus antreannya.
- **Sinkron antarperangkat:** aplikasi memeriksa perubahan tiap 20 detik saat dibuka, dan saat dibuka kembali. Untuk memaksa, ketuk ikon muat ulang di Beranda atau **Lainnya › Muat ulang dari spreadsheet**.
- **Menyunting langsung di Google Sheets:** boleh. Ubah isi sel di tab `Transaksi`, `Kategori`, `Pos Tabungan`, `Groceries`, atau `Kalender` (untuk agenda yang tersinkron ke Google Calendar, ubah lewat aplikasi). Baris baru yang Anda ketik tanpa ID akan diberi ID otomatis dan muncul di aplikasi. Jangan mengubah judul kolom, menambah kolom, atau menyisipkan baris kosong di tengah. Untuk catatan sendiri, buat tab lain.
- **Jadwal salat dan Hijriah:** dihitung di ponsel tanpa internet, jadi tidak ada data yang dikirim ke pihak lain. Memakai sudut Subuh 20° dan Isya 18° (acuan Kemenag RI) dengan ihtiyat 2 menit, sehingga bisa selisih satu sampai dua menit dari jadwal resmi kota Anda. Kota dipilih di kartu jadwal (ada 45 kota Indonesia), atau pakai lokasi ponsel. Awal bulan Hijriah di Indonesia ditetapkan pemerintah dan bisa berbeda satu hari dari hitungan standar, jadi tersedia koreksi −1, standar, atau +1 hari. Pilihan kota dan koreksi tersimpan per ponsel.
- **Zakat:** harga emas per gram tidak diisi otomatis. Masukkan harga terbaru di halaman Zakat, lalu nisab (85 gram emas) dan zakat 2,5% dihitung dari situ. Ini perkiraan untuk membantu, bukan fatwa. Pembayaran dicatat sebagai pengeluaran di kategori *Zakat & Sedekah*.
- **Umroh:** rencana (jamaah, biaya paket, biaya tambahan, bulan berangkat) terhubung ke satu pos tabungan. Target dan tenggat pos itu mengikuti rencana. Kalau Anda belum punya pos, aplikasi membuat pos baru bernama *Umroh*.
- **Sembunyikan nominal:** ikon mata menutup semua angka rupiah di layar. Pilihannya tersimpan per ponsel dan tidak mengubah data.
- **Tab Ringkasan:** rekap 12 bulan terakhir dengan rumus, mengikuti tab `Transaksi`. Silakan dipakai atau dihapus.
- **Transaksi yang dihapus** di aplikasi ditandai `ya` di kolom *Dihapus* selama 45 hari agar perangkat yang lama offline tidak menghidupkannya lagi, lalu dibersihkan otomatis.
- **Cadangan:** tombol **Unduh CSV** ada di tab Laporan (hanya transaksi). Tab lain sudah ada di spreadsheet. Riwayat versi Google Sheets (Berkas › Riwayat versi) juga menyimpan perubahan.
- **Kuota:** Apps Script gratis punya batas harian. Pemakaian keluarga biasa jauh di bawah batas itu.

## Mengubah kode

- **Mengganti `KUNCI` atau kode `Code.gs`:** simpan, lalu **Deploy › Kelola deployment › ikon pensil › Versi: Versi baru › Deploy**. Alamat tidak berubah. Setelah mengganti kunci, perbarui juga di aplikasi (**Lainnya › Ubah sambungan**) pada tiap ponsel.
- **Memperbarui aplikasi:** ganti `index.html` di repositori. Ponsel yang sudah memasangnya menampilkan versi lama sekali sambil mengunduh yang baru, jadi buka aplikasi dua kali.
- **Mencoba di komputer:** jalankan `python3 -m http.server 8000` di folder ini, lalu buka `http://localhost:8000`.

## Pemecahan masalah

| Gejala | Penyebab dan cara mengatasi |
| --- | --- |
| *Kunci tidak cocok* atau penanda **Kunci ditolak** | Kunci di aplikasi berbeda dengan `KUNCI` di Apps Script, atau Anda mengganti kunci tanpa deploy versi baru. Samakan keduanya lalu **Lainnya › Ubah sambungan**. |
| *Kunci di Apps Script masih bawaan* | Nilai `KUNCI` belum diganti. Ganti, simpan, deploy versi baru. |
| *Alamat ini tidak menjawab seperti Web app…* | Alamat harus berakhiran `/exec` (bukan `/dev`), dan akses Web app harus **Siapa saja**. Setelah mengubah pengaturan, deploy versi baru. |
| *Google menolak permintaan (HTTP 4xx)* | Alamat salah ketik atau deployment dihapus. Salin ulang dari **Deploy › Kelola deployment**. |
| *Perbarui Code.gs di Apps Script…* atau banner **Spreadsheet belum diperbarui** | Apps Script masih memakai `Code.gs` versi lama. Ikuti bagian *Sudah memakai versi sebelumnya?* di atas. |
| *Izin Google Calendar belum diberikan* | Jalankan fungsi **siapkan** lagi di Apps Script, setujui izin Google Calendar, lalu **Deploy › Versi baru**. |
| *Email … belum terdaftar* | Tambahkan email itu ke `EMAIL_BOLEH` di `Code.gs`, simpan, dan deploy versi baru. Selama aplikasi Google Cloud berstatus *Testing*, email itu juga harus ada di **Test users**. |
| *Sesi masuk berakhir* | Sesi berlaku 30 hari atau emailnya dicabut. Masuk lagi dengan Google. Catatan yang antre tidak hilang. |
| Tombol Masuk dengan Google tidak muncul | Periksa internet, lalu ketuk **Coba lagi**. Jika tetap kosong, *Authorized JavaScript origins* di Google Cloud belum sama dengan alamat aplikasi. |
| Agenda tidak muncul di Google Calendar | Buka **Lainnya › Google Calendar**: pastikan statusnya tersambung dan tidak ada pesan galat, lalu ketuk **Sinkronkan sekarang**. |
| Penanda **Mode lokal** | Aplikasi belum disambungkan. Catatan baru hanya ada di ponsel itu sampai Anda menyambungkannya. |
| Catatan pasangan tidak muncul | Tunggu sampai 20 detik atau ketuk ikon muat ulang di Beranda. Pastikan kedua ponsel memakai alamat Web app yang sama (dan kunci yang sama, atau email yang terdaftar). |

## Isi repositori

```
index.html              Aplikasi (HTML, CSS, JavaScript dalam satu berkas)
manifest.webmanifest    Metadata PWA (nama, ikon, tampilan)
sw.js                   Service worker agar aplikasi bisa dibuka offline
icons/                  Ikon aplikasi
apps-script/Code.gs     Kode untuk ditempel di Google Apps Script
```
