// Vice Cover Studio — cover renderer.
// Draws a multi-panel GTA-style poster onto any canvas: a Vice City sunset
// backdrop, a glowing sun, palm silhouettes, the photo panels with their own
// crop / zoom / pan / grade, and bold condensed caption lettering in the
// vendored Anton (OFL) with a sunset-gradient fill and a Pacifico subtitle.
// Layouts: Quad, Hero, Triptych and Full-bleed. Everything is drawn in code;
// no external images, no Rockstar artwork.

const GRADES = {
  sunset: { tint: 'rgba(255, 80, 40, 0.22)', filter: 'saturate(1.45) contrast(1.08) sepia(0.22) hue-rotate(-12deg)' },
  neon: { tint: 'rgba(0, 229, 255, 0.10)', filter: 'saturate(1.9) contrast(1.15) hue-rotate(12deg)' },
  noir: { tint: 'rgba(0, 0, 0, 0.18)', filter: 'grayscale(1) contrast(1.22) brightness(1.05)' },
  clean: { tint: 'rgba(0, 0, 0, 0)', filter: 'none' },
  // Vice: purple-and-teal duotone, the after-dark side of the city.
  vice: { tint: 'rgba(124, 58, 237, 0.14)', filter: 'saturate(1.7) contrast(1.14) hue-rotate(18deg)' },
};

// Title lettering uses the vendored Anton (OFL) with a sunset-gradient fill;
// the subtitle is set in the vendored Pacifico script. `titleGradient` is a
// list of left-to-right gradient stops; a style without one stays solid.
const CAPTION_STYLES = {
  sunset: { fill: '#ffffff', stroke: '#ff2d78', shadow: '#ff7a18', accent: '#ffb400', titleGradient: ['#ff2d78', '#ff7a18', '#ffb400'] },
  neon: { fill: '#ffffff', stroke: '#00e5ff', shadow: '#ff2d78', accent: '#00e5ff', titleGradient: ['#00e5ff', '#b537f2', '#ff2d78'] },
  mono: { fill: '#ffffff', stroke: '#111111', shadow: '#000000', accent: '#ffffff' },
  vice: { fill: '#ffffff', stroke: '#7c3aed', shadow: '#00e5ff', accent: '#e879f9', titleGradient: ['#e879f9', '#7c3aed', '#00e5ff'] },
};

/** How many panels a layout shows. */
export function panelCountForLayout(layout) {
  if (layout === 'fullbleed') return 1;
  return layout === 'quad' ? 4 : 3;
}

/** Panel rectangles (in canvas pixels) for a layout, inside the photo area. */
export function layoutPanels(layout, x, y, w, h, gutter) {
  if (layout === 'fullbleed') {
    // One photo fills the whole photo area, edge to edge.
    return [{ x, y, w, h }];
  }
  if (layout === 'triptych') {
    const pw = (w - gutter * 2) / 3;
    return [0, 1, 2].map((i) => ({ x: x + i * (pw + gutter), y, w: pw, h }));
  }
  if (layout === 'hero') {
    const leftW = (w - gutter) * 0.62;
    const rightW = w - gutter - leftW;
    const smallH = (h - gutter) / 2;
    return [
      { x, y, w: leftW, h },
      { x: x + leftW + gutter, y, w: rightW, h: smallH },
      { x: x + leftW + gutter, y: y + smallH + gutter, w: rightW, h: smallH },
    ];
  }
  // quad: 2 x 2 grid
  const pw = (w - gutter) / 2;
  const ph = (h - gutter) / 2;
  return [
    { x, y, w: pw, h: ph },
    { x: x + pw + gutter, y, w: pw, h: ph },
    { x, y: y + ph + gutter, w: pw, h: ph },
    { x: x + pw + gutter, y: y + ph + gutter, w: pw, h: ph },
  ];
}

/** Draws the magenta-orange-purple sunset sky and a glowing sun disc. */
export function drawSunsetBackdrop(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b0f4d');
  sky.addColorStop(0.38, '#7b1e6e');
  sky.addColorStop(0.62, '#ff2d78');
  sky.addColorStop(0.82, '#ff7a18');
  sky.addColorStop(1, '#ffb400');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Glowing sun, upper right.
  const sx = w * 0.78;
  const sy = h * 0.2;
  const sr = Math.min(w, h) * 0.16;
  const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.1);
  glow.addColorStop(0, 'rgba(255, 214, 120, 0.9)');
  glow.addColorStop(0.45, 'rgba(255, 122, 24, 0.45)');
  glow.addColorStop(1, 'rgba(255, 45, 120, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - sr * 2.2, sy - sr * 2.2, sr * 4.4, sr * 4.4);
  ctx.fillStyle = '#ffd678';
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
}

/** One palm-tree silhouette, drawn with canvas paths, at (x, y) = trunk base.
 *  Thin trunk and long drooping fronds: at small sizes a thick frond reads as
 *  a blob, so the lines stay fine and the crown spreads wide. */
export function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, s * 0.032);
  ctx.lineCap = 'round';
  // Trunk, leaning slightly.
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.55, x + s * 0.22, y - s * 0.95);
  ctx.stroke();
  const tx = x + s * 0.22;
  const ty = y - s * 0.95;
  // Fronds: nine long arcs fanning out from the crown, drooping at the tips.
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.04 + (i / 8) * 0.92);
    const ex = tx + Math.cos(a) * s * 0.78;
    const ey = ty - Math.sin(a) * s * 0.38 + s * 0.3;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx + Math.cos(a) * s * 0.42, ty - Math.sin(a) * s * 0.55, ex, ey);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(tx - s * 0.03, ty + s * 0.05, s * 0.04, 0, Math.PI * 2);
  ctx.arc(tx + s * 0.05, ty + s * 0.06, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** One five-pointed star, filled, centred at (cx, cy) with radius r. */
export function drawStar(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

/** Draws one photo into a panel rect with cover-fit, zoom, pan and flip. */
export function drawPanelPhoto(ctx, photo, rect, panel) {
  if (!photo) return;
  const grade = GRADES[panel.filter] ?? GRADES.sunset;
  const zoom = panel.zoom || 1;
  const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight);
  const pw = photo.naturalWidth * base * zoom;
  const ph = photo.naturalHeight * base * zoom;
  const cx = rect.x + rect.w / 2 + (panel.panX || 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (panel.panY || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.filter;
  if (panel.flip) {
    ctx.translate(cx, cy);
    ctx.scale(-1, 1);
    ctx.drawImage(photo, -pw / 2, -ph / 2, pw, ph);
  } else {
    ctx.drawImage(photo, cx - pw / 2, cy - ph / 2, pw, ph);
  }
  ctx.filter = 'none';
  // Warm / neon wash over the photo, then a soft bottom shade for legibility.
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const shade = ctx.createLinearGradient(0, rect.y + rect.h * 0.55, 0, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(20, 4, 40, 0)');
  shade.addColorStop(1, 'rgba(20, 4, 40, 0.35)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Bold condensed caption lettering, sized to fit the width, with outline.
 *  The title is set in the vendored Anton (OFL) with a sunset-gradient fill;
 *  the subtitle is a neon script line in the vendored Pacifico. Both fall
 *  back to the old system stack if the fonts fail to load. The subtitle is
 *  capped at 72% of the width so it never runs under the band's corner art. */
export function drawCaption(ctx, w, bandY, bandH, title, subtitle, styleName, outline) {
  const style = CAPTION_STYLES[styleName] ?? CAPTION_STYLES.sunset;
  const titleText = (title || '').trim().toUpperCase();
  const subText = (subtitle || '').trim().toUpperCase();
  if (!titleText && !subText) return;
  const cx = w / 2;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (subText) {
    let subSize = bandH * 0.16;
    ctx.font = `${subSize}px "Pacifico", "Segoe Script", cursive`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.08)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(subText).width > w * 0.72 && subSize > 10) {
      subSize -= 1;
      ctx.font = `${subSize}px "Pacifico", "Segoe Script", cursive`;
    }
    ctx.fillStyle = style.accent;
    ctx.shadowColor = style.shadow;
    ctx.shadowBlur = subSize * 0.5;
    ctx.fillText(subText, cx, bandY + bandH * 0.2);
    ctx.shadowBlur = 0;
  }
  if (titleText) {
    let size = bandH * (subText ? 0.52 : 0.62);
    const titleFont = (s) => `${s}px "Anton", "Arial Black", Arial, sans-serif`;
    ctx.font = titleFont(size);
    try { ctx.letterSpacing = `${Math.round(size * 0.04)}px`; } catch { /* older canvas */ }
    while (ctx.measureText(titleText).width > w * 0.92 && size > 12) {
      size -= 2;
      ctx.font = titleFont(size);
    }
    const ty = bandY + bandH * (subText ? 0.62 : 0.52);
    const tw = ctx.measureText(titleText).width;
    ctx.lineJoin = 'round';
    ctx.shadowColor = style.shadow;
    ctx.shadowBlur = size * 0.28;
    ctx.shadowOffsetY = size * 0.05;
    if (outline) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.strokeText(titleText, cx, ty);
    }
    if (style.titleGradient) {
      const grad = ctx.createLinearGradient(cx - tw / 2, 0, cx + tw / 2, 0);
      const stops = style.titleGradient;
      stops.forEach((c, i) => grad.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), c));
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = style.fill;
    }
    ctx.fillText(titleText, cx, ty);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  ctx.restore();
}

/** Subtle scanlines + grain + vignette over the whole cover. */
export function drawFinish(ctx, w, h) {
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#000000';
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#ffffff';
  let seed = 1234567;
  const dots = Math.floor((w * h) / 9000);
  for (let i = 0; i < dots; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const x = seed % w;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const y = seed % h;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(10, 0, 24, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Renders the whole cover onto `canvas` at its own pixel size.
 * `state` = { layout, panels, title, subtitle, captionStyle, outline }.
 * panels[i] = { photo, zoom, panX, panY, filter, flip }.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const border = Math.max(8, Math.round(Math.min(w, h) * 0.014));
  const gutter = Math.max(4, Math.round(Math.min(w, h) * 0.01));
  const bandH = Math.round(h * 0.17);
  const photoH = h - bandH - border * 2;

  drawSunsetBackdrop(ctx, w, h);

  const area = { x: border, y: border, w: w - border * 2, h: photoH };
  const panels = layoutPanels(state.layout, area.x, area.y, area.w, area.h, gutter);
  const count = panelCountForLayout(state.layout);
  for (let i = 0; i < count; i++) {
    const panel = state.panels[i];
    const rect = panels[i];
    // Empty panel: dark placeholder with a thin frame.
    ctx.fillStyle = '#1c0b2e';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    if (panel && panel.photo) drawPanelPhoto(ctx, panel.photo, rect, panel);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, gutter * 0.45);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  // Caption band: dark gradient, corner art, lettering on top. The diagonal
  // accent bar lives clipped inside the band now — it used to cross the photo
  // area and cut across faces and panel boundaries.
  const bandY = border + photoH;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(24, 4, 44, 0.92)');
  band.addColorStop(1, 'rgba(8, 1, 20, 0.98)');
  ctx.fillStyle = band;
  ctx.fillRect(border, bandY, w - border * 2, bandH);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(border, bandY, w - border * 2, Math.max(2, gutter * 0.4));

  // Diagonal accent bar, top-left corner of the band, clipped to the band.
  ctx.save();
  ctx.beginPath();
  ctx.rect(border, bandY, w - border * 2, bandH);
  ctx.clip();
  const barW = Math.min(w, h) * 0.18;
  const barTop = bandY + bandH * 0.05;
  ctx.fillStyle = '#ff2d78';
  ctx.beginPath();
  ctx.moveTo(border, barTop + barW * 0.14);
  ctx.lineTo(border + barW, barTop);
  ctx.lineTo(border + barW, barTop + barW * 0.08);
  ctx.lineTo(border, barTop + barW * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(border, barTop + barW * 0.22, barW * 0.55, Math.max(3, gutter * 0.6));
  ctx.restore();

  // Heat meter: five amber stars, top-right corner of the band.
  const starR = bandH * 0.055;
  const starGap = starR * 2.3;
  const starY = bandY + bandH * 0.1;
  ctx.save();
  ctx.fillStyle = '#ffb400';
  ctx.shadowColor = '#ff7a18';
  ctx.shadowBlur = starR * 0.7;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, w - border - w * 0.02 - starR - (4 - i) * starGap, starY, starR);
  }
  ctx.restore();

  // Palms at the edges, sunset-lit so they read against the dark band.
  // Kept just short of the band's top edge so their fronds stay clear of
  // the heat-meter stars in the top-right corner.
  const palmS = bandH * 0.95;
  drawPalm(ctx, border + w * 0.045, bandY + bandH * 0.98, palmS, 'rgba(255, 122, 24, 0.6)');
  drawPalm(ctx, w - border - w * 0.045, bandY + bandH * 0.98, palmS * 0.75, 'rgba(255, 122, 24, 0.55)');
  drawCaption(ctx, w, bandY, bandH, state.title, state.subtitle, state.captionStyle, state.outline);

  drawFinish(ctx, w, h);

  // White outer border + thin inner rule.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = border;
  ctx.strokeRect(border / 2, border / 2, w - border, h - border);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = Math.max(1, gutter * 0.3);
  ctx.strokeRect(border * 1.6, border * 1.6, w - border * 3.2, h - border * 3.2);
}
