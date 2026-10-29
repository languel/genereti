// Monochrome outline instruments; labels remain available through native tips.
const paths={
 kick:'M4 12a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M9 18l-2 3m8-3 2 3M8 7l8 10',
 snare:'M4 8c0-4 16-4 16 0v8c0 4-16 4-16 0Z M4 8c0 4 16 4 16 0M6 10l3 8 3-7 3 7 3-8',
 rim:'M4 12a8 5 0 1 0 16 0a8 5 0 1 0-16 0 M5 4l14 14',
 clap:'M6 13V7a1 1 0 0 1 2 0v5-7a1 1 0 0 1 2 0v7-8a1 1 0 0 1 2 0v8-6a1 1 0 0 1 2 0v8l2-2c2-2 4 0 2 2l-4 6H9l-5-6c-2-2 0-4 2-2Z',
 hat:'M3 8h18M5 11h14M12 5v15m-4 0h8',
 openhat:'M3 6h18M5 12h14M12 3v18m-4 0h8',
 tomlo:'M3 8c0-3 18-3 18 0v10c0 3-18 3-18 0Z M3 8c0 3 18 3 18 0',
 tomhi:'M6 7c0-3 12-3 12 0v10c0 3-12 3-12 0Z M6 7c0 3 12 3 12 0',
 ride:'M2 9q10-8 20 0q-10 4-20 0 M12 5v16m-4 0h8',
 cowbell:'M8 4h8l5 15q-9 4-18 0Z M5 16q7 3 14 0',
};
export const DRUM_NAMES={35:'kick',36:'kick',37:'rim',38:'snare',39:'clap',40:'snare',41:'tomlo',42:'hat',43:'tomlo',44:'hat',45:'tomhi',46:'openhat',47:'tomhi',51:'ride',56:'cowbell',59:'ride'};
export function drumGlyph(nameOrNote){const name=DRUM_NAMES[nameOrNote]??nameOrNote;return `<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]??paths.tomhi}"/></svg>`;}
