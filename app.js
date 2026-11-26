const APP_VERSION = '1.2';
const $ = s => document.querySelector(s);
const S = {
  file: null, url: null, dur: 0, fps: 30, seg: 30, target: 7, good: 1, manual: 0, total: 1,
  noMount: false, picking: false, probing: false, busy: false, cancel: false,
  ff: null, cur: null, lvl: '', logs: [], outUrls: []
};

const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const mb = b => (b / 1048576).toFixed(1) + ' MB';
const say = (t, err) => { const el = $('#status'); el.textContent = t; el.classList.toggle('err', !!err); };
const hint = t => { $('#dropHint').textContent = t; };

/* ---------- pesan error yang gampang dimengerti ---------- */
const errText = err => String((err && err.message) || err);
const unreadable = err => /NotReadable|could not be read/i.test(errText(err));
const friendly = err => {
  const m = errText(err);
  if (unreadable(err)) return 'Yah, videonya gak bisa dibaca browser. Pindahin dulu ke folder Download atau Galeri (jangan dari Drive atau chat), lalu pilih ulang dan langsung proses.';
  if (/memory|Aborted|out of bounds|allocation|RangeError/i.test(m)) return 'Yah, memori HP-nya gak kuat. Coba Mode Cepat, 30 fps, tutup aplikasi lain, lalu ulangi.';
  if (/Failed to fetch|NetworkError|Load failed|failed to import|ffmpeg-core/i.test(m)) return 'Mesin videonya gagal dimuat. Cek internet, muat ulang halaman, atau coba pakai Chrome terbaru.';
  return 'Yah, gagal: ' + m;
};

function clearReport() { const b = $('#reportBtn'); if (b) b.remove(); }
function showReport(err) {
  clearReport();
  const btn = document.createElement('button');
  btn.id = 'reportBtn'; btn.type = 'button'; btn.className = 'cancel';
  btn.textContent = 'Salin laporan error';
  btn.onclick = async () => {
    const text = [
      'SW HD v' + APP_VERSION,
      'Browser: ' + navigator.userAgent,
      'Video: ' + (S.file ? mb(S.file.size) + ', ' + fmt(S.dur) : '-'),
      'Setelan: ' + S.fps + 'fps, potong ' + S.seg + 'd, target ' + S.target + 'MB, manual ' + (S.manual || '-') + ', mode ' + (S.good ? 'Bagus' : 'Cepat'),
      'Level: ' + (S.lvl || '-'),
      'Error: ' + errText(err),
      'Log: ' + S.logs.slice(-12).join(' | ')
    ].join('\n');
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Udah disalin, kirim ke pembuatnya ya'; }
    catch (_) { window.prompt('Salin teks ini lalu kirim ke pembuatnya:', text); }
  };
  $('#status').after(btn);
}

/* ---------- rencana potongan ---------- */
const bitrate = len => S.manual > 0
  ? Math.min(20000, Math.max(300, S.manual))
  : Math.max(400, Math.min(4500, Math.floor(S.target * 7600 / len) - 128));

const plan = () => {
  const n = Math.max(1, Math.ceil(S.dur / S.seg - 0.05));
  return Array.from({ length: n }, (_, i) => ({ i, start: i * S.seg, len: Math.min(S.seg, S.dur - i * S.seg) }));
};

function renderPlan(force) {
  if (S.busy && !force) return;
  const parts = plan(), tl = $('#tl');
  tl.innerHTML = '';
  parts.forEach(p => {
    const li = document.createElement('li');
    li.style.flex = p.len;
    li.innerHTML = '<span>Bagian ' + (p.i + 1) + '</span>';
    tl.appendChild(li);
  });
  $('#mParts').textContent = parts.length + (parts.length > 1 ? ' bagian' : ' file utuh (gak dipotong)');
}

function bindSeg(id, key) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || S.busy) return;
    S[key] = +b.dataset.v;
    $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    if (S.dur) renderPlan();
  });
}
bindSeg('#fpsSeg', 'fps'); bindSeg('#lenSeg', 'seg'); bindSeg('#sizeSeg', 'target'); bindSeg('#qSeg', 'good');

$('#kbIn').addEventListener('input', e => {
  $('#sizeSeg').style.opacity = e.target.value.trim() ? '0.45' : '1';
});

/* ---------- mesin video ---------- */
async function load() {
  if (S.ff) return S.ff;
  const f = new FFmpegWASM.FFmpeg();
  f.on('log', ({ message }) => { S.logs.push(message); if (S.logs.length > 60) S.logs.shift(); });
  f.on('progress', ({ progress }) => {
    if (!S.cur) return;
    const pct = Math.min(100, Math.max(0, progress * 100));
    S.cur.style.setProperty('--p', pct + '%');
    S.cur.firstChild.textContent = Math.round(pct) + '%';
  });
  const base = new URL('lib/', location.href).href;
  await f.load({ coreURL: base + 'ffmpeg-core.js', wasmURL: base + 'ffmpeg-core.wasm' });
  S.ff = f;
  return f;
}

async function attach(ff) {
  if (!S.noMount) {
    try {
      try { await ff.createDir('/in'); } catch (_) {}
      await ff.mount('WORKERFS', { files: [S.file] }, '/in');
      return { path: '/in/' + S.file.name, mounted: true };
    } catch (_) {}
  }
  await ff.writeFile('in', await FFmpegUtil.fetchFile(S.file));
  return { path: 'in', mounted: false };
}
async function detach(ff, src) {
  if (!ff || !src) return;
  try { src.mounted ? await ff.unmount('/in') : await ff.deleteFile('in'); } catch (_) {}
}

// Cadangan kalau browser gak bisa memutar videonya (misal HEVC/MKV): baca info lewat ffmpeg.
async function probe() {
  const ff = await load();
  const src = await attach(ff);
  S.logs = [];
  try { await ff.exec(['-hide_banner', '-i', src.path]); } catch (_) {}
  await detach(ff, src);
  const log = S.logs.join('\n');
  const d = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(log);
  const v = /,\s*(\d{2,5})x(\d{2,5})[\s,\[]/.exec(log);
  if (!d) return null;
  return { dur: +d[1] * 3600 + +d[2] * 60 + +d[3], w: v ? +v[1] : 0, h: v ? +v[2] : 0 };
}

/* ---------- pilih video ---------- */
function failPick(msg) {
  S.dur = 0;
  $('#stage').hidden = true;
  $('#go').disabled = true;
  $('#drop').classList.remove('small');
  $('#dropTitle').textContent = 'Videonya gak bisa dibuka';
  hint(msg);
}

function ready(info) {
  const f = S.file;
  S.dur = info.dur;
  $('#mDur').textContent = fmt(S.dur);
  $('#mRes').textContent = info.w && info.h ? info.w + 'x' + info.h : '-';
  $('#mSize').textContent = mb(f.size) + ' (' + Math.round(f.size * 8 / 1000 / S.dur) + ' kbps)';
  $('#drop').classList.add('small');
  $('#dropTitle').textContent = f.name;
  hint('Ganti video');
  $('#stage').hidden = false;
  $('#go').disabled = false;
  renderPlan();
}

async function viaProbe() {
  if (S.probing || S.dur) return;
  S.probing = true;
  hint('Preview gak bisa dibuka di browser ini, ngecek lewat mesin video (download sekali, ±32 MB)...');
  try {
    const info = await probe();
    if (!info) throw new Error('info video kosong');
    $('#stage .frame').style.display = 'none';
    ready(info);
  } catch (err) {
    console.error(err);
    failPick('Videonya gak kebaca. Mungkin belum beres di-download, rusak, atau formatnya gak umum. Cek juga internetnya.');
  }
  S.probing = false;
}

$('#file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f || S.busy || S.picking) { e.target.value = ''; return; }
  S.picking = true;
  if (S.url) URL.revokeObjectURL(S.url);
  S.outUrls.forEach(URL.revokeObjectURL); S.outUrls = [];
  $('#res').innerHTML = ''; clearReport(); say('');
  S.noMount = false; S.dur = 0;
  $('#stage .frame').style.display = '';
  // Salin ke memori selagi izin baca file masih aktif. Di Android izin ini bisa hilang
  // di tengah proses (NotReadableError), terutama untuk file dari Drive, Foto, atau chat.
  let file = f;
  if (f.size < 200 * 1048576) {
    hint('Lagi nyiapin videonya, bentar ya...');
    try { file = new File([await f.arrayBuffer()], f.name, { type: f.type }); } catch (_) { file = f; }
  }
  e.target.value = '';
  S.picking = false;
  S.file = file; S.url = URL.createObjectURL(file);
  const pv = $('#pv');
  pv.onloadedmetadata = () => {
    if (S.dur) return;
    if (!isFinite(pv.duration) || pv.duration <= 0) return viaProbe();
    ready({ dur: pv.duration, w: pv.videoWidth, h: pv.videoHeight });
  };
  pv.onerror = () => { if (!S.dur) viaProbe(); };
  pv.src = S.url;
});

/* ---------- encode ---------- */
const levels = () => {
  const L = [
    { h: 1080, fps: S.fps, q: S.good },
    { h: 720, fps: 30, q: 0 },
    { h: 540, fps: 30, q: 0 }
  ], seen = new Set();
  return L.filter(l => { const k = l.h + '/' + l.fps + '/' + l.q; return !seen.has(k) && seen.add(k); })
    .map(l => ({ ...l, label: l.h + 'p ' + l.fps + 'fps • Mode ' + (l.q ? 'Bagus' : 'Cepat') }));
};

const filter = l => {
  const long = Math.round(l.h * 16 / 9 / 2) * 2;
  const sharp = l.q ? ',unsharp=5:5:0.55:5:5:0.0' : '';
  return 'fps=' + l.fps + ",scale='min(iw,if(gt(iw,ih)," + long + ',' + l.h + "))':'min(ih,if(gt(iw,ih)," + l.h + ',' + long + "))':flags=lanczos:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1" + sharp;
};

const encode = (ff, path, p, name, lvl, kb) => ff.exec([
  '-ss', String(p.start), '-i', path, '-t', String(p.len),
  '-vf', filter(lvl),
  '-map_metadata', '-1',
  '-c:v', 'libx264',
  '-preset', lvl.q ? 'veryfast' : 'superfast',
  '-profile:v', 'high',
  '-level:v', lvl.fps > 30 ? '4.2' : '4.0',
  '-g', String(lvl.fps * 2),
  '-bf', '2',
  '-deblock', '-1:-1',
  '-aq-mode', '2',
  '-psy-rd', '1.0:0.15',
  '-pix_fmt', 'yuv420p',
  '-colorspace', 'bt709', '-color_trc', 'bt709', '-color_primaries', 'bt709',
  '-b:v', kb + 'k',
  '-maxrate', Math.round(kb * 1.08) + 'k',
  '-bufsize', Math.round(kb * 1.25) + 'k',
  '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
  '-movflags', '+faststart',
  name
]);

$('#go').addEventListener('click', async () => {
  if (S.busy || !S.file || !S.dur) return;
  S.busy = true; S.cancel = false;
  $('#go').disabled = true; $('#cancel').hidden = false;
  $('#pv').pause();
  clearReport();
  S.manual = Math.max(0, parseInt($('#kbIn').value, 10) || 0);
  if (S.manual > 20000) { S.manual = 20000; $('#kbIn').value = 20000; }
  S.outUrls.forEach(URL.revokeObjectURL); S.outUrls = []; $('#res').innerHTML = '';
  S.logs = [];
  renderPlan(true);
  const items = [...$('#tl').children], parts = plan(), LV = levels();
  S.total = parts.length;
  let lock = null, ff = null, src = null, lv = 0, lastErr = null;
  try {
    try { lock = await navigator.wakeLock.request('screen'); } catch (_) {}
    for (const p of parts) {
      S.cur = items[p.i];
      const name = 'sw-' + String(p.i).padStart(3, '0') + '.mp4';
      let kb = bitrate(p.len);
      for (;;) {
        try {
          if (!ff) {
            say(S.ff ? 'Lagi nyiapin videonya...' : 'Lagi nyiapin mesin video (±32 MB, cuma sekali), tunggu bentar...');
            ff = await load(); src = await attach(ff);
          }
          S.lvl = LV[lv].label;
          say('Lagi ngolah bagian ' + (p.i + 1) + ' dari ' + parts.length + ' (' + LV[lv].label + ' • ' + kb + ' kbps). Jangan tutup halamannya ya.');
          const code = await encode(ff, src.path, p, name, LV[lv], kb);
          if (code !== 0) throw new Error('Proses berhenti (kode ' + code + '). ' + S.logs.slice(-2).join(' '));
          break;
        } catch (err) {
          lastErr = err;
          if (S.cancel) throw err;
          if (unreadable(err) && !S.noMount) {
            S.noMount = true;
            try { ff && ff.terminate(); } catch (_) {}
            S.ff = null; ff = null; src = null;
            S.cur.style.setProperty('--p', '0%'); S.cur.firstChild.textContent = 'Ulang';
            say('Filenya susah dibaca langsung, nyoba cara lain ya...');
            continue;
          }
          if (lv + 1 >= LV.length) throw err;
          try { ff && ff.terminate(); } catch (_) {}
          S.ff = null; ff = null; src = null; lv++;
          S.cur.style.setProperty('--p', '0%'); S.cur.firstChild.textContent = 'Ulang';
          say('RAM HP agak mepet nih, otomatis turun ke ' + LV[lv].label + ' ya...');
        }
      }
      let data = await ff.readFile(name);
      const limit = S.target * 1048576 * 1.03;
      for (let t = 0; t < 2 && !S.manual && data.length > limit && kb > 400; t++) {
        kb = Math.max(400, Math.floor(kb * (S.target * 1048576) / data.length * 0.92));
        say('Bagian ' + (p.i + 1) + ' masih kegedean (' + mb(data.length) + '), diulang di ' + kb + ' kbps biar pas...');
        S.cur.style.setProperty('--p', '0%');
        if ((await encode(ff, src.path, p, name, LV[lv], kb)) !== 0) break;
        data = await ff.readFile(name);
      }
      await ff.deleteFile(name);
      S.cur.style.setProperty('--p', '100%');
      S.cur.firstChild.textContent = 'Selesai';
      addResult(new File([data], name, { type: 'video/mp4' }), p);
    }
    say(lv ? 'Beres! Tadi sempat diturunin ke ' + LV[lv].label + ' biar memori HP gak kepenuhan.' : 'Beres! Tinggal simpan, lalu upload ke Status berurutan dari yang pertama.');
  } catch (err) {
    console.error(err, S.logs);
    if (S.cancel) say('Oke, prosesnya dibatalkan.');
    else { say(friendly(err), true); showReport(err); }
    try { ff && ff.terminate(); } catch (_) {}
    S.ff = null; src = null;
  }
  await detach(ff, src);
  if (lock) lock.release().catch(() => {});
  S.cur = null; S.busy = false;
  $('#go').disabled = false; $('#cancel').hidden = true;
});

$('#cancel').addEventListener('click', () => {
  if (!S.busy) return;
  S.cancel = true;
  try { S.ff && S.ff.terminate(); } catch (_) {}
});

/* ---------- hasil ---------- */
function addResult(f, p) {
  const url = URL.createObjectURL(f);
  S.outUrls.push(url);
  const li = document.createElement('li');
  li.innerHTML = '<span class="count">' + String(p.i + 1).padStart(2, '0') + '/ ' + String(S.total).padStart(2, '0') + '</span><div class="frame"><video controls playsinline preload="metadata"></video></div>' +
    '<div class="row"><div><b></b><small>Lagi ngecek hasil...</small></div><div class="acts"></div></div>';
  const v = li.querySelector('video'), chk = li.querySelector('small');
  li.querySelector('b').textContent = f.name + ' (' + mb(f.size) + ', ' + Math.round(f.size * 8 / 1000 / p.len) + ' kbps)';
  v.onloadedmetadata = () => {
    const ok = isFinite(v.duration) && Math.abs(v.duration - p.len) < 2;
    chk.textContent = ok ? 'Siap upload • Durasi ' + fmt(v.duration) : 'Durasinya agak meleset nih, coba proses ulang ya';
    chk.className = ok ? 'ok' : 'bad';
  };
  v.onerror = () => { chk.textContent = 'Preview gak bisa diputar di browser ini, tapi file tetap bisa disimpan dan dicoba di WA'; chk.className = ''; };
  v.src = url;
  const acts = li.querySelector('.acts');
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    const s = document.createElement('button');
    s.className = 'main'; s.textContent = 'Bagikan';
    s.onclick = () => navigator.share({ files: [f] }).catch(() => {});
    acts.appendChild(s);
  }
  const a = document.createElement('a');
  a.href = url; a.download = f.name; a.textContent = 'Simpan';
  acts.appendChild(a);
  $('#res').appendChild(li);
}

/* ---------- awal ---------- */
if (/FBAN|FBAV|Instagram|TikTok|musical_ly|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent)) {
  hint('Kayaknya kamu buka dari dalam aplikasi lain. Buka lewat Chrome (atau Safari di iPhone) biar semua fitur jalan.');
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
