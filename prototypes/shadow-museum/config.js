// PROTOTYPE - NOT FOR PRODUCTION
// Question: Kéo từng bộ phận của vật thể vào bóng đen cho nó hiện ra có đủ vui để làm hết 6 vật không?
// Date: 2026-11-17
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html).
window.CONFIG = {
  seed: 7, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },
  snap_dist: { value: 60, min: 10, max: 200, step: 5 },    // px: how far from its true spot a dropped part still snaps in
  drag_lift: { value: 40, min: 0, max: 160, step: 5 },     // px: how far above the finger a dragged part rides
  thumb_zoom_max: { value: 1.4, min: 0.4, max: 4, step: 0.1 }, // x: largest a piece may be drawn in its tray slot, screen px per art px
  key_speed: { value: 260, min: 60, max: 800, step: 20 },  // px/s: how fast the arrows move a part
  tap_slop: { value: 12, min: 4, max: 40, step: 1 },       // px: a press moving less than this is a tap
  win_delay: { value: 1.9, min: 0, max: 4, step: 0.1 },    // s of the glow before "back to the museum" shows
  whimsy_size: { value: 0.8, min: 0.4, max: 1.2, step: 0.05 },   // shaped pieces (cat, fish, bird, heart): size as a share of a cell
  piece_depth: { value: 12, min: 0, max: 28, step: 1 },          // art px: how thick pieces and objects stand, like toy blocks
  piece_depth_3d: { value: 20, min: 6, max: 40, step: 1 },        // art px: how thick the 3D pieces are (the hollow is a little shallower)
  inflate: { value: 1, min: 0.3, max: 1.5, step: 0.05 },             // how round the finished 3D objects are: 1 is round all the way through
  cam_tilt: { value: 10, min: 0, max: 40, step: 1 },              // degrees: how far the puzzle camera looks down at the standing board
  lift_height: { value: 70, min: 10, max: 200, step: 5 },          // world units: how high a dragged piece floats over the board
  jigsaw_jitter: { value: 0.2, min: 0, max: 0.35, step: 0.01 },  // share of a cell the cut's inner corners wander, so pieces differ in shape
  jigsaw_min: { value: 0.18, min: 0, max: 0.6, step: 0.02 },    // share of a cell's area below which a sliver of picture joins its neighbour
  island_min: { value: 300, min: 0, max: 600, step: 10 },          // art px: a bit of a piece at least this big becomes its own piece; smaller specks stay with the biggest
  island_share: { value: 0.1, min: 0, max: 1, step: 0.05 },      // ...and at least this share of the piece's biggest bit, so specks like rivets stay attached
  time_scale: { value: 1, min: 0.5, max: 2, step: 0.05 },        // x: every level's time is its OBJECTS time times this
  warn_time: { value: 10, min: 0, max: 30, step: 1 },            // s left when the clock turns red and ticks
  hint_cost: { value: 5, min: 0, max: 30, step: 1 },             // s taken off the clock per hint
  freeze_time: { value: 8, min: 2, max: 20, step: 1 },            // s the freeze booster stops the clock
  freeze_uses: { value: 1, min: 0, max: 5, step: 1 },             // freezes each level starts with
  intro_hold: { value: 2.5, min: 0, max: 6, step: 0.5 },         // s the clock waits while a tip for a new thing is shown
  star3: { value: 0.45, min: 0.1, max: 0.9, step: 0.05 },        // share of the time left for 3 stars
  star2: { value: 0.2, min: 0, max: 0.8, step: 0.05 },           // share of the time left for 2 stars
};

// The scenes, played in order: finish all six of one to open the next.
window.AREAS = [
  { key: 'museum',  name: 'Bảo tàng Bóng',     done: 'Bảo tàng mở cửa!' },
  { key: 'kitchen', name: 'Căn bếp ấm cúng',   done: 'Căn bếp đã ấm cúng!' },
  { key: 'park',    name: 'Công viên Thành phố', done: 'Công viên đông vui!' },
];

// The levels, in order: six per scene (area: its index in AREAS). time: seconds to finish.
// cut: 'parts' hands out the object's own parts (index.html, ART:
// 3, 4, 5 parts, the colour-line cut); 'shapes' cuts the whole picture. style picks how:
//   on a cols x rows grid: 'kinked' (straight with bends), 'wave', 'zigzag', 'mixed' (each line its own kind);
//   by piece count (pieces): 'mosaic' (random cut, mixed sizes), 'amoeba' (organic blobs),
//   'swirl' (curling scroll lines), 'ribbon' (wavy strips), 'fan' (wedges round a centre).
// ?cut=<style> in the address sets it for all; ?scene=cuts shows every style side by side.
// whimsy: shaped pieces (cat, fish, bird, heart) cut out of the middle, grid styles only.
// decoys: pieces from another object that belong nowhere.
window.OBJECTS = [
  { area: 0, art: 'bust',      name: 'Tượng bán thân',    time: 30, cut: 'parts',  decoys: 0 },
  { area: 0, art: 'amphora',   name: 'Bình gốm cổ',       time: 30, cut: 'parts',  decoys: 0 },
  { area: 0, art: 'helmet',    name: 'Mũ giáp hiệp sĩ',   time: 35, cut: 'parts',  decoys: 0 },
  { area: 0, art: 'globe',     name: 'Quả địa cầu cổ',    time: 60, cut: 'shapes', pieces: 9,  style: 'mosaic', decoys: 0 },
  { area: 0, art: 'crown',     name: 'Vương miện',        time: 65, cut: 'shapes', pieces: 10, style: 'swirl',  decoys: 0 },
  { area: 0, art: 'cat',       name: 'Tượng mèo Ai Cập',  time: 70, cut: 'shapes', cols: 3, rows: 5, style: 'mixed', whimsy: 3, decoys: 0 },
  { area: 1, art: 'teapot',    name: 'Ấm trà hoa',        time: 35, cut: 'parts',  decoys: 0 },
  { area: 1, art: 'cookiejar', name: 'Lọ bánh quy',       time: 55, cut: 'shapes', pieces: 10, style: 'ribbon', decoys: 0 },
  { area: 1, art: 'mixer',     name: 'Máy trộn bột',      time: 60, cut: 'shapes', pieces: 11, style: 'amoeba', decoys: 0 },
  { area: 1, art: 'toaster',   name: 'Máy nướng bánh mì', time: 60, cut: 'shapes', pieces: 11, style: 'fan',    decoys: 0 },
  { area: 1, art: 'pie',       name: 'Bánh táo',          time: 60, cut: 'shapes', pieces: 12, style: 'mosaic', decoys: 0 },
  { area: 1, art: 'cake',      name: 'Bánh kem dâu',      time: 70, cut: 'shapes', cols: 3, rows: 4, style: 'zigzag', whimsy: 2, decoys: 0 },
  { area: 2, art: 'bench',     name: 'Ghế công viên',     time: 30, cut: 'parts',  decoys: 0 },
  { area: 2, art: 'lamp',      name: 'Đèn đường cổ',      time: 55, cut: 'shapes', cols: 3, rows: 4, style: 'kinked', whimsy: 0, decoys: 0 },
  { area: 2, art: 'picnic',    name: 'Giỏ picnic',        time: 60, cut: 'shapes', pieces: 12, style: 'swirl',  decoys: 0 },
  { area: 2, art: 'bicycle',   name: 'Xe đạp',            time: 65, cut: 'shapes', pieces: 13, style: 'amoeba', decoys: 0 },
  { area: 2, art: 'fountain',  name: 'Đài phun nước',     time: 70, cut: 'shapes', cols: 3, rows: 4, style: 'wave', whimsy: 2, decoys: 0 },
  { area: 2, art: 'cart',      name: 'Xe bán kem',        time: 80, cut: 'shapes', cols: 4, rows: 4, style: 'mixed', whimsy: 3, decoys: 0 },
];
