/**
 * KEUANGAN KELUARGA — penyimpanan di Google Sheets, Google Calendar, dan Masuk dengan Google
 *
 * Tempel seluruh isi berkas ini di spreadsheet Anda:
 *   Ekstensi (Extensions) > Apps Script > hapus isi Code.gs > tempel > simpan.
 * Lalu jalankan fungsi "siapkan" satu kali dan terbitkan sebagai Web app.
 * Langkah lengkap ada di README.md.
 *
 * Aplikasi di GitHub Pages membaca dan menulis data lewat Web app ini.
 * Data tersimpan di tab Transaksi, Kategori, Pos Tabungan, Groceries, Kalender, Umroh, dan Pengaturan.
 * Jangan menambah kolom di tab-tab itu; pakai tab lain untuk catatan Anda sendiri.
 *
 * Ada dua cara mengamankan akses. Pilih salah satu:
 *   A. Kunci rahasia (KUNCI)           : paling sederhana, satu kalimat rahasia dipakai berdua.
 *   B. Masuk dengan Google             : isi GOOGLE_CLIENT_ID dan EMAIL_BOLEH. Hanya email di daftar yang bisa masuk.
 * Jika GOOGLE_CLIENT_ID diisi, cara B yang berlaku dan KUNCI tidak dipakai lagi.
 */

// ================= UBAH BAGIAN INI =================
// A. Kunci rahasia. Isi dengan kalimat acak yang panjang, lalu masukkan kunci yang
//    sama di aplikasi (Lainnya > Sambungkan ke Google Sheets). Jangan dibagikan sembarangan.
var KUNCI = 'GANTI-DENGAN-KUNCI-RAHASIA';

// B. Masuk dengan Google (kosongkan jika memakai kunci rahasia di atas).
//    GOOGLE_CLIENT_ID : "OAuth Client ID" tipe Web application dari Google Cloud Console (lihat README).
//    EMAIL_BOLEH      : email yang boleh masuk, pisahkan dengan koma. Pemilik skrip ini selalu boleh.
var GOOGLE_CLIENT_ID = '';
var EMAIL_BOLEH = '';

// Google Calendar (opsional). Kosongkan KALENDER_ID agar kalender "Kalender Keluarga" dibuat otomatis.
var NAMA_KALENDER = 'Kalender Keluarga';
var KALENDER_ID = '';
// ====================================================

var KUNCI_BAWAAN = 'GANTI-DENGAN-KUNCI-RAHASIA';
var VERSI = 3; // 3 = Google Calendar dua arah, Masuk dengan Google, pengingat. 2 = Groceries, Kalender, Umroh, zakat
var SKEMA = {
  transaksi: {
    sheet: 'Transaksi',
    kolom: [
      ['tanggal', 'Tanggal', 't'], ['jenis', 'Jenis', 's'], ['kategori', 'Kategori', 's'],
      ['ket', 'Keterangan', 's'], ['jumlah', 'Jumlah', 'n'], ['oleh', 'Oleh', 's'],
      ['pos', 'Pos', 's'], ['id', 'ID', 's'], ['ts', 'Dibuat', 'n'], ['upd', 'Diubah', 'n'],
      ['contoh', 'Contoh', 'b'], ['hapus', 'Dihapus', 'b']
    ]
  },
  kategori: {
    sheet: 'Kategori',
    kolom: [
      ['nama', 'Nama', 's'], ['jenis', 'Jenis', 's'], ['anggaran', 'Anggaran per bulan', 'z'],
      ['ikon', 'Ikon', 's'], ['warna', 'Warna', 's'], ['urut', 'Urutan', 'n'], ['id', 'ID', 's']
    ]
  },
  pos: {
    sheet: 'Pos Tabungan',
    kolom: [
      ['nama', 'Nama', 's'], ['target', 'Target', 'z'], ['tenggat', 'Tenggat', 't'],
      ['rutin', 'Setoran rutin', 'n'], ['saldoAwal', 'Saldo awal', 'n'], ['ikon', 'Ikon', 's'],
      ['warna', 'Warna', 's'], ['urut', 'Urutan', 'n'], ['contoh', 'Contoh', 'b'], ['id', 'ID', 's']
    ]
  },
  belanja: {
    sheet: 'Groceries',
    kolom: [
      ['nama', 'Barang', 's'], ['qty', 'Jumlah', 's'], ['harga', 'Perkiraan harga', 'z'],
      ['selesai', 'Sudah dibeli', 'b'], ['oleh', 'Oleh', 's'], ['ts', 'Dibuat', 'n'],
      ['upd', 'Diubah', 'n'], ['id', 'ID', 's']
    ]
  },
  agenda: {
    sheet: 'Kalender',
    kolom: [
      ['judul', 'Judul', 's'], ['tanggal', 'Tanggal', 't'], ['jam', 'Jam', 's'], ['jenis', 'Jenis', 's'],
      ['ulang', 'Ulangi', 's'], ['jumlah', 'Jumlah tagihan', 'z'], ['catatan', 'Catatan', 's'],
      ['oleh', 'Oleh', 's'], ['ts', 'Dibuat', 'n'], ['upd', 'Diubah', 'n'], ['id', 'ID', 's'],
      ['ingat', 'Pengingat (menit sebelum, -1 = tanpa)', 'z'], ['gid', 'ID Google Calendar (jangan diubah)', 's'],
      ['src', 'Asal', 's'], ['sync', 'Terakhir sinkron (jangan diubah)', 'n']
    ]
  },
  umroh: {
    sheet: 'Umroh',
    kolom: [
      ['nama', 'Rencana', 's'], ['jamaah', 'Jamaah', 'n'], ['biaya', 'Biaya paket per orang', 'n'],
      ['tambahan', 'Biaya tambahan', 'n'], ['berangkat', 'Berangkat', 't'], ['pos', 'Pos tabungan', 's'],
      ['cek', 'Persiapan selesai', 's'], ['catatan', 'Catatan', 's'], ['upd', 'Diubah', 'n'], ['id', 'ID', 's']
    ]
  }
};
var META_SHEET = 'Pengaturan';
var META_KEYS = ['namaA', 'namaB', 'namaKeluarga', 'hargaEmas', 'jiwa', 'tarifFitrah', 'seeded'];
var JENIS_TX = { Pengeluaran: 1, Pemasukan: 1, Tabungan: 1 };
// Kolom yang dikelola server saja (tidak boleh ditimpa oleh aplikasi).
var SERVER_KOLOM = { agenda: ['gid', 'src', 'sync'] };
var NISAN_HARI = 45; // catatan terhapus disimpan sebentar supaya perangkat offline tidak menghidupkannya lagi

/* ---------------- pintu masuk web ---------------- */

function doGet() {
  return json_(info_());
}

// Informasi umum untuk aplikasi: versi, dan apakah harus masuk dengan Google. Tidak berisi rahasia.
function info_() {
  var o = { ok: true, app: 'keuangan-keluarga', versi: VERSI, masuk: modeMasuk_() };
  if (o.masuk) o.clientId = String(GOOGLE_CLIENT_ID).trim();
  return o;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var out;
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!req || typeof req !== 'object') req = {};
    var izin = req.a === 'info' ? { ok: true } : (req.a === 'masuk' ? { ok: true } : izin_(req));
    if (!izin.ok) {
      out = izin;
    } else if (req.a === 'info') {
      out = info_();
    } else if (!lock.tryLock(25000)) {
      out = { ok: false, error: 'sibuk' };
    } else if (req.a === 'masuk') {
      out = masuk_(req);
    } else if (req.a === 'tarik') {
      out = tarik_(req);
    } else if (req.a === 'dorong') {
      out = dorong_(req);
    } else if (req.a === 'gcal_on' || req.a === 'gcal_off' || req.a === 'gcal_sync') {
      out = gcal_(req.a.slice(5));
    } else {
      out = { ok: false, error: 'aksi' };
    }
  } catch (err) {
    out = { ok: false, error: 'galat', msg: String((err && err.message) || err) };
  } finally {
    try { lock.releaseLock(); } catch (x) { /* tidak memegang kunci */ }
  }
  return json_(out);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- akses: kunci rahasia atau Masuk dengan Google ---------------- */

var SESI_HARI = 30;

function emailBoleh_() {
  var daftar = String(EMAIL_BOLEH || '').toLowerCase().split(/[\s,;]+/).filter(function (x) { return x; });
  try {
    var pemilik = Session.getEffectiveUser().getEmail();
    if (pemilik) daftar.push(String(pemilik).toLowerCase());
  } catch (err) { /* tanpa email pemilik */ }
  return daftar;
}

function modeMasuk_() {
  return String(GOOGLE_CLIENT_ID || '').trim() !== '' && emailBoleh_().length > 0;
}

function izin_(req) {
  if (modeMasuk_()) {
    var email = sesiSah_(req.s);
    return email ? { ok: true, email: email } : { ok: false, error: 'masuk' };
  }
  if (!KUNCI || KUNCI === KUNCI_BAWAAN) return { ok: false, error: 'kunci_belum_diganti' };
  if (typeof req.k !== 'string' || req.k !== KUNCI) return { ok: false, error: 'kunci' };
  return { ok: true };
}

function rahasiaSesi_() {
  var props = PropertiesService.getScriptProperties();
  var r = props.getProperty('sesi_rahasia');
  if (!r) {
    r = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('sesi_rahasia', r);
  }
  return r;
}

function tandatangan_(isi) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(isi, rahasiaSesi_()));
}

function buatSesi_(email) {
  var isi = Utilities.base64EncodeWebSafe(JSON.stringify({ e: email, x: Date.now() + SESI_HARI * 86400000 }), Utilities.Charset.UTF_8);
  return isi + '.' + tandatangan_(isi);
}

// Mengembalikan email jika sesi masih berlaku dan emailnya masih di daftar; selain itu ''.
function sesiSah_(token) {
  if (typeof token !== 'string' || token.length > 2000) return '';
  var bagian = token.split('.');
  if (bagian.length !== 2) return '';
  var benar = tandatangan_(bagian[0]);
  if (benar.length !== bagian[1].length) return '';
  var beda = 0;
  for (var i = 0; i < benar.length; i++) beda |= benar.charCodeAt(i) ^ bagian[1].charCodeAt(i);
  if (beda !== 0) return '';
  var p;
  try { p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(bagian[0])).getDataAsString()); } catch (err) { return ''; }
  if (!p || typeof p.e !== 'string' || !(Number(p.x) > Date.now())) return '';
  return emailBoleh_().indexOf(p.e) >= 0 ? p.e : '';
}

// Tukar ID token Google (dari tombol "Masuk dengan Google") dengan sesi milik aplikasi ini.
function masuk_(req) {
  if (!modeMasuk_()) return { ok: false, error: 'tanpa_masuk' };
  var idt = req.idt;
  if (typeof idt !== 'string' || idt.length < 20 || idt.length > 4096) return { ok: false, error: 'token' };
  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idt), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return { ok: false, error: 'token' };
  var t;
  try { t = JSON.parse(res.getContentText()); } catch (err) { return { ok: false, error: 'token' }; }
  var iss = String(t.iss || '');
  var terverifikasi = t.email_verified === true || String(t.email_verified) === 'true';
  if (t.aud !== String(GOOGLE_CLIENT_ID).trim() || (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') ||
      !terverifikasi || !(Number(t.exp) * 1000 > Date.now())) {
    return { ok: false, error: 'token' };
  }
  var email = String(t.email || '').toLowerCase();
  if (emailBoleh_().indexOf(email) < 0) return { ok: false, error: 'email_ditolak', email: email };
  return { ok: true, sesi: buatSesi_(email), email: email, nama: String(t.name || t.given_name || '').slice(0, 60), hari: SESI_HARI };
}

/* ---------------- tarik: kirim semua data ke aplikasi ---------------- */

function tarik_(req) {
  var props = PropertiesService.getScriptProperties();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {};
  var g = gcalCoba_(ss, data, 'jika-perlu'); // tarik perubahan dari Google Calendar lebih dulu
  if (g.berubah) naikRev_();
  var rev = props.getProperty('rev') || '0';
  if (req.rev && String(req.rev) === rev) return { ok: true, same: true, rev: rev, gcal: gcalStatus_() };

  var out = { ok: true, versi: VERSI, sheetUrl: ss.getUrl() };
  var berubah = false;
  Object.keys(SKEMA).forEach(function (c) {
    var st = muat_(ss, data, c);
    if (st.dirty) { tulis_(st); berubah = true; } // baris yang Anda tambah manual diberi ID
    var list = [];
    st.rows.forEach(function (r) {
      var o = keObj_(st.def, r);
      if (o && sah_(c, o)) {
        if (SERVER_KOLOM[c]) { delete o.gid; delete o.sync; } // urusan server, aplikasi hanya perlu tahu "src"
        list.push(o);
      }
    });
    out[c] = list;
  });
  var meta = muatMeta_(ss);
  out.meta = metaObj_(meta);
  if (berubah) rev = naikRev_();
  out.rev = rev;
  out.gcal = gcalStatus_();
  return out;
}

/* ---------------- dorong: terapkan perubahan dari aplikasi ---------------- */

function dorong_(req) {
  var ops = req.ops;
  if (!Array.isArray(ops) || ops.length > 200) return { ok: false, error: 'format' };
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = {};
  var meta = null;
  var skipped = [];
  var stale = 0;
  var berubah = false;
  var agendaOps = false;

  ops.forEach(function (op, i) {
    if (!opSah_(op)) { skipped.push(i); return; }
    if (op.c === 'meta') {
      meta = meta || muatMeta_(ss);
      if (op.op === 'set') {
        META_KEYS.forEach(function (k) {
          if (op.data && Object.prototype.hasOwnProperty.call(op.data, k)) setMeta_(meta, k, op.data[k]);
        });
      }
      return;
    }
    if (op.c === 'agenda') agendaOps = true;
    var st = muat_(ss, data, op.c);
    var kol = kolomIdx_(st.def);
    var srv = SERVER_KOLOM[op.c] || [];
    if (op.op === 'delete') {
      var at = st.idx[op.id];
      if (at !== undefined) {
        if (srv.length) gcalAntrianHapus_(String(st.rows[at][kol.gid] || ''));
        st.rows.splice(at, 1); reindeks_(st); st.dirty = true;
      }
      return;
    }
    var row = keRow_(st.def, op.id, op.data || {});
    var ada = st.idx[op.id];
    if (ada !== undefined) {
      if (kol.upd !== undefined) { // transaksi, groceries, kalender, umroh: yang paling baru menang
        var lama = Number(st.rows[ada][kol.upd]) || 0;
        var baru = Number(row[kol.upd]) || 0;
        if (baru && lama > baru) { stale++; return; } // perubahan usang dari perangkat yang lama offline
      }
      srv.forEach(function (k) { row[kol[k]] = st.rows[ada][kol[k]]; }); // aplikasi tidak boleh menimpa kolom server
      // Tanda "berubah di aplikasi sejak sinkron terakhir": sync dijadikan negatif. Tidak bergantung pada jam perangkat.
      if (kol.sync !== undefined) row[kol.sync] = -(Math.abs(Number(row[kol.sync])) || 1);
      st.rows[ada] = row;
    } else {
      srv.forEach(function (k) { row[kol[k]] = (k === 'sync') ? 0 : ''; });
      st.idx[op.id] = st.rows.length;
      st.rows.push(row);
    }
    st.dirty = true;
  });

  // buang catatan terhapus yang sudah lama
  if (data.transaksi) {
    var st2 = data.transaksi, k2 = kolomIdx_(st2.def), batas = Date.now() - NISAN_HARI * 86400000;
    var sisa = st2.rows.filter(function (r) {
      return !(ya_(r[k2.hapus]) && (Number(r[k2.upd]) || 0) < batas);
    });
    if (sisa.length !== st2.rows.length) { st2.rows = sisa; reindeks_(st2); st2.dirty = true; }
  }

  Object.keys(data).forEach(function (c) {
    if (data[c].dirty) { tulis_(data[c]); berubah = true; }
  });
  if (meta && meta.dirty) { tulisMeta_(meta); berubah = true; }
  var g = gcalCoba_(ss, data, agendaOps ? 'paksa' : 'jika-perlu'); // kirim agenda ke Google Calendar
  if (g.berubah) berubah = true;
  var rev = berubah ? naikRev_() : (PropertiesService.getScriptProperties().getProperty('rev') || '0');
  return { ok: true, versi: VERSI, n: ops.length - skipped.length, skipped: skipped, stale: stale, rev: rev, gcal: gcalStatus_() };
}

function opSah_(op) {
  if (!op || typeof op !== 'object') return false;
  if (op.op !== 'set' && op.op !== 'delete') return false;
  if (op.c !== 'meta' && !SKEMA[op.c]) return false;
  if (typeof op.id !== 'string' || !/^[A-Za-z0-9_.~:@+-]{1,200}$/.test(op.id)) return false;
  if (op.op === 'set' && (!op.data || typeof op.data !== 'object')) return false;
  if (op.c === 'meta' && op.id !== 'app') return false;
  return true;
}

function sah_(c, o) {
  if (c === 'transaksi') return /^\d{4}-\d{2}-\d{2}$/.test(o.tanggal || '') && !!JENIS_TX[o.jenis] && isFinite(o.jumlah);
  if (c === 'kategori') return !!o.nama && (o.jenis === 'Pengeluaran' || o.jenis === 'Pemasukan');
  if (c === 'pos') return !!o.nama;
  if (c === 'belanja') return !!o.nama;
  if (c === 'agenda') return !!o.judul && /^\d{4}-\d{2}-\d{2}$/.test(o.tanggal || '');
  if (c === 'umroh') return !!o.nama;
  return false;
}

/* ---------------- Google Calendar (dua arah) ---------------- */
// Setiap agenda aplikasi menjadi acara di kalender "Kalender Keluarga", dan acara yang Anda buat
// atau ubah langsung di Google Calendar muncul di aplikasi. Kolom "ID Google Calendar" di tab Kalender
// berisi penghubungnya: awalan E: = acara tunggal, S: = acara berulang buatan aplikasi,
// I: = satu kejadian dari acara berulang yang dibuat di Google.

var GCAL_JEDA_MS = 45000;     // jarak minimum antar sinkron otomatis
var GCAL_MUNDUR_HARI = 30;    // jendela pemindaian ke belakang
var GCAL_MAJU_HARI = 365;     // jendela pemindaian ke depan
var GCAL_IMPOR_MUNDUR = 7;    // acara Google yang lebih lama dari ini tidak diimpor
var GCAL_ULANG_MAJU = 90;     // acara berulang buatan Google diimpor per kejadian sejauh ini
var GCAL_BATAS_KERJA = 25;    // jumlah tulis ke Google per putaran (sisanya di putaran berikut)
var GCAL_BATAS_IMPOR = 300;   // jumlah acara Google yang diimpor ke Kalender

function props_() { return PropertiesService.getScriptProperties(); }

function ringkas_(err) { return String((err && err.message) || err).slice(0, 240); }

function gcalAktif_() {
  var p = props_();
  return p.getProperty('gcal_on') === 'ya' && !!p.getProperty('gcal_id');
}

function gcalStatus_() {
  var p = props_();
  var o = { on: gcalAktif_(), id: p.getProperty('gcal_id') || '', nama: NAMA_KALENDER };
  var t = Number(p.getProperty('gcal_t')) || 0;
  if (t) o.terakhir = t;
  var e = p.getProperty('gcal_err');
  if (e) o.err = e;
  return o;
}

// Cari atau buat kalender keluarga. Memerlukan izin Google Calendar (dimintakan saat "siapkan" dijalankan).
function gcalSiap_() {
  var p = props_();
  var cal = null;
  var tetap = String(KALENDER_ID || '').trim();
  if (tetap) {
    cal = CalendarApp.getCalendarById(tetap);
    if (!cal) throw new Error('KALENDER_ID tidak ditemukan atau tidak bisa diakses oleh akun ini.');
  }
  if (!cal && p.getProperty('gcal_id')) cal = CalendarApp.getCalendarById(p.getProperty('gcal_id'));
  if (!cal) {
    var ada = CalendarApp.getOwnedCalendarsByName(NAMA_KALENDER);
    if (ada && ada.length) cal = ada[0];
  }
  if (!cal) {
    cal = CalendarApp.createCalendar(NAMA_KALENDER, {
      summary: 'Agenda dan tagihan keluarga dari aplikasi Keuangan Keluarga',
      timeZone: Session.getScriptTimeZone()
    });
  }
  p.setProperty('gcal_id', cal.getId());
  return cal;
}

// Aksi dari aplikasi: nyalakan, matikan, atau sinkronkan sekarang.
function gcal_(aksi) {
  var p = props_();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (aksi === 'off') {
    p.setProperty('gcal_on', 'tidak');
    return { ok: true, gcal: gcalStatus_(), rev: p.getProperty('rev') || '0' };
  }
  if (aksi === 'on') {
    try { gcalSiap_(); } catch (err) { return { ok: false, error: 'izin_kalender', msg: ringkas_(err) }; }
    p.setProperty('gcal_on', 'ya');
    p.deleteProperty('gcal_err');
  } else if (!gcalAktif_()) {
    return { ok: false, error: 'kalender_mati' };
  }
  var g = gcalCoba_(ss, {}, 'paksa');
  var rev = g.berubah ? naikRev_() : (p.getProperty('rev') || '0');
  return { ok: true, gcal: gcalStatus_(), rev: rev };
}

// Jalankan sinkron jika kalender menyala. Tidak pernah melempar galat: masalah Calendar tidak boleh
// mengganggu data keuangan. Hasilnya dicatat di gcal_err dan tampil di aplikasi.
function gcalCoba_(ss, data, mode) {
  var r = { berubah: false };
  if (!gcalAktif_()) return r;
  var p = props_();
  if (mode !== 'paksa' && Date.now() - (Number(p.getProperty('gcal_t')) || 0) < GCAL_JEDA_MS) return r;
  var st = null;
  try {
    st = muat_(ss, data, 'agenda');
    var h = gcalSinkron_(st);
    if (h.err) p.setProperty('gcal_err', h.err); else p.deleteProperty('gcal_err');
  } catch (err) {
    p.setProperty('gcal_err', ringkas_(err));
  }
  if (st && st.dirty) {
    try { tulis_(st); r.berubah = true; } catch (err2) { p.setProperty('gcal_err', ringkas_(err2)); }
  }
  p.setProperty('gcal_t', String(Date.now()));
  return r;
}

function bacaDaftar_(k) {
  try {
    var a = JSON.parse(props_().getProperty(k) || '[]');
    return Array.isArray(a) ? a : [];
  } catch (err) { return []; }
}

function simpanDaftar_(k, a) {
  props_().setProperty(k, JSON.stringify(a.slice(-80)));
}

// Agenda yang dihapus di aplikasi: acaranya di Google ikut dihapus pada sinkron berikutnya.
function gcalAntrianHapus_(gid) {
  if (!gid || !gcalAktif_()) return;
  var a = bacaDaftar_('gcal_hapus');
  if (a.indexOf(gid) < 0) { a.push(gid); simpanDaftar_('gcal_hapus', a); }
}

function tglStr_(d, tz, fmt) { return Utilities.formatDate(d, tz, fmt || 'yyyy-MM-dd'); }

function jamSah_(j) { j = String(j || ''); return /^\d{2}:\d{2}$/.test(j) ? j : ''; }

function waktu_(tgl, jam, tz) {
  var mulai = Utilities.parseDate(tgl + ' ' + jam, tz, 'yyyy-MM-dd HH:mm');
  return { mulai: mulai, selesai: new Date(mulai.getTime() + 3600000) };
}

function rekur_(u) {
  if (u !== 'mingguan' && u !== 'bulanan' && u !== 'tahunan') return null;
  var rec = CalendarApp.newRecurrence();
  if (u === 'mingguan') rec.addWeeklyRule();
  else if (u === 'bulanan') rec.addMonthlyRule();
  else rec.addYearlyRule();
  return rec;
}

function rupiah_(n) { return String(Math.round(Number(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function deskripsi_(r, kol) {
  var d = String(r[kol.catatan] || '');
  var j = r[kol.jumlah];
  if (j !== '' && j !== null && Number(j) > 0) d += (d ? '\n' : '') + 'Jumlah: Rp ' + rupiah_(j);
  return d;
}

function catatanDari_(desk) {
  var s = String(desk || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  s = s.replace(/(^|\n)Jumlah: Rp [\d.]+\s*$/, '').replace(/\s+$/, '');
  return s.slice(0, 500);
}

function evIsi_(ev, tz) {
  var sehari = ev.isAllDayEvent();
  var d = sehari ? ev.getAllDayStartDate() : ev.getStartTime();
  return {
    judul: (String(ev.getTitle() || '').trim() || '(tanpa judul)').slice(0, 500),
    tanggal: tglStr_(d, tz),
    jam: sehari ? '' : tglStr_(d, tz, 'HH:mm'),
    catatan: catatanDari_(ev.getDescription())
  };
}

// ingat = menit sebelum acara; -1 = tanpa pengingat; kosong = ikuti bawaan Google.
// 900, 3780, 9540 berarti "1, 3, 7 hari sebelumnya jam 09.00": untuk acara berjam, menit jam acara ditambahkan.
function setIngat_(sasaran, ingat, jam) {
  if (ingat === '' || ingat === null || ingat === undefined || !isFinite(Number(ingat))) return;
  sasaran.removeAllReminders();
  var m = Math.round(Number(ingat));
  if (m < 0) return;
  if (jam && (m === 900 || m === 3780 || m === 9540)) m += Number(jam.slice(0, 2)) * 60 + Number(jam.slice(3, 5));
  m = Math.min(m, 40320);
  sasaran.addPopupReminder(m);
  sasaran.addEmailReminder(m);
}

// Buat acara di Google dari satu baris Kalender. Mengembalikan ID penghubung baru (E:... atau S:...).
function gcalBuat_(cal, r, kol, tz) {
  var judul = String(r[kol.judul]);
  var tgl = String(r[kol.tanggal]);
  var jam = jamSah_(r[kol.jam]);
  var opt = { description: deskripsi_(r, kol) };
  var rec = rekur_(String(r[kol.ulang] || ''));
  var ev;
  if (jam) {
    var w = waktu_(tgl, jam, tz);
    ev = rec ? cal.createEventSeries(judul, w.mulai, w.selesai, rec, opt) : cal.createEvent(judul, w.mulai, w.selesai, opt);
  } else {
    var hari = Utilities.parseDate(tgl, tz, 'yyyy-MM-dd');
    ev = rec ? cal.createAllDayEventSeries(judul, hari, rec, opt) : cal.createAllDayEvent(judul, hari, opt);
  }
  setIngat_(ev, r[kol.ingat], jam);
  return (rec ? 'S:' : 'E:') + ev.getId();
}

function gcalHapusEvent_(cal, gid, tz) {
  var tipe = gid.charAt(0), id = gid.slice(2);
  if (tipe === 'E') {
    var ev = cal.getEventById(id);
    if (ev) ev.deleteEvent();
  } else if (tipe === 'S') {
    var sr = cal.getEventSeriesById(id);
    if (sr) sr.deleteEventSeries();
  } else if (tipe === 'I') {
    var q = id.split('#');
    var t = q[1] || '';
    var hari = Utilities.parseDate(t.slice(0, 4) + '-' + t.slice(4, 6) + '-' + t.slice(6, 8), tz, 'yyyy-MM-dd');
    cal.getEventsForDay(hari).forEach(function (e) { if (e.getId() === q[0]) e.deleteEvent(); });
  }
}

// Kirim perubahan satu baris ke acara Google yang sudah ada. Mengembalikan ID penghubung (bisa berubah).
function gcalUbah_(cal, r, kol, tz, ev, gid) {
  var tipe = gid.charAt(0), id = gid.slice(2);
  var jam = jamSah_(r[kol.jam]);
  var tgl = String(r[kol.tanggal]);
  var rec = tipe === 'I' ? null : rekur_(String(r[kol.ulang] || ''));
  var jenisBaru = rec ? 'S' : (tipe === 'I' ? 'I' : 'E');
  var jenisBeda = jenisBaru !== tipe;
  var harianBeda = ev ? (ev.isAllDayEvent() !== !jam) : false;
  if (jenisBeda || harianBeda) { // bentuknya berubah (tunggal <-> berulang, atau harian <-> berjam): buat ulang
    gcalHapusEvent_(cal, gid, tz);
    return gcalBuat_(cal, r, kol, tz);
  }
  var judul = String(r[kol.judul]);
  var desk = deskripsi_(r, kol);
  if (tipe === 'S') {
    var sr = cal.getEventSeriesById(id);
    if (!sr) return gcalBuat_(cal, r, kol, tz);
    sr.setTitle(judul);
    sr.setDescription(desk);
    if (jam) { var ws = waktu_(tgl, jam, tz); sr.setRecurrence(rec, ws.mulai, ws.selesai); }
    else sr.setRecurrence(rec, Utilities.parseDate(tgl, tz, 'yyyy-MM-dd'));
    setIngat_(sr, r[kol.ingat], jam);
    return gid;
  }
  var e = ev || (tipe === 'E' ? cal.getEventById(id) : null);
  if (!e) return gcalBuat_(cal, r, kol, tz);
  e.setTitle(judul);
  e.setDescription(desk);
  if (jam) { var w = waktu_(tgl, jam, tz); e.setTime(w.mulai, w.selesai); }
  else e.setAllDayDate(Utilities.parseDate(tgl, tz, 'yyyy-MM-dd'));
  setIngat_(e, r[kol.ingat], jam);
  if (tipe === 'I') return 'I:' + id.split('#')[0] + '#' + tgl.replace(/-/g, '');
  return gid;
}

// Satu putaran sinkron dua arah. Mengubah baris di st (agenda) dan menandainya dirty; penulisan dilakukan pemanggil.
function gcalSinkron_(st) {
  var p = props_();
  var cal = CalendarApp.getCalendarById(p.getProperty('gcal_id'));
  if (!cal) throw new Error('Kalender Google tidak ditemukan. Matikan lalu nyalakan lagi di aplikasi.');
  var tz = Session.getScriptTimeZone();
  var kol = kolomIdx_(st.def);
  var hasil = { baru: 0, ubah: 0, hapus: 0, kirim: 0, err: '' };
  var kerja = 0;
  var catatErr = function (err) { if (!hasil.err) hasil.err = ringkas_(err); };
  var hari = function (n) { return tglStr_(new Date(Date.now() + n * 86400000), tz); };
  var mulaiStr = hari(-GCAL_MUNDUR_HARI), akhirStr = hari(GCAL_MAJU_HARI);
  var ulangAkhirStr = hari(GCAL_ULANG_MAJU), imporStr = hari(-GCAL_IMPOR_MUNDUR);

  // 1. acara yang dihapus di aplikasi, dihapus juga di Google
  var sisaTunda = [];
  bacaDaftar_('gcal_hapus').forEach(function (g) {
    try { gcalHapusEvent_(cal, g, tz); } catch (err) { sisaTunda.push(g); catatErr(err); }
  });
  simpanDaftar_('gcal_hapus', sisaTunda);
  var tunda = {};
  sisaTunda.forEach(function (g) { tunda[g] = true; });

  // 2. pindai kalender
  var events = cal.getEvents(Utilities.parseDate(mulaiStr, tz, 'yyyy-MM-dd'), Utilities.parseDate(akhirStr, tz, 'yyyy-MM-dd'));
  var punya = {};
  st.rows.forEach(function (r) { var g = String(r[kol.gid] || ''); if (g) punya[g] = true; });
  var tunggal = {}, inst = {}, seri = {}, abaikan = {};
  events.forEach(function (ev) {
    var id = ev.getId();
    if (!ev.isRecurringEvent()) { tunggal['E:' + id] = ev; return; }
    if (punya['S:' + id]) { if (!seri['S:' + id]) seri['S:' + id] = ev; return; }
    if (punya['E:' + id]) { abaikan['E:' + id] = true; return; } // dijadikan berulang di Google: biarkan apa adanya
    inst['I:' + id + '#' + tglStr_(ev.isAllDayEvent() ? ev.getAllDayStartDate() : ev.getStartTime(), tz, 'yyyyMMdd')] = ev;
  });

  // 3. cocokkan setiap baris Kalender dengan acaranya
  var hapusIdx = {};
  st.rows.forEach(function (r, i) {
    var gid = String(r[kol.gid] || '');
    var tgl = String(r[kol.tanggal] || '');
    var ulang = String(r[kol.ulang] || '');
    try {
      if (!gid) { // baru di aplikasi
        if (kerja >= GCAL_BATAS_KERJA || (!ulang && tgl < mulaiStr)) return;
        if (!String(r[kol.judul] || '') || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) return;
        r[kol.gid] = gcalBuat_(cal, r, kol, tz);
        r[kol.sync] = Math.max(Date.now(), Number(r[kol.upd]) || 0);
        st.dirty = true; kerja++; hasil.kirim++;
        return;
      }
      if (tunda[gid]) return;
      var tipe = gid.charAt(0);
      var ev = tipe === 'S' ? seri[gid] : (tipe === 'E' ? tunggal[gid] : inst[gid]);
      if (!ev && !abaikan[gid]) {
        var adaLuar = false;
        if (tipe === 'E') {
          if (tgl < mulaiStr || tgl > akhirStr) return; // di luar jendela pemindaian: biarkan
          ev = cal.getEventById(gid.slice(2));
          adaLuar = !!ev;
        } else if (tipe === 'S') {
          adaLuar = !!cal.getEventSeriesById(gid.slice(2)); // ada, hanya tidak punya kejadian di jendela
        } else {
          if (tgl < mulaiStr || tgl > ulangAkhirStr) return;
        }
        if (!adaLuar) { hapusIdx[i] = true; hasil.hapus++; return; } // dihapus di Google
      }
      if (abaikan[gid]) return;
      var seriBaris = tipe === 'S';
      var upd = Number(r[kol.upd]) || 0, syncRaw = Number(r[kol.sync]) || 0, sync = Math.abs(syncRaw);
      var gUpd = ev ? ev.getLastUpdated().getTime() : 0;
      var dariG = ev ? evIsi_(ev, tz) : null;
      var appUbah = syncRaw < 0 || upd > sync; // negatif = diubah lewat aplikasi sejak sinkron terakhir
      var gUbah = false;
      if (dariG && gUpd > sync + 3000) {
        gUbah = dariG.judul !== String(r[kol.judul]).slice(0, 500) || dariG.catatan !== String(r[kol.catatan] || '') ||
          (!seriBaris && (dariG.tanggal !== tgl || dariG.jam !== String(r[kol.jam] || '')));
      }
      if (appUbah && gUbah) { if (gUpd > upd) appUbah = false; else gUbah = false; }
      if (gUbah) { // Google lebih baru: ambil ke aplikasi
        r[kol.judul] = dariG.judul;
        r[kol.catatan] = dariG.catatan;
        if (!seriBaris) {
          r[kol.tanggal] = dariG.tanggal; r[kol.jam] = dariG.jam;
          if (tipe === 'I') r[kol.gid] = 'I:' + gid.slice(2).split('#')[0] + '#' + dariG.tanggal.replace(/-/g, '');
        }
        r[kol.upd] = gUpd; r[kol.sync] = Date.now();
        st.dirty = true; hasil.ubah++;
      } else if (appUbah) { // aplikasi lebih baru: kirim ke Google
        if (kerja >= GCAL_BATAS_KERJA) return;
        r[kol.gid] = gcalUbah_(cal, r, kol, tz, ev, gid);
        r[kol.sync] = Math.max(Date.now(), upd);
        st.dirty = true; kerja++; hasil.kirim++;
      }
    } catch (err) { catatErr(err); }
  });
  if (hasil.hapus) {
    st.rows = st.rows.filter(function (r, i) { return !hapusIdx[i]; });
    reindeks_(st); st.dirty = true;
  }

  // 4. acara baru di Google: masuk ke aplikasi
  var ada = {};
  st.rows.forEach(function (r) { var g = String(r[kol.gid] || ''); if (g) ada[g] = true; });
  var jumlahImpor = st.rows.filter(function (r) { return r[kol.src] === 'g'; }).length;
  var impor = function (kunci, ev, batasStr) {
    if (ada[kunci] || tunda[kunci] || jumlahImpor >= GCAL_BATAS_IMPOR) return;
    var f = evIsi_(ev, tz);
    if (f.tanggal < imporStr || f.tanggal > batasStr) return;
    var gUpd = ev.getLastUpdated().getTime() || Date.now();
    var baris = st.def.kolom.map(function () { return ''; });
    baris[kol.judul] = f.judul; baris[kol.tanggal] = f.tanggal; baris[kol.jam] = f.jam;
    baris[kol.jenis] = 'Acara'; baris[kol.catatan] = f.catatan;
    baris[kol.ts] = gUpd; baris[kol.upd] = gUpd;
    baris[kol.id] = 'g' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
    baris[kol.gid] = kunci; baris[kol.src] = 'g'; baris[kol.sync] = Date.now();
    st.rows.push(baris); st.idx[baris[kol.id]] = st.rows.length - 1; st.dirty = true;
    ada[kunci] = true; jumlahImpor++; hasil.baru++;
  };
  Object.keys(tunggal).forEach(function (k) { try { impor(k, tunggal[k], akhirStr); } catch (err) { catatErr(err); } });
  Object.keys(inst).forEach(function (k) { try { impor(k, inst[k], ulangAkhirStr); } catch (err) { catatErr(err); } });
  return hasil;
}

/* ---------------- baca dan tulis sheet ---------------- */

function kolomIdx_(def) {
  var m = {};
  def.kolom.forEach(function (c, i) { m[c[0]] = i; });
  return m;
}

function ya_(v) {
  return v === true || String(v).toLowerCase() === 'ya' || String(v).toUpperCase() === 'TRUE';
}

function teksTanggal_(v, kunci) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), (kunci === 'tenggat' || kunci === 'berangkat') ? 'yyyy-MM' : 'yyyy-MM-dd');
  }
  return v;
}

function siapSheet_(ss, def) {
  var sh = ss.getSheetByName(def.sheet);
  if (!sh) sh = ss.insertSheet(def.sheet);
  var n = def.kolom.length;
  var kepala = sh.getRange(1, 1, 1, n).getValues()[0];
  var perlu = false;
  for (var i = 0; i < n; i++) if (kepala[i] !== def.kolom[i][1]) perlu = true;
  if (perlu) {
    formatKolom_(sh, def);
    sh.getRange(1, 1, 1, n).setValues([def.kolom.map(function (c) { return c[1]; })])
      .setFontWeight('bold').setBackground('#DDF0EB');
    sh.setFrozenRows(1);
  }
  return sh;
}

function formatKolom_(sh, def) {
  var baris = sh.getMaxRows();
  def.kolom.forEach(function (c, i) {
    var fmt = (c[2] === 's' || c[2] === 't' || c[2] === 'b') ? '@'
      : (c[0] === 'ts' || c[0] === 'upd' || c[0] === 'urut') ? '0' : '#,##0';
    sh.getRange(1, i + 1, baris, 1).setNumberFormat(fmt);
  });
}

function muat_(ss, data, c) {
  if (data[c]) return data[c];
  var def = SKEMA[c];
  var sh = siapSheet_(ss, def);
  var n = def.kolom.length;
  var kol = kolomIdx_(def);
  var last = sh.getLastRow();
  var mentah = last >= 2 ? sh.getRange(2, 1, last - 1, n).getValues() : [];
  var rows = [];
  var dirty = false;
  mentah.forEach(function (r) {
    var kosong = true;
    for (var i = 0; i < n; i++) {
      if (def.kolom[i][2] === 't') r[i] = teksTanggal_(r[i], def.kolom[i][0]);
      if (i !== kol.id && r[i] !== '' && r[i] !== null) kosong = false;
    }
    if (kosong) return;
    var id = r[kol.id] === null || r[kol.id] === undefined ? '' : String(r[kol.id]);
    if (id === '') { // baris yang Anda ketik langsung di spreadsheet
      id = 'g' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
      if (kol.ts !== undefined && !r[kol.ts]) r[kol.ts] = Date.now();
      dirty = true;
    }
    r[kol.id] = id;
    rows.push(r);
  });
  var st = { def: def, sh: sh, rows: rows, idx: {}, dirty: dirty, lamaBaris: Math.max(last - 1, 0) };
  reindeks_(st);
  data[c] = st;
  return st;
}

function reindeks_(st) {
  var id = kolomIdx_(st.def).id;
  st.idx = {};
  st.rows.forEach(function (r, i) { st.idx[String(r[id])] = i; });
}

function tulis_(st) {
  var n = st.def.kolom.length;
  var total = st.rows.length;
  var perlu = total + 2;
  if (st.sh.getMaxRows() < perlu + 50) {
    st.sh.insertRowsAfter(st.sh.getMaxRows(), perlu + 200 - st.sh.getMaxRows());
    formatKolom_(st.sh, st.def);
  }
  if (total > 0) st.sh.getRange(2, 1, total, n).setValues(st.rows);
  if (st.lamaBaris > total) st.sh.getRange(2 + total, 1, st.lamaBaris - total, n).clearContent();
  st.lamaBaris = total;
  st.dirty = false;
}

function keObj_(def, row) {
  var o = {};
  for (var i = 0; i < def.kolom.length; i++) {
    var k = def.kolom[i][0], t = def.kolom[i][2], v = row[i];
    if (t === 'n') {
      var x = (v === '' || v === null) ? 0 : Number(v);
      o[k] = isFinite(x) ? x : 0;
    } else if (t === 'z') {
      var y = (v === '' || v === null) ? null : Number(v);
      o[k] = (y !== null && isFinite(y)) ? y : null;
    } else if (t === 'b') {
      if (ya_(v)) o[k] = true;
    } else {
      var s = (v === null || v === undefined) ? '' : String(v);
      if (s !== '') o[k] = s;
    }
  }
  return o.id ? o : null;
}

function keRow_(def, id, d) {
  return def.kolom.map(function (c) {
    var k = c[0], t = c[2], v = k === 'id' ? id : d[k];
    if (t === 'n') { var x = Number(v); return isFinite(x) ? x : 0; }
    if (t === 'z') { return (v === null || v === undefined || v === '' || !isFinite(Number(v))) ? '' : Number(v); }
    if (t === 'b') return (v === true || v === 'ya') ? 'ya' : '';
    return (v === null || v === undefined) ? '' : String(v).slice(0, 500);
  });
}

/* ---------------- pengaturan (nama pengguna, dll) ---------------- */

function muatMeta_(ss) {
  var sh = ss.getSheetByName(META_SHEET);
  if (!sh) {
    sh = ss.insertSheet(META_SHEET);
    sh.getRange(1, 1, sh.getMaxRows(), 2).setNumberFormat('@');
    sh.getRange(1, 1, 1, 2).setValues([['Kunci', 'Nilai']]).setFontWeight('bold').setBackground('#DDF0EB');
    sh.setFrozenRows(1);
  }
  var last = sh.getLastRow();
  var rows = last >= 2 ? sh.getRange(2, 1, last - 1, 2).getValues() : [];
  return { sh: sh, rows: rows.filter(function (r) { return r[0] !== ''; }), dirty: false, lama: Math.max(last - 1, 0) };
}

function setMeta_(meta, k, v) {
  var nilai = (v === true) ? 'ya' : (v === false || v === null || v === undefined) ? '' : String(v).slice(0, 60);
  for (var i = 0; i < meta.rows.length; i++) {
    if (meta.rows[i][0] === k) { meta.rows[i][1] = nilai; meta.dirty = true; return; }
  }
  meta.rows.push([k, nilai]);
  meta.dirty = true;
}

function metaObj_(meta) {
  var o = {};
  meta.rows.forEach(function (r) {
    if (META_KEYS.indexOf(r[0]) < 0) return;
    if (r[1] === 'ya') o[r[0]] = true;
    else if (r[1] !== '') o[r[0]] = String(r[1]);
  });
  return o;
}

function tulisMeta_(meta) {
  if (meta.rows.length) meta.sh.getRange(2, 1, meta.rows.length, 2).setValues(meta.rows);
  if (meta.lama > meta.rows.length) meta.sh.getRange(2 + meta.rows.length, 1, meta.lama - meta.rows.length, 2).clearContent();
  meta.lama = meta.rows.length;
  meta.dirty = false;
}

/* ---------------- versi data (agar aplikasi tidak menarik ulang tanpa perlu) ---------------- */

function naikRev_() {
  var props = PropertiesService.getScriptProperties();
  var baru = String((Number(props.getProperty('rev')) || 0) + 1);
  props.setProperty('rev', baru);
  return baru;
}

// Dipanggil otomatis saat Anda mengedit spreadsheet langsung (dipasang oleh "siapkan").
function saatDiedit() {
  naikRev_();
}

/* ---------------- jalankan sekali dari editor ---------------- */

function siapkan() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SKEMA).forEach(function (c) {
    var sh = siapSheet_(ss, SKEMA[c]);
    formatKolom_(sh, SKEMA[c]);
  });
  muatMeta_(ss);
  siapRingkasan_(ss);
  ['Sheet1', 'Sheet 1', 'Lembar1', 'Lembar 1'].forEach(function (nama) {
    var s = ss.getSheetByName(nama);
    if (s && s.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s);
  });
  try {
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === 'saatDiedit') ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger('saatDiedit').forSpreadsheet(ss).onEdit().create();
  } catch (err) {
    // Pemicu hanya mempercepat tampilnya edit manual di aplikasi. Aplikasi tetap berjalan tanpanya.
  }
  // Google Calendar: buat "Kalender Keluarga" dan nyalakan sinkron (hanya saat belum pernah diatur).
  // Menjalankan ini juga memunculkan permintaan izin Google Calendar dan "hubungkan ke layanan eksternal".
  var kalender = '';
  try {
    gcalSiap_();
    if (props_().getProperty('gcal_on') === null) props_().setProperty('gcal_on', 'ya');
    kalender = ' Kalender "' + NAMA_KALENDER + '" siap.';
  } catch (err) {
    kalender = ' Google Calendar belum aktif: ' + ringkas_(err);
  }
  if (modeMasuk_()) rahasiaSesi_();
  naikRev_();
  ss.toast('Selesai.' + kalender + ' Sekarang terbitkan sebagai Web app (lihat README).', 'Keuangan Keluarga', 10);
}

function huruf_(i) {
  var s = '';
  for (i = i + 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

function siapRingkasan_(ss) {
  if (ss.getSheetByName('Ringkasan')) return;
  var sh = ss.insertSheet('Ringkasan');
  var tx = SKEMA.transaksi, kol = kolomIdx_(tx), nama = tx.sheet;
  var rng = function (k) { var h = huruf_(kol[k]); return nama + '!$' + h + ':$' + h; };
  var jumlahSum = function (jenis, baris) {
    return '=SUMIFS(' + rng('jumlah') + ',' + rng('jenis') + ',"' + jenis + '",' + rng('tanggal') + ',$A' + baris + '&"*",' + rng('hapus') + ',"<>ya")';
  };
  sh.getRange(1, 1, 1, 5).setValues([['Bulan', 'Pemasukan', 'Pengeluaran', 'Ditabung', 'Sisa kas']])
    .setFontWeight('bold').setBackground('#DDF0EB');
  var f = [];
  for (var i = 11; i >= 0; i--) {
    var b = 2 + (11 - i);
    f.push(['=TEXT(EDATE(TODAY(),-' + i + '),"yyyy-mm")', jumlahSum('Pemasukan', b), jumlahSum('Pengeluaran', b),
      jumlahSum('Tabungan', b), '=B' + b + '-C' + b + '-D' + b]);
  }
  sh.getRange(2, 1, 12, 5).setFormulas(f);
  sh.getRange(2, 2, 12, 4).setNumberFormat('#,##0;[Red]-#,##0');
  sh.setFrozenRows(1);
  sh.setColumnWidths(1, 5, 120);
}
