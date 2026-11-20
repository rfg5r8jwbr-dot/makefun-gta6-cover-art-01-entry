// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the cover alone, controls hidden.
// Query params: photo (boulevard|pier), caption, subtitle, layout
// (quad|hero|triptych), grade (sunset|neon|noir|clean), size (square|portrait|wide).
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const opts = {
    photo: query.get('photo') ?? 'pier',
    caption: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Leonida',
    layout: query.get('layout') ?? 'quad',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? 'square',
  };
  await apply(opts);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
