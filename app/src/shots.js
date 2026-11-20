// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the cover alone, controls hidden.
// Query params: photo (boulevard|pier) or photos (a comma list, alternated
// across panels so a cover never tiles one photo), caption, subtitle, layout
// (quad|hero|triptych|fullbleed), grade (sunset|neon|noir|clean|vice), size
// (square|portrait|wide). window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, apply) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photos = (query.get('photos') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const opts = {
    photo: query.get('photo') ?? 'pier',
    photos,
    caption: query.get('caption') ?? 'Sunset Heist',
    subtitle: query.get('subtitle') ?? 'Leonida',
    layout: query.get('layout') ?? 'quad',
    grade: query.get('grade') ?? 'sunset',
    size: query.get('size') ?? 'square',
  };
  await apply(opts);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
