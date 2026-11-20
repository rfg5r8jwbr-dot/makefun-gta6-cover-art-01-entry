// Vice Cover Studio — editor wiring.
// State: one cover = layout + up to 4 panels (each its own photo, zoom, pan,
// grade, flip) + a two-line caption. Upload photos, click a panel to select
// it, drag to pan, scroll to zoom, then export a PNG in a post size.
// A `?shot=` query sets up a fixed scene for a screenshot (./shots.js).
import { drawCover, layoutPanels, panelCountForLayout } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');

const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

function blankPanel() {
  return { photo: null, zoom: 1, panX: 0, panY: 0, filter: 'sunset', flip: false };
}

const state = {
  layout: 'quad',
  panels: [blankPanel(), blankPanel(), blankPanel(), blankPanel()],
  title: 'SUNSET HEIST',
  subtitle: 'LEONIDA',
  captionStyle: 'sunset',
  outline: true,
  exportSize: 'square',
  selected: 0,
};

function selectedPanel() {
  return state.panels[state.selected];
}

/** Preview canvas resolution follows the export aspect, capped for speed.
 *  In a ?shot= scene the canvas renders at the full export size instead. */
let shotMode = false;
function previewSize() {
  const size = EXPORT_SIZES[state.exportSize];
  if (shotMode) return { w: size.w, h: size.h };
  const scale = 900 / Math.max(size.w, size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function redraw() {
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  syncPanelControls();
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Puts `img` into panel `i` (resetting its crop) and selects that panel. */
function setPanelPhoto(i, img) {
  state.panels[i] = { ...blankPanel(), photo: img, filter: selectedPanel().filter };
  state.selected = i;
  redraw();
}

/** Uploaded files fill panels in order, starting at the selected one. */
async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) {
    status.textContent = 'That file is not an image — try a JPG or PNG.';
    return;
  }
  let slot = state.selected;
  for (const file of images.slice(0, 4)) {
    const img = await loadImage(URL.createObjectURL(file));
    setPanelPhoto(slot, img);
    slot = (slot + 1) % 4;
  }
  status.textContent = `${images.length} photo${images.length > 1 ? 's' : ''} loaded — click a panel to crop it.`;
}

/** Loads a bundled sample into the selected panel. */
async function useSample(name, fillAll) {
  const img = await loadImage(`samples/${name}.jpg`);
  if (fillAll) {
    for (let i = 0; i < panelCountForLayout(state.layout); i++) setPanelPhoto(i, img);
    status.textContent = `Sample "${name}" filled every panel.`;
  } else {
    setPanelPhoto(state.selected, img);
    status.textContent = `Sample "${name}" loaded into panel ${state.selected + 1}.`;
  }
}

// ---- panel geometry on the preview canvas (for click / drag / wheel) ----
function photoArea() {
  const w = canvas.width;
  const h = canvas.height;
  const border = Math.max(8, Math.round(Math.min(w, h) * 0.014));
  const gutter = Math.max(4, Math.round(Math.min(w, h) * 0.01));
  const bandH = Math.round(h * 0.17);
  return { x: border, y: border, w: w - border * 2, h: h - bandH - border * 2, gutter };
}

function panelAt(px, py) {
  const area = photoArea();
  const rects = layoutPanels(state.layout, area.x, area.y, area.w, area.h, area.gutter);
  for (let i = 0; i < panelCountForLayout(state.layout); i++) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function canvasPoint(e) {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - box.left) / box.width) * canvas.width,
    y: ((e.clientY - box.top) / box.height) * canvas.height,
  };
}

// Click selects a panel; drag pans the selected panel's photo.
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i < 0) return;
  state.selected = i;
  redraw();
  dragging = { x: p.x, y: p.y, panX: selectedPanel().panX, panY: selectedPanel().panY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const area = photoArea();
  const rects = layoutPanels(state.layout, area.x, area.y, area.w, area.h, area.gutter);
  const rect = rects[state.selected];
  const panel = selectedPanel();
  panel.panX = Math.max(-0.6, Math.min(0.6, dragging.panX + (p.x - dragging.x) / rect.w));
  panel.panY = Math.max(-0.6, Math.min(0.6, dragging.panY + (p.y - dragging.y) / rect.h));
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = selectedPanel();
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  document.getElementById('zoom').value = String(panel.zoom);
  document.getElementById('zoomVal').textContent = `${panel.zoom.toFixed(2)}x`;
  redraw();
}, { passive: false });

// Drag-and-drop photos straight onto the preview.
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const p = canvasPoint(e);
  const i = panelAt(p.x, p.y);
  if (i >= 0) state.selected = i;
  addFiles(e.dataTransfer.files);
});

// ---- controls ----
function bindButton(id, fn) {
  document.getElementById(id).addEventListener('click', fn);
}

document.querySelectorAll('[data-layout]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.panel-pick').forEach((b, i) => {
      b.disabled = i >= panelCountForLayout(state.layout);
    });
    if (state.selected >= panelCountForLayout(state.layout)) state.selected = 0;
    redraw();
  });
});

document.querySelectorAll('[data-caption-style]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.captionStyle = btn.dataset.captionStyle;
    document.querySelectorAll('[data-caption-style]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});

document.querySelectorAll('[data-export-size]').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.exportSize = btn.dataset.exportSize;
    document.querySelectorAll('[data-export-size]').forEach((b) => b.classList.toggle('active', b === btn));
    redraw();
  });
});

document.querySelectorAll('.panel-pick').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.selected = Number(btn.dataset.panel);
    redraw();
  });
});

function syncPanelControls() {
  const panel = selectedPanel();
  document.getElementById('zoom').value = String(panel.zoom);
  document.getElementById('zoomVal').textContent = `${panel.zoom.toFixed(2)}x`;
  document.getElementById('panX').value = String(panel.panX);
  document.getElementById('panY').value = String(panel.panY);
  document.getElementById('panXVal').textContent = `${Math.round(panel.panX * 100)}%`;
  document.getElementById('panYVal').textContent = `${Math.round(panel.panY * 100)}%`;
  document.getElementById('filter').value = panel.filter;
  document.getElementById('flip').checked = panel.flip;
  document.querySelectorAll('.panel-pick').forEach((b, i) => {
    b.classList.toggle('active', i === state.selected);
    b.textContent = `Panel ${i + 1}${state.panels[i].photo ? ' ✓' : ''}`;
  });
  document.getElementById('panelLabel').textContent = `Panel ${state.selected + 1} of ${panelCountForLayout(state.layout)}`;
}

document.getElementById('zoom').addEventListener('input', (e) => {
  selectedPanel().zoom = Number(e.target.value);
  redraw();
});
document.getElementById('panX').addEventListener('input', (e) => {
  selectedPanel().panX = Number(e.target.value);
  redraw();
});
document.getElementById('panY').addEventListener('input', (e) => {
  selectedPanel().panY = Number(e.target.value);
  redraw();
});
document.getElementById('filter').addEventListener('change', (e) => {
  selectedPanel().filter = e.target.value;
  redraw();
});
document.getElementById('flip').addEventListener('change', (e) => {
  selectedPanel().flip = e.target.checked;
  redraw();
});
document.getElementById('outline').addEventListener('change', (e) => {
  state.outline = e.target.checked;
  redraw();
});

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });

document.getElementById('photo').addEventListener('change', (e) => addFiles(e.target.files));
bindButton('sampleBoulevard', () => useSample('boulevard', false));
bindButton('samplePier', () => useSample('pier', false));
bindButton('fillAll', () => useSample(state.selected % 2 === 0 ? 'boulevard' : 'pier', true));
bindButton('clearPhotos', () => {
  state.panels = [blankPanel(), blankPanel(), blankPanel(), blankPanel()];
  state.selected = 0;
  status.textContent = 'Photos cleared.';
  redraw();
});

/** Renders the cover at the exact export size and downloads it as a PNG. */
export function exportCover() {
  const size = EXPORT_SIZES[state.exportSize];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  const name = `vice-cover-${size.w}x${size.h}.png`;
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      status.textContent = `Saved ${name} (${size.label} PNG).`;
      resolve({ name, width: size.w, height: size.h, bytes: blob.size });
    }, 'image/png');
  });
}
bindButton('export', () => exportCover());

// ---- screenshot scenes ----
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  shotMode = true;
  runShot(shot, new URLSearchParams(location.search), async (opts) => {
    state.layout = opts.layout;
    state.title = opts.caption;
    state.subtitle = opts.subtitle;
    state.captionStyle = (opts.grade === 'clean' || opts.grade === 'noir') ? 'mono' : opts.grade;
    state.exportSize = opts.size;
    titleInput.value = opts.caption;
    subtitleInput.value = opts.subtitle;
    document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === opts.layout));
    document.querySelectorAll('[data-caption-style]').forEach((b) => b.classList.toggle('active', b.dataset.captionStyle === state.captionStyle));
    document.querySelectorAll('[data-export-size]').forEach((b) => b.classList.toggle('active', b.dataset.exportSize === opts.size));
    const img = await loadImage(`samples/${opts.photo}.jpg`);
    const count = panelCountForLayout(opts.layout);
    for (let i = 0; i < count; i++) {
      state.panels[i] = { ...blankPanel(), photo: img, filter: opts.grade, zoom: 1 + i * 0.08, panX: (i % 2 ? -0.06 : 0.06) };
    }
    state.selected = 0;
    redraw();
  });
} else {
  redraw();
}
