const I18N = {
  en: {
    sub: "Doesn't always work :v",
    pick: 'Pick a video',
    dropInit: 'Processed on your phone, nothing gets uploaded.',
    dDur: 'Duration', dRes: 'Resolution', dSize: 'Size', dParts: 'Result',
    tlAria: 'Video parts',
    setLabel: 'Settings', setChange: 'Change',
    go: 'Start', stop: 'Stop',
    sheetClose: 'Close', sheetDone: 'Done',
    lgMode: 'Process mode', modeGood: 'Best (slower)', modeFast: 'Fast',
    modeNote: 'Best is sharper but takes longer.',
    lgSize: 'Target file size',
    sizeNote: 'Bigger is sharper, but WhatsApp may recompress if it is too big. Check with the test below.',
    lgFps: 'Frame rate', fpsOrig: 'Original',
    fpsNote: "Original follows the video's fps (30 or 60).",
    lgSeg: 'Cut every how many seconds', secN: '{n} sec',
    segNote: 'Match your Status duration limit.',
    lgManual: 'Manual bitrate (optional)', manualPh: 'kbps, leave empty for auto',
    manualNote: 'If filled, the size target is ignored. 1800 kbps is roughly 7 MB per 30 seconds.',
    lgTest: 'Test quality on WhatsApp', testBtn: 'Make 4 test clips',
    testNote: 'Makes four 10-second clips at different bitrates. Post them all to Status and see which stay sharp.',
    langTitle: 'Choose language',
    errUnread: "The browser can't read this video. Move it to Downloads or Gallery (not from Drive or chat), pick it again and process right away.",
    errMem: 'Not enough phone memory. Try Fast mode, 30 fps, and close other apps.',
    errLoad: 'The video engine failed to load. Check your internet, reload, or use the latest Chrome.',
    errFail: 'Failed: {m}',
    reportBtn: 'Copy error report', reportDone: 'Copied, send it to the developer',
    reportPrompt: 'Copy this text and send it to the developer:',
    partsTest: '{n} test clips', partsMany: '{n} parts', partsOne: '1 file, not split',
    tlPart: 'Part {n}',
    sumOrig: 'original fps', sumGood: 'Best', sumFast: 'Fast', sumSec: '{n} s',
    lvMode: '{m} mode',
    probing: "Can't preview this video, checking it with the video engine (downloads ±32 MB, once)...",
    prep: 'Preparing video...', prepEngine: 'Preparing video engine (±32 MB, once)...',
    failTitle: "Can't open the video",
    failRead: 'Could not read the video. It may still be downloading, damaged, or in an unusual format. Check your internet too.',
    changeVideo: 'Change video',
    working: 'Processing part {i} of {n} ({lvl}, {kb} kbps). Keep this page open.',
    workingTest: 'Processing test clip {tag} ({lvl}, {kb} kbps). Keep this page open.',
    retryTag: 'Retry',
    unreadRetry: 'File is hard to read directly, trying another way...',
    memDown: 'Memory is tight, stepping down to {lvl}...',
    bigAgain: 'Part {i} is still {size}, redoing at {kb} kbps...',
    doneTag: 'Done',
    doneTest: 'Done. Post all four to Status and see which one stays sharp.',
    doneDown: 'Done, but stepped down to {lvl} because phone memory is tight.',
    done: 'Done. Save them, then post to Status in order starting from part 1.',
    cancelled: 'Cancelled.',
    resChecking: 'Checking result...',
    resOk: 'Ready to upload, duration {d}',
    resBad: "Duration doesn't match, try processing again",
    resNoPreview: "Can't preview here, but the file can still be saved and tried on WhatsApp",
    share: 'Share', save: 'Save',
    inApp: 'Looks like this was opened inside another app. Open it in Chrome (iPhone: Safari) so everything works.'
  },
  id: {
    sub: 'Tidak selalu berhasil :v',
    pick: 'Pilih video',
    dropInit: 'Diproses di HP, gak diupload ke mana-mana.',
    dDur: 'Durasi', dRes: 'Resolusi', dSize: 'Ukuran', dParts: 'Hasil',
    tlAria: 'Pembagian bagian video',
    setLabel: 'Setelan', setChange: 'Ubah',
    go: 'Gas proses', stop: 'Stop',
    sheetClose: 'Tutup', sheetDone: 'Selesai',
    lgMode: 'Mode proses', modeGood: 'Bagus (lama)', modeFast: 'Cepat',
    modeNote: 'Bagus lebih tajam tapi lebih lama.',
    lgSize: 'Target ukuran file',
    sizeNote: 'Makin besar makin tajam, tapi WA bisa kompres ulang kalau kegedean. Cek lewat uji di bawah.',
    lgFps: 'Frame rate', fpsOrig: 'Asli',
    fpsNote: 'Asli = ikut fps videonya (30 atau 60).',
    lgSeg: 'Potong per berapa detik', secN: '{n} detik',
    segNote: 'Samain sama batas durasi Status kamu.',
    lgManual: 'Bitrate manual (opsional)', manualPh: 'kbps, kosongin = otomatis',
    manualNote: 'Kalau diisi, target ukuran gak dipakai. 1800 kbps kira-kira 7 MB per 30 detik.',
    lgTest: 'Uji kualitas di WA', testBtn: 'Bikin 4 klip uji',
    testNote: 'Bikin 4 klip 10 detik dengan bitrate beda. Upload semuanya ke Status, lihat mana yang masih tajam.',
    langTitle: 'Pilih bahasa',
    errUnread: 'Video gak bisa dibaca browser. Pindahin ke Download atau Galeri (bukan dari Drive/chat), pilih ulang, langsung proses.',
    errMem: 'Memori HP gak kuat. Coba mode Cepat, 30 fps, tutup aplikasi lain.',
    errLoad: 'Mesin video gagal dimuat. Cek internet, muat ulang, atau pakai Chrome terbaru.',
    errFail: 'Gagal: {m}',
    reportBtn: 'Salin laporan error', reportDone: 'Udah disalin, kirim ke pembuatnya',
    reportPrompt: 'Salin teks ini lalu kirim ke pembuatnya:',
    partsTest: '{n} klip uji', partsMany: '{n} bagian', partsOne: '1 file, gak dipotong',
    tlPart: 'Bagian {n}',
    sumOrig: 'fps asli', sumGood: 'Bagus', sumFast: 'Cepat', sumSec: '{n} dtk',
    lvMode: 'Mode {m}',
    probing: 'Preview gak bisa, ngecek lewat mesin video (download ±32 MB, sekali aja)...',
    prep: 'Nyiapin video...', prepEngine: 'Nyiapin mesin video (±32 MB, sekali aja)...',
    failTitle: 'Videonya gak bisa dibuka',
    failRead: 'Video gak kebaca. Mungkin belum kelar didownload, rusak, atau formatnya aneh. Cek juga internet.',
    changeVideo: 'Ganti video',
    working: 'Ngolah bagian {i} dari {n} ({lvl}, {kb} kbps). Jangan ditutup.',
    workingTest: 'Ngolah klip uji {tag} ({lvl}, {kb} kbps). Jangan ditutup.',
    retryTag: 'Ulang',
    unreadRetry: 'File susah dibaca langsung, coba cara lain...',
    memDown: 'RAM mepet, turun ke {lvl}...',
    bigAgain: 'Bagian {i} masih {size}, diulang di {kb} kbps...',
    doneTag: 'Selesai',
    doneTest: 'Kelar. Upload keempatnya ke Status, lihat yang mana masih tajam.',
    doneDown: 'Kelar, tapi diturunin ke {lvl} karena memori HP mepet.',
    done: 'Kelar. Simpan, terus upload ke Status urut dari bagian 1.',
    cancelled: 'Dibatalin.',
    resChecking: 'Ngecek hasil...',
    resOk: 'Siap upload, durasi {d}',
    resBad: 'Durasinya meleset, coba proses ulang',
    resNoPreview: 'Preview gak bisa diputar di sini, tapi file tetap bisa disimpan dan dicoba di WA',
    share: 'Bagikan', save: 'Simpan',
    inApp: 'Kayaknya dibuka dari dalam aplikasi lain. Buka lewat Chrome (iPhone: Safari) biar fiturnya jalan.'
  },
  ms: {
    sub: 'Tak selalu menjadi :v',
    pick: 'Pilih video',
    dropInit: 'Diproses dalam telefon, tiada apa dimuat naik.',
    dDur: 'Tempoh', dRes: 'Resolusi', dSize: 'Saiz', dParts: 'Hasil',
    tlAria: 'Pembahagian bahagian video',
    setLabel: 'Tetapan', setChange: 'Ubah',
    go: 'Mula proses', stop: 'Henti',
    sheetClose: 'Tutup', sheetDone: 'Selesai',
    lgMode: 'Mod proses', modeGood: 'Terbaik (lambat)', modeFast: 'Pantas',
    modeNote: 'Terbaik lebih tajam tetapi lebih lama.',
    lgSize: 'Sasaran saiz fail',
    sizeNote: 'Lebih besar lebih tajam, tetapi WhatsApp mungkin memampat semula jika terlalu besar. Semak dengan ujian di bawah.',
    lgFps: 'Kadar bingkai', fpsOrig: 'Asal',
    fpsNote: 'Asal = ikut fps video (30 atau 60).',
    lgSeg: 'Potong setiap berapa saat', secN: '{n} saat',
    segNote: 'Samakan dengan had tempoh Status anda.',
    lgManual: 'Bitrate manual (pilihan)', manualPh: 'kbps, kosongkan untuk automatik',
    manualNote: 'Jika diisi, sasaran saiz tidak digunakan. 1800 kbps lebih kurang 7 MB setiap 30 saat.',
    lgTest: 'Uji kualiti di WhatsApp', testBtn: 'Buat 4 klip ujian',
    testNote: 'Menghasilkan 4 klip 10 saat dengan bitrate berbeza. Muat naik semuanya ke Status dan lihat yang mana masih tajam.',
    langTitle: 'Pilih bahasa',
    errUnread: 'Video tidak dapat dibaca pelayar. Alihkan ke folder Muat Turun atau Galeri (bukan dari Drive/sembang), pilih semula dan terus proses.',
    errMem: 'Memori telefon tidak cukup. Cuba mod Pantas, 30 fps, dan tutup aplikasi lain.',
    errLoad: 'Enjin video gagal dimuatkan. Semak internet, muat semula, atau guna Chrome terkini.',
    errFail: 'Gagal: {m}',
    reportBtn: 'Salin laporan ralat', reportDone: 'Disalin, hantar kepada pembangun',
    reportPrompt: 'Salin teks ini dan hantar kepada pembangun:',
    partsTest: '{n} klip ujian', partsMany: '{n} bahagian', partsOne: '1 fail, tidak dipotong',
    tlPart: 'Bahagian {n}',
    sumOrig: 'fps asal', sumGood: 'Terbaik', sumFast: 'Pantas', sumSec: '{n} s',
    lvMode: 'Mod {m}',
    probing: 'Pratonton tidak dapat dibuka, menyemak melalui enjin video (muat turun ±32 MB, sekali sahaja)...',
    prep: 'Menyediakan video...', prepEngine: 'Menyediakan enjin video (±32 MB, sekali sahaja)...',
    failTitle: 'Video tidak dapat dibuka',
    failRead: 'Video tidak dapat dibaca. Mungkin belum siap dimuat turun, rosak, atau formatnya pelik. Semak juga internet.',
    changeVideo: 'Tukar video',
    working: 'Memproses bahagian {i} daripada {n} ({lvl}, {kb} kbps). Jangan tutup halaman.',
    workingTest: 'Memproses klip ujian {tag} ({lvl}, {kb} kbps). Jangan tutup halaman.',
    retryTag: 'Cuba lagi',
    unreadRetry: 'Fail sukar dibaca terus, mencuba cara lain...',
    memDown: 'Memori hampir penuh, turun ke {lvl}...',
    bigAgain: 'Bahagian {i} masih {size}, diulang pada {kb} kbps...',
    doneTag: 'Siap',
    doneTest: 'Siap. Muat naik keempat-empatnya ke Status dan lihat yang mana masih tajam.',
    doneDown: 'Siap, tetapi diturunkan ke {lvl} kerana memori telefon terhad.',
    done: 'Siap. Simpan, kemudian muat naik ke Status mengikut urutan bermula bahagian 1.',
    cancelled: 'Dibatalkan.',
    resChecking: 'Menyemak hasil...',
    resOk: 'Sedia dimuat naik, tempoh {d}',
    resBad: 'Tempoh tidak sepadan, cuba proses semula',
    resNoPreview: 'Pratonton tidak boleh dimainkan di sini, tetapi fail masih boleh disimpan dan dicuba di WhatsApp',
    share: 'Kongsi', save: 'Simpan',
    inApp: 'Nampaknya dibuka dari dalam aplikasi lain. Buka melalui Chrome (iPhone: Safari) supaya semuanya berfungsi.'
  }
};

let LANG = 'en';

const t = (k, v) => {
  let s = (I18N[LANG] && I18N[LANG][k]) || I18N.en[k] || k;
  if (v) for (const x in v) s = s.split('{' + x + '}').join(v[x]);
  return s;
};

function applyLang() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i]').forEach(el => {
    el.textContent = t(el.dataset.i, el.dataset.n ? { n: el.dataset.n } : null);
  });
  document.querySelectorAll('[data-i-ph]').forEach(el => { el.placeholder = t(el.dataset.iPh); });
  document.querySelectorAll('[data-i-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.iAria)));
  const b = document.getElementById('langBtn');
  if (b) b.textContent = LANG.toUpperCase();
  document.querySelectorAll('.langopt').forEach(o => o.setAttribute('aria-pressed', o.dataset.lang === LANG));
}

const LANG_KEY = 'swhd-lang';
const savedLang = () => { try { return localStorage.getItem(LANG_KEY); } catch (_) { return null; } };
const guessLang = () => {
  const n = (navigator.language || '').toLowerCase();
  return n.startsWith('id') ? 'id' : n.startsWith('ms') ? 'ms' : 'en';
};

function setLang(code, save) {
  LANG = I18N[code] ? code : 'en';
  if (save) { try { localStorage.setItem(LANG_KEY, LANG); } catch (_) {} }
  applyLang();
  if (window.onLang) window.onLang();
}

function initLang() {
  const dlg = document.getElementById('langDlg');
  const show = () => (dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''));
  const hide = () => (dlg.close ? dlg.close() : dlg.removeAttribute('open'));
  document.querySelectorAll('.langopt').forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang, true); hide(); }));
  document.getElementById('langBtn').addEventListener('click', show);
  dlg.addEventListener('cancel', e => { if (!savedLang()) e.preventDefault(); });
  dlg.addEventListener('click', e => { if (e.target === dlg && savedLang()) hide(); });
  const saved = savedLang();
  setLang(saved && I18N[saved] ? saved : guessLang(), false);
  if (!saved) show();
}
