/**
 * Category icons — minimal line-art SVG inner content, 24×24 viewBox.
 * Stroke-based, no fill, to match the austere aesthetic.
 */

const svg = (inner) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

export const categoryIcons = {
  body: svg(`
    <rect x="3" y="7" width="4" height="10" rx="1"/>
    <rect x="17" y="7" width="4" height="10" rx="1"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
  `),

  mind: svg(`
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
    <path d="M12 2a7 7 0 0 0-7 7c0 2 2 3.5 3 5v2h8v-2c1-1.5 3-3 3-5a7 7 0 0 0-7-7z"/>
  `),

  creative: svg(`
    <path d="M18 3c-1.5 1.5-3 4-3 6s1.5 3 3 3 3-1 3-3-1.5-4.5-3-6z"/>
    <path d="M9 21c-2.5 0-4.5-2-4.5-4.5 0-2 1.5-3.5 3.5-4l5-1.5-1.5 5c-.5 2-2 3.5-4 3.5z"/>
  `),

  craft: svg(`
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  `),

  explorer: svg(`
    <circle cx="12" cy="12" r="10"/>
    <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>
  `),

  collector: svg(`
    <path d="M21 8v13H3V8"/>
    <path d="M1 3h22v5H1z"/>
    <path d="M10 12h4"/>
  `),

  social: svg(`
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  `),

  performing: svg(`
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
    <circle cx="9" cy="12" r="1.5"/>
    <circle cx="15" cy="12" r="1.5"/>
    <path d="M8 15c1.5 2 2.5 3 4 3s2.5-1 4-3"/>
  `),

  games: svg(`
    <line x1="6" y1="12" x2="10" y2="12"/>
    <line x1="8" y1="10" x2="8" y2="14"/>
    <circle cx="17" cy="11" r="1"/>
    <circle cx="19" cy="13" r="1"/>
    <path d="M2 8h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z"/>
  `),

  nature: svg(`
    <path d="M11 20A7 7 0 0 1 9.8 6.6C13.5 5.7 17 4 17 4s-1.7 3.5-2.6 7.2A7 7 0 0 1 11 20z"/>
    <path d="M11 20v-6"/>
    <path d="M11 14l-3-3"/>
  `),

  animals: svg(`
    <ellipse cx="12" cy="16" rx="4" ry="3"/>
    <ellipse cx="7" cy="9" rx="2" ry="2.5"/>
    <ellipse cx="17" cy="9" rx="2" ry="2.5"/>
    <ellipse cx="12" cy="5" rx="2" ry="2.5"/>
  `),

  home: svg(`
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  `),

  wheel_wave: svg(`
    <path d="M2 15c2-3 4-4 6-1s4 4 6 1 4-4 6-1"/>
    <circle cx="12" cy="6" r="2.5"/>
  `),

  flow: svg(`
    <circle cx="8" cy="16" r="3"/>
    <circle cx="16" cy="16" r="3"/>
    <circle cx="12" cy="7" r="3"/>
    <path d="M10.5 13.5L12 11l1.5 2.5"/>
  `),

  digital_craft: svg(`
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  `),

  finance: svg(`
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  `),

  precision: svg(`
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
    <line x1="12" y1="2" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
  `),

  spiritual: svg(`
    <path d="M12 22s-4-4-4-10 4-8 4-8 4 2 4 8-4 10-4 10z"/>
    <path d="M12 22c-2 0-6-3-6-8s3-6 3-6"/>
    <path d="M12 22c2 0 6-3 6-8s-3-6-3-6"/>
  `),
}

/** Return just the inner SVG content (no wrapping <svg> tag) for embedding in another SVG. */
export function categoryIconInner(id) {
  const full = categoryIcons[id]
  if (!full) return ''
  return full.replace(/<svg[^>]*>|<\/svg>/gi, '')
}
