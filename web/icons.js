// Static, local toolbar glyphs. Labels belong in title/aria-label attributes.
const paths={
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
 moon:'<path d="M20 15.2A9 9 0 0 1 8.8 4 9 9 0 1 0 20 15.2Z"/>',
 stroke:'<path d="m4 17 1 3 3-1L20 7l-4-4Z M13 6l4 4"/>',
 fill:'<path d="m5 4 10 10M4 12l8-8 8 8-8 8Z M3 21h13M20 17s-2 2-2 3a2 2 0 0 0 4 0c0-1-2-3-2-3Z"/>',
 fit:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/><rect x="7" y="7" width="10" height="10" rx="1"/>',
 open:'<path d="M3 7V5h6l2 2h10v13H3Z M3 11h18"/>',
 save:'<path d="M5 3h12l4 4v14H3V3Z M7 3v6h10V3M7 21v-8h10v8"/>',
 live:'<path d="m13 2-9 12h7l-1 8 10-12h-7Z"/>',
 overlay:'<rect x="3" y="3" width="13" height="13" rx="2"/><rect x="8" y="8" width="13" height="13" rx="2"/>',
 play:'<path d="m8 5 11 7-11 7Z"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 output:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
 panel:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16M18 8v1M18 12v1"/>',
 alert:'<path d="m12 3 10 18H2Z M12 9v5M12 17h.01"/>',
};
export function icon(name){return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||''}</svg>`;}
