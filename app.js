const APP_VERSION = '1.5';
const $ = s => document.querySelector(s);
const S = {
  file: null, url: null, dur: 0, fps: 0, autoFps: 0, srcKbps: 0, seg: 30, target: 15, good: 1, manual: 0, total: 1,
  drop: ['pick', 'dropInit'], noMount: false, picking: false, probing: false, busy: false, cancel: false,
  ff: null, cur: null, lvl: '', logs: [], outUrls: []
};

const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const mb = b => (b / 1048576).toFixed(1) + ' MB';
const say = (t, err) => { const el = $('#status'); el.textContent = t; el.classList.toggle('err', !!err); };
const setDrop = (titleKey, hintKey, vars) => {
  S.drop = [titleKey, hintKey, vars];
  $('#dropTitle').textContent = titleKey === 'file' ? (S.file ? S.file.name : '') : t(titleKey);
  $('#dropHint').textContent = t(hintKey, vars);
};

const errText = err => String((err && err.message) || err);
const unreadable = err => /NotReadable|could not be read/i.test(errText(err));
const friendly = err => {
  const m = errText(err);
  if (unreadable(err)) return t('errUnread');
  if (/memory|Aborted|out of bounds|allocation|RangeError/i.test(m)) return t('errMem');
  if (/Failed to fetch|NetworkError|Load failed|failed to import|ffmpeg-core/i.test(m)) return t('errLoad');
  return t('errFail', { m });
};

function clearReport() { const b = $('#reportBtn'); if (b) b.remove(); }
function showReport(err) {
  clearReport();
  const btn = document.createElement('button');
  btn.id = 'reportBtn'; btn.type = 'button'; btn.className = 'cancel';
  btn.textContent = t('reportBtn');
  btn.onclick = async () => {
    const text = [
      'SW HD v' + APP_VERSION,
      'Browser: ' + navigator.userAgent,
      'Video: ' + (S.file ? mb(S.file.size) + ', ' + fmt(S.dur) : '-'),
      'Settings: ' + (S.fps || 'auto') + 'fps, cut ' + S.seg + 's, target ' + S.target + 'MB, manual ' + (S.manual || '-') + ', mode ' + (S.good ? 'best' : 'fast') + ', lang ' + LANG,
      'Level: ' + (S.lvl || '-'),
      'Error: ' + errText(err),
      'Log: ' + S.logs.slice(-12).join(' | ')
    ].join('\n');
    try { await navigator.clipboard.writeText(text); btn.textContent = t('reportDone'); }
    catch (_) { window.prompt(t('reportPrompt'), text); }
  };
  $('#status').after(btn);
}

const bitrate = len => {
  if (S.manual > 0) return Math.min(20000, Math.max(300, S.manual));
  const k = Math.floor(S.target * 8192 * 0.93 / len) - 128;
  const cap = S.srcKbps ? Math.max(1500, Math.round(S.srcKbps * 0.95)) : 20000;
  return Math.max(400, Math.min(20000, cap, k));
};
const testJobs = () => [2000, 4000, 8000, 14000].map((kb, i) => ({
  i, start: 0, len: Math.min(10, S.dur), kb, name: 'uji-' + kb + 'k.mp4', tag: kb + 'k'
}));

const plan = () => {
  const n = Math.max(1, Math.ceil(S.dur / S.seg - 0.05));
  return Array.from({ length: n }, (_, i) => ({ i, start: i * S.seg, len: Math.min(S.seg, S.dur - i * S.seg) }));
};

function drawTimeline(parts) {
  const tl = $('#tl');
  tl.innerHTML = '';
  parts.forEach(p => {
    const li = document.createElement('li');
    li.style.flex = p.len;
    li.innerHTML = '<span>' + (p.tag || t('tlPart', { n: p.i + 1 })) + '</span>';
    tl.appendChild(li);
  });
  $('#mParts').textContent = parts[0] && parts[0].tag ? t('partsTest', { n: parts.length }) : parts.length > 1 ? t('partsMany', { n: parts.length }) : t('partsOne');
}
function renderPlan(force) {
  if (S.busy && !force) return;
  drawTimeline(plan());
}

function bindSeg(id, key) {
  $(id).addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || S.busy) return;
    S[key] = +b.dataset.v;
    $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
    updateSummary();
    if (S.dur) renderPlan();
  });
}
function updateSummary() {
  const kb = parseInt($('#kbIn').value, 10) || 0;
  $('#setSum').textContent = (S.fps ? S.fps + ' fps' : t('sumOrig')) + ' • ' + (S.good ? t('sumGood') : t('sumFast')) + ' • ' + (kb > 0 ? kb + ' kbps' : S.target + ' MB') + ' • ' + t('sumSec', { n: S.seg });
}
bindSeg('#fpsSeg', 'fps'); bindSeg('#lenSeg', 'seg'); bindSeg('#sizeSeg', 'target'); bindSeg('#qSeg', 'good');

$('#kbIn').addEventListener('input', e => {
  $('#sizeSeg').style.opacity = e.target.value.trim() ? '0.45' : '1';
  updateSummary();
});

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
async function readSrcFps(ff, src) {
  S.logs = [];
  try { await ff.exec(['-hide_banner', '-i', src.path]); } catch (_) {}
  const m = /,\s*([\d.]+)\s*fps/.exec(S.logs.join('\n'));
  S.autoFps = m && parseFloat(m[1]) >= 50 ? 60 : 30;
}
async function detach(ff, src) {
  if (!ff || !src) return;
  try { src.mounted ? await ff.unmount('/in') : await ff.deleteFile('in'); } catch (_) {}
}

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

function failPick(key) {
  S.dur = 0;
  $('#stage').hidden = true;
  $('#go').disabled = true;
  $('#drop').classList.remove('small');
  setDrop('failTitle', key);
}

function ready(info) {
  const f = S.file;
  S.dur = info.dur;
  S.srcKbps = Math.round(f.size * 8 / 1000 / S.dur);
  $('#mDur').textContent = fmt(S.dur);
  $('#mRes').textContent = info.w && info.h ? info.w + 'x' + info.h : '-';
  $('#mSize').textContent = mb(f.size) + ' (' + Math.round(f.size * 8 / 1000 / S.dur) + ' kbps)';
  $('#drop').classList.add('small');
  setDrop('file', 'changeVideo');
  $('#stage').hidden = false;
  $('#go').disabled = false;
  updateSummary();
  renderPlan();
}

async function viaProbe() {
  if (S.probing || S.dur) return;
  S.probing = true;
  setDrop('pick', 'probing');
  try {
    const info = await probe();
    if (!info) throw new Error('info video kosong');
    $('#stage .frame').style.display = 'none';
    ready(info);
  } catch (err) {
    console.error(err);
    failPick('failRead');
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
  S.noMount = false; S.dur = 0; S.autoFps = 0; S.srcKbps = 0;
  $('#stage .frame').style.display = '';
  let file = f;
  if (f.size < 200 * 1048576) {
    setDrop('pick', 'prep');
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

const levels = () => {
  const L = [
    { h: 1080, fps: S.fps || S.autoFps || 30, q: S.good },
    { h: 720, fps: 30, q: 0 },
    { h: 540, fps: 30, q: 0 }
  ], seen = new Set();
  return L.filter(l => { const k = l.h + '/' + l.fps + '/' + l.q; return !seen.has(k) && seen.add(k); })
    .map(l => ({ ...l, label: l.h + 'p ' + l.fps + 'fps • ' + t('lvMode', { m: l.q ? t('sumGood') : t('sumFast') }) }));
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

async function run(test) {
  if (S.busy || !S.file || !S.dur) return;
  S.busy = true; S.cancel = false;
  $('#go').disabled = true; $('#cancel').hidden = false; $('#setBtn').disabled = true;
  $('#pv').pause();
  clearReport();
  S.manual = Math.max(0, parseInt($('#kbIn').value, 10) || 0);
  if (S.manual > 20000) { S.manual = 20000; $('#kbIn').value = 20000; }
  S.outUrls.forEach(URL.revokeObjectURL); S.outUrls = []; $('#res').innerHTML = '';
  S.logs = [];
  const parts = test ? testJobs() : plan();
  drawTimeline(parts);
  const items = [...$('#tl').children];
  let LV = levels();
  S.total = parts.length;
  let lock = null, ff = null, src = null, lv = 0, lastErr = null;
  try {
    try { lock = await navigator.wakeLock.request('screen'); } catch (_) {}
    for (const p of parts) {
      S.cur = items[p.i];
      const name = p.name || 'sw-' + String(p.i).padStart(3, '0') + '.mp4';
      let kb = p.kb || bitrate(p.len);
      for (;;) {
        try {
          if (!ff) {
            say(t(S.ff ? 'prep' : 'prepEngine'));
            ff = await load(); src = await attach(ff);
            if (!S.fps) { await readSrcFps(ff, src); LV = levels(); }
          }
          S.lvl = LV[lv].label;
          say(p.tag ? t('workingTest', { tag: p.tag, lvl: LV[lv].label, kb }) : t('working', { i: p.i + 1, n: parts.length, lvl: LV[lv].label, kb }));
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
            S.cur.style.setProperty('--p', '0%'); S.cur.firstChild.textContent = t('retryTag');
            say(t('unreadRetry'));
            continue;
          }
          if (lv + 1 >= LV.length) throw err;
          try { ff && ff.terminate(); } catch (_) {}
          S.ff = null; ff = null; src = null; lv++;
          S.cur.style.setProperty('--p', '0%'); S.cur.firstChild.textContent = t('retryTag');
          say(t('memDown', { lvl: LV[lv].label }));
        }
      }
      let data = await ff.readFile(name);
      const limit = S.target * 1048576 * 1.03;
      for (let t = 0; t < 2 && !S.manual && !p.kb && data.length > limit && kb > 400; t++) {
        kb = Math.max(400, Math.floor(kb * (S.target * 1048576) / data.length * 0.92));
        say(t('bigAgain', { i: p.i + 1, size: mb(data.length), kb }));
        S.cur.style.setProperty('--p', '0%');
        if ((await encode(ff, src.path, p, name, LV[lv], kb)) !== 0) break;
        data = await ff.readFile(name);
      }
      await ff.deleteFile(name);
      S.cur.style.setProperty('--p', '100%');
      S.cur.firstChild.textContent = t('doneTag');
      addResult(new File([data], name, { type: 'video/mp4' }), p);
    }
    $('#res').scrollIntoView({ block: 'start' });
    say(test ? t('doneTest') : lv ? t('doneDown', { lvl: LV[lv].label }) : t('done'));
  } catch (err) {
    console.error(err, S.logs);
    if (S.cancel) say(t('cancelled'));
    else { say(friendly(err), true); showReport(err); }
    try { ff && ff.terminate(); } catch (_) {}
    S.ff = null; src = null;
  }
  await detach(ff, src);
  if (lock) lock.release().catch(() => {});
  S.cur = null; S.busy = false;
  $('#go').disabled = false; $('#cancel').hidden = true; $('#setBtn').disabled = false;
}
$('#go').addEventListener('click', () => run(false));

$('#cancel').addEventListener('click', () => {
  if (!S.busy) return;
  S.cancel = true;
  try { S.ff && S.ff.terminate(); } catch (_) {}
});

function addResult(f, p) {
  const url = URL.createObjectURL(f);
  S.outUrls.push(url);
  const li = document.createElement('li');
  li.innerHTML = '<span class="count">' + String(p.i + 1).padStart(2, '0') + '/ ' + String(S.total).padStart(2, '0') + '</span><div class="frame"><video controls playsinline preload="metadata"></video></div>' +
    '<div class="row"><div><b></b><small>' + t('resChecking') + '</small></div><div class="acts"></div></div>';
  const v = li.querySelector('video'), chk = li.querySelector('small');
  li.querySelector('b').textContent = f.name + ' (' + mb(f.size) + ', ' + Math.round(f.size * 8 / 1000 / p.len) + ' kbps)';
  v.onloadedmetadata = () => {
    const ok = isFinite(v.duration) && Math.abs(v.duration - p.len) < 2;
    chk.textContent = ok ? t('resOk', { d: fmt(v.duration) }) : t('resBad');
    chk.className = ok ? 'ok' : 'bad';
  };
  v.onerror = () => { chk.textContent = t('resNoPreview'); chk.className = ''; };
  v.src = url;
  const acts = li.querySelector('.acts');
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    const s = document.createElement('button');
    s.className = 'main'; s.textContent = t('share');
    s.onclick = () => navigator.share({ files: [f] }).catch(() => {});
    acts.appendChild(s);
  }
  const a = document.createElement('a');
  a.href = url; a.download = f.name; a.textContent = t('save');
  acts.appendChild(a);
  $('#res').appendChild(li);
}

const sheet = $('#sheet');
const openSheet = () => { if (S.busy) return; sheet.showModal ? sheet.showModal() : sheet.setAttribute('open', ''); };
const closeSheet = () => { sheet.close ? sheet.close() : sheet.removeAttribute('open'); };
$('#setBtn').addEventListener('click', openSheet);
$('#sheetX').addEventListener('click', closeSheet);
$('#sheetOk').addEventListener('click', closeSheet);
$('#testBtn').addEventListener('click', () => { closeSheet(); run(true); });
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });
updateSummary();

if (/FBAN|FBAV|Instagram|TikTok|musical_ly|Line\/|MicroMessenger|; wv\)/i.test(navigator.userAgent)) {
  setDrop('pick', 'inApp');
}
window.onLang = () => {
  setDrop(...S.drop);
  updateSummary();
  if (S.dur && !S.busy) renderPlan();
};
initLang();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
