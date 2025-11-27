// static/js/photos.js — 2-колоночная сетка, подпись 2 строки, крестик удаления, DnD-сортировка, delta-sync
(function () {
  // --- DOM ---
  const input = document.getElementById('photos_input');
  const dz    = document.getElementById('photos_dropzone');
  const grid  = document.getElementById('photos_existing');

  // --- Состояние ---
  // { id?, url?, blob?, name?, caption, isNew, removed, order }
  let items = [];
  let preloadDone = false;

  // DnD
  let dragFrom = null; // индекс в items

  // --- Утилиты ---
  function getCSRF() {
    const el = document.querySelector('input[name=csrfmiddlewaretoken]');
    if (el && el.value) return el.value;
    const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function setReportId(id) {
    const el = document.getElementById('report_id');
    if (el) el.value = id;
  }
  function getReportId() {
    const el = document.getElementById('report_id');
    return el ? (el.value || '').trim() : '';
  }

  function fileToImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, url });
      img.onerror = reject;
      img.src = url;
    });
  }

  // сжатие до ширины 630px
  async function resizeTo630(file) {
    const { img } = await fileToImage(file);
    const ratio = img.height / img.width;
    const w = 630, h = Math.round(w * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.77));
    return { blob, w, h };
  }

  async function addFiles(fileList) {
    const arr = Array.from(fileList || []);
    for (const f of arr) {
      if (!f.type.startsWith('image/')) continue;
      const { blob } = await resizeTo630(f);
      const safeName = (f.name || 'photo.jpg').replace(/\.[^.]+$/, '.jpg');
      items.push({
        blob, name: safeName,
        caption: '', isNew: true, removed: false, order: 0
      });
    }
    renderAll();
  }

  // --- RENDER ---
  function renderAll() {
    if (!grid) return;
    grid.innerHTML = '';

    const visible = items.filter(it => !it.removed);

    visible.forEach((it) => {
      const card = document.createElement('div');
      card.className = 'photo-card';
      card.draggable = true;
      card.dataset.index = String(items.indexOf(it));

      // DnD-хендлеры
      card.addEventListener('dragstart', onDragStart);
      card.addEventListener('dragover', onDragOver);
      card.addEventListener('dragleave', onDragLeave);
      card.addEventListener('drop', onDrop);
      card.addEventListener('dragend', onDragEnd);

      // обёртка + IMG
      const wrap = document.createElement('div');
      wrap.className = 'photo-imgwrap';

      const img = document.createElement('img');
      if (it.isNew && it.blob) {
        img.src = URL.createObjectURL(it.blob);
        img.alt = it.name || 'new';
      } else {
        img.src = it.url; img.alt = `photo_${it.id}`;
      }
      wrap.appendChild(img);

      // крестик удаления
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'photo-close';
      close.textContent = 'x';
      close.setAttribute('aria-label', 'Удалить фото');
      close.onclick = () => {
        if (it.isNew) {
          const pos = items.indexOf(it);
          if (pos >= 0) items.splice(pos, 1);
        } else {
          it.removed = true;
        }
        renderAll();
      };
      wrap.appendChild(close);

      // подпись
      const capBox = document.createElement('div');
      capBox.className = 'photo-capbox';
      const ta = document.createElement('textarea');
      ta.className = 'photo-caption';
      ta.rows = 2;
      ta.placeholder = 'Подпись';
      ta.value = it.caption || '';
      ta.addEventListener('input', () => { it.caption = ta.value; });
      capBox.appendChild(ta);

      card.appendChild(wrap);
      card.appendChild(capBox);
      grid.appendChild(card);
    });

    // помеченные к удалению — отдельным блоком
    const removed = items.filter(it => !it.isNew && it.removed);
    if (removed.length) {
      const sep = document.createElement('div');
      sep.className = 'photo-sep';
      sep.textContent = 'Помеченные к удалению (удалятся после «Записать в БД»):';
      grid.appendChild(sep);

      removed.forEach(it => {
        const c = document.createElement('div');
        c.className = 'photo-card ghost';
        const img = document.createElement('img'); img.src = it.url; c.appendChild(img);
        const box = document.createElement('div'); box.className = 'photo-capbox';
        const t = document.createElement('textarea'); t.className = 'photo-caption'; t.rows = 2; t.disabled = true; t.value = it.caption || '';
        box.appendChild(t); c.appendChild(box);
        const undo = document.createElement('button'); undo.textContent = 'Вернуть'; undo.onclick = ()=>{ it.removed = false; renderAll(); };
        c.appendChild(undo);
        grid.appendChild(c);
      });
    }
  }

  // --- Drag & Drop сортировка ---
  function onDragStart(e) {
    const idx = Number(this.dataset.index);
    dragFrom = Number.isFinite(idx) ? idx : null;
    this.classList.add('dragging');
    try { e.dataTransfer.setData('text/plain', String(idx)); } catch {}
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    e.preventDefault();
    this.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
  }
  function onDragLeave() { this.classList.remove('drag-over'); }
  function onDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    const from = dragFrom;
    const to = Number(this.dataset.index);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return;

    const [moved] = items.splice(from, 1);
    const target = from < to ? to - 1 : to; // корректная вставка
    items.splice(target, 0, moved);
    renderAll();
  }
  function onDragEnd() {
    this.classList.remove('dragging');
    dragFrom = null;
  }

  // --- Dropzone & input ---
  if (dz) {
    dz.addEventListener('click', () => input && input.click());
    ['dragenter','dragover','dragleave','drop'].forEach(ev => {
      dz.addEventListener(ev, (e)=>{ e.preventDefault(); e.stopPropagation(); });
    });
    dz.addEventListener('dragover', ()=> dz.classList.add('over'));
    dz.addEventListener('dragleave', ()=> dz.classList.remove('over'));
    dz.addEventListener('drop', async (e)=>{
      dz.classList.remove('over');
      const f = e.dataTransfer?.files || [];
      if (f.length) await addFiles(f);
    });
  }
  if (input) {
    input.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files.length) await addFiles(e.target.files);
      input.value = '';
    });
  }

  // --- Сервер ---
  async function preloadFromDb(reportId) {
    if (!reportId) return;
    const r = await fetch(`/photos/${reportId}/`);
    const d = await r.json().catch(()=>({ ok:false, photos:[] }));
    const newOnes = items.filter(it => it.isNew);
    const loaded = (d.photos || []).map(p => ({
      id: p.id, url: p.url, caption: p.caption || '',
      isNew: false, removed: false, order: p.order || 0
    }));
    items = [...loaded, ...newOnes];        // <-- фикс: корректно объединяем
    preloadDone = true;
    renderAll();
  }
  async function ensureLoaded(reportId) {
    if (!reportId) return;
    if (!preloadDone) await preloadFromDb(reportId);
  }

  async function syncWithServer(reportId) {
    const rid = (reportId || getReportId() || '').toString();
    if (!rid) throw new Error('reportId is empty');

    const keptOld = items.filter(it => !it.isNew && !it.removed);
    const keepIds = keptOld.map(it => it.id);
    const removedOld = items.filter(it => !it.isNew && it.removed).map(it => it.id);
    const captionsById = {}; keptOld.forEach(it => { captionsById[it.id] = it.caption || ''; });
    const newOnes = items.filter(it => it.isNew && !it.removed);

    // КАРТА ПОРЯДКА для старых фото (сохраняем сортировку)
    const orderMap = {};
    let seq = 1;
    items.forEach(it => {
      if (!it.removed && !it.isNew && it.id != null) {
        orderMap[it.id] = seq++;
      }
    });

    const fd = new FormData();
    newOnes.forEach(it => fd.append('images[]', it.blob, it.name || 'photo.jpg'));
    fd.append('captions_new', JSON.stringify(newOnes.map(it => it.caption || '')));
    fd.append('mode', 'delta');
    fd.append('removed_ids', removedOld.join(','));
    fd.append('captions_by_id', JSON.stringify(captionsById));
    fd.append('keep_ids', keepIds.join(',')); // совместимость
    fd.append('order_map', JSON.stringify(orderMap)); // <-- НОВОЕ: порядок

    const resp = await fetch(`/photos/upload/${rid}/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCSRF() },
      body: fd
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);

    const fresh = (data.photos || []).map(p => ({
      id: p.id, url: p.url, caption: p.caption || '',
      isNew: false, removed: false, order: p.order || 0
    }));
    items = fresh;
    preloadDone = true;
    renderAll();
    return { ok: true, total: items.length };
  }

  // --- Экспорт наружу ---
  window.__photos = {
    setReportId, getReportId, preloadFromDb, ensureLoaded, syncWithServer,
    hasNew: () => items.some(it => it.isNew && !it.removed),
  };
  window.__photos.uploadAllNewPhotos = window.__photos.syncWithServer;

  document.addEventListener('DOMContentLoaded', () => {
    const prefill = (window.PREFILL_ID || '').toString();
    if (prefill) { setReportId(prefill); preloadFromDb(prefill); }
  });
})();
