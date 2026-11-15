// PROTOTYPE - NOT FOR PRODUCTION
// Question: Kéo khối có hình vào bóng đen với đồng hồ đếm ngược có đủ vui để làm hết 6 vật không?
// Date: 2026-11-16
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html).
window.CONFIG = {
  seed: 7, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },
  time_1: { value: 60, min: 10, max: 240, step: 5 },   // s to finish object 1
  time_2: { value: 60, min: 10, max: 240, step: 5 },   // s to finish object 2
  time_3: { value: 75, min: 10, max: 240, step: 5 },   // s to finish object 3
  time_4: { value: 75, min: 10, max: 240, step: 5 },   // s to finish object 4
  time_5: { value: 90, min: 10, max: 240, step: 5 },   // s to finish object 5
  time_6: { value: 90, min: 10, max: 240, step: 5 },   // s to finish object 6
  warn_time: { value: 10, min: 0, max: 30, step: 1 },  // s left when the clock turns red and ticks
  hint_cost: { value: 5, min: 0, max: 30, step: 1 },   // s taken off the clock per hint
  snap_reach: { value: 0.55, min: 0.2, max: 1.5, step: 0.05 }, // cells: how far off its true spot a drop still snaps
  tap_slop: { value: 12, min: 4, max: 40, step: 1 },   // px: a press moving less than this is a tap
  tray_cell_max: { value: 40, min: 16, max: 60, step: 1 }, // px: largest cell size in the tray (shrinks to fit)
  win_delay: { value: 1.4, min: 0, max: 4, step: 0.1 },    // s of the glow before "back to the museum" shows
  min_cover: { value: 0.005, min: 0.001, max: 0.5, step: 0.001 }, // share of a cell the object must cover for the cell to be part of its shadow
};

// The six objects, easiest first. grid: cells across the object's square; pieces: how many
// blocks it is cut into; cut: 'bands' (straight strips), 'compact' (L/T/Z-like), 'wild' (odd
// shapes); decoys: extra blocks from another object that belong nowhere.
window.OBJECTS = [
  { art: 'bust',    name: 'Tượng bán thân',     grid: 5,  pieces: 3,  cut: 'bands',   decoys: 0 },
  { art: 'amphora', name: 'Bình gốm cổ',        grid: 6,  pieces: 4,  cut: 'bands',   decoys: 0 },
  { art: 'helmet',  name: 'Mũ giáp hiệp sĩ',    grid: 7,  pieces: 6,  cut: 'compact', decoys: 0 },
  { art: 'skull',   name: 'Sọ khủng long',      grid: 8,  pieces: 8,  cut: 'compact', decoys: 0 },
  { art: 'harp',    name: 'Đàn hạc vàng',       grid: 9,  pieces: 10, cut: 'wild',    decoys: 1 },
  { art: 'cat',     name: 'Tượng mèo Ai Cập',   grid: 10, pieces: 12, cut: 'wild',    decoys: 2 },
];
