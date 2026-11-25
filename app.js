const $ = s => document.querySelector(s);
const S = { file: null, buf: null, url: null, dur: 0, fps: 30, seg: 30, target: 7, good: 1, manual: 0, total: 1, busy: false, cancel: false, ff: null, cur: null, logs: [], outUrls: [] };

const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const mb = b => (b / 1048576).toFixed(1) + ' MB';
const say = (t, err) => { const el = $('#status'); el.textContent = t; el.classList.toggle('err', !!err); };

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
  $('#mParts').textContent = parts.length + (parts.length > 1 ? ' bagian' : ' file utuh (tidak dipotong)');
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

function failPick(msg) {
  S.dur = 0;
  S.buf = null;
  $('#stage').hidden = true;
  $('#go').disabled = true;
  $('#drop').classList.remove('small');
  $('#dropTitle').textContent = 'Maaf, videonya belum bisa dibuka';
  $('#dropHint').textContent = msg;
}

// Fungsi pembacaan bertahap (stream) agar file dari Google Photos / Cloud terunduh sempurna
async function readCloudSafeFile(file) {
  if (file.stream) {
    const reader = file.stream().getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (file.size > 0) {
        const pct = Math.min(100, Math.round((received / file.size) * 100));
        $('#dropHint').textContent = 'Mengambil video (' + pct + '%)...';
      }
    }
    const out = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
  return new Uint8Array(await file.arrayBuffer());
}

$('#file').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f || S.busy) return;
  if (S.url) URL.revokeObjectURL(S.url);
  S.outUrls.forEach(URL.revokeObjectURL); S.outUrls = [];
  $('#res').innerHTML = ''; say('');
  
  S.file = f; 
  S.buf = null;
  S.dur = 0;
  $('#stage').hidden = true;
  $('#go').disabled = true;
  $('#drop').classList.add('small');
  $('#dropTitle').textContent = f.name;
  $('#dropHint').textContent = 'Sedang menyiapkan video dari galeri/cloud, mohon tunggu...';

  // Langsung tarik penuh isi file (mendukung Google Photos, Drive, & penyimpanan lokal)
  try {
    S.buf = await readCloudSafeFile(f);
  } catch (_) {
    e.target.value = '';
    return failPick('Maaf, video gagal diambil dari galeri/cloud. Pastikan koneksi internet stabil jika mengambil dari Google Photos, lalu silakan coba pilih ulang.');
  }
  e.target.value = '';

  // Buat Blob URL lokal dari S.buf agar pemutar preview & FFmpeg 100% stabil
  const localBlob = new Blob([S.buf], { type: f.type || 'video/mp4' });
  S.url = URL.createObjectURL(localBlob);

  const pv = $('#pv');
  pv.onloadedmetadata = () => {
    if (S.dur) return;
    if (!isFinite(pv.duration) || pv.duration <= 0) return failPick('Maaf, durasi video tidak terbaca. Silakan coba pilih video lain ya.');
    S.dur = pv.duration;
    const origKbps = Math.round(S.buf.length * 8 / 1000 / S.dur);
    $('#mDur').textContent = fmt(S.dur);
    $('#mRes').textContent = pv.videoWidth + 'x' + pv.videoHeight;
    $('#mSize').textContent = mb(S.buf.length) + ' (' + origKbps + ' kbps)';
    $('#dropTitle').textContent = f.name;
    $('#dropHint').textContent = 'Ganti video';
    $('#stage').hidden = false;
    $('#go').disabled = false;
    renderPlan();
  };
  pv.onerror = () => {
    if (S.dur) return;
    failPick('Maaf, format video ini belum didukung oleh browser.');
  };
  pv.src = S.url;
});

async function load() {
  if (S.ff) return S.ff;
  const f = new FFmpegWASM.FFmpeg();
  f.on('log', ({ message }) => { S.logs.push(message); if (S.logs.length > 40) S.logs.shift(); });
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
  if (!S.buf) {
    S.buf = await readCloudSafeFile(S.file);
  }
  await ff.writeFile('in.mp4', S.buf);
  return { path: 'in.mp4', mounted: false };
}

function friendlyError(err) {
  const msg = String(err && err.message ? err.message : err);
  if (/NotReadableError|readAsArrayBuffer|permission|could not be read/i.test(msg)) {
    return 'Maaf, koneksi ke file terputus oleh sistem HP. Pastikan internet stabil jika mengambil dari Google Photos, lalu silakan pilih ulang videonya.';
  }
  if (/memory|allocation|oom|out of memory/i.test(msg)) {
    return 'Maaf, memori (RAM) HP penuh saat memproses video ini. Silakan tutup aplikasi lain yang berjalan di latar belakang atau gunakan video dengan ukuran lebih kecil.';
  }
  return 'Maaf, proses terhenti karena kendala teknis pada perangkat. Silakan muat ulang halaman dan coba lagi ya.';
}

const levels = () => {
  const L = [
    { h: 1080, fps: S.fps, q: S.good },
    { h: 720, fps: 30, q: 0 }
  ], seen = new Set();
  return L.filter(l => { const k = l.h + '/' + l.fps + '/' + l.q; return !seen.has(k) && seen.add(k); })
    .map(l => ({ ...l, label: l.h + 'p ' + l.fps + 'fps • Mode ' + (l.q ? 'Bagus' : 'Cepat') }));
};

const filter = l => {
  const long = l.h === 1080 ? 1920 : 1280;
  const sharp = l.q ? ',unsharp=5:5:0.55:5:5:0.0' : '';
  return 'fps=' + l.fps + ",scale='min(iw,if(gt(iw,ih)," + long + ',' + l.h + "))':'min(ih,if(gt(iw,ih)," + l.h + ',' + long + "))':flags=lanczos:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1" + sharp;
};

const encode = (ff, path, p, name, lvl, kb) => ff.exec([
  '-ss', String(p.start), '-i', path, '-t', String(p.len),
  '-vf', filter(lvl),
  '-vsync', '1',
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
  S.manual = Math.max(0, parseInt($('#kbIn').value, 10) || 0);
  S.outUrls.forEach(URL.revokeObjectURL); S.outUrls = []; $('#res').innerHTML = '';
  S.logs = [];
  renderPlan(true);
  const items = [...$('#tl').children], parts = plan(), LV = levels();
  S.total = parts.length;
  let lock = null, ff = null, src = null, lv = 0;
  try {
    try { lock = await navigator.wakeLock.request('screen'); } catch (_) {}
    for (const p of parts) {
      S.cur = items[p.i];
      const name = 'sw-' + String(p.i).padStart(3, '0') + '.mp4';
      let kb = bitrate(p.len);
      for (;;) {
        try {
          if (!ff) { say('Sedang menyiapkan mesin video, mohon tunggu sebentar...'); ff = await load(); src = await attach(ff); }
          say('Sedang mengolah bagian ' + (p.i + 1) + ' dari ' + parts.length + ' (' + LV[lv].label + ' • ' + kb + ' kbps). Mohon jangan tutup halaman ini ya.');
          const code = await encode(ff, src.path, p, name, LV[lv], kb);
          if (code !== 0) throw new Error('Proses berhenti (kode ' + code + '). ' + S.logs.slice(-2).join(' '));
          break;
        } catch (err) {
          if (S.cancel || lv + 1 >= LV.length) throw err;
          try { ff && ff.terminate(); } catch (_) {}
          S.ff = null; ff = null; src = null; lv++;
          S.cur.style.setProperty('--p', '0%'); S.cur.firstChild.textContent = 'Ulang';
          say('Memori HP cukup terbatas, kualitas otomatis disesuaikan ke ' + LV[lv].label + ' ya...');
        }
      }
      let data = await ff.readFile(name);
      const limit = S.target * 1048576 * 1.03;
      for (let t = 0; t < 2 && !S.manual && data.length > limit && kb > 400; t++) {
        kb = Math.max(400, Math.floor(kb * (S.target * 1048576) / data.length * 0.92));
        say('Ukuran bagian ' + (p.i + 1) + ' masih sedikit besar (' + mb(data.length) + '), sedang disesuaikan ulang ke ' + kb + ' kbps...');
        S.cur.style.setProperty('--p', '0%');
        if ((await encode(ff, src.path, p, name, LV[lv], kb)) !== 0) break;
        data = await ff.readFile(name);
      }
      await ff.deleteFile(name);
