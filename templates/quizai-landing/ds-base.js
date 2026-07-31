// Loads this design system into the template. In a consuming project, point
// base at the bound DS folder relative to this file (e.g. '_ds/<folder>' at
// the project root, '../_ds/<folder>' one level down) — one line to edit.
(() => {
  const base = '../..';
  const bundle = base + '/_ds_bundle.js';
  // Idempotent: several templates/pages may load this file.
  if (document.querySelector('script[data-ds-bundle]')) return;
  // styles.css @imports every tokens/*.css, so link only the entry point.
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = base + '/styles.css';
  document.head.appendChild(l);
  const s = document.createElement('script');
  s.src = bundle;
  s.setAttribute('data-ds-bundle', '');
  s.onerror = () => console.error('ds-base.js: failed to load ' + s.src + ' — if this is a consuming project, point the base line in ds-base.js at the bound _ds/<folder> tree relative to this page (e.g. _ds/<folder> at the project root, ../_ds/<folder> one level down); in a fresh design system this can just mean the bundle is not compiled yet');
  document.head.appendChild(s);
})();
