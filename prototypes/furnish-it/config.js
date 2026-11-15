// PROTOTYPE - NOT FOR PRODUCTION
// Question: Lấp kín căn phòng bằng nội thất rồi được thưởng cảnh cozy có đủ thư giãn và đủ đã để chơi hết 6 phòng không?
// Date: 2026-11-15
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },
  cell_max: { value: 96, min: 50, max: 120, step: 1 },     // px: largest floor cell in a room
  tray_cell: { value: 56, min: 16, max: 72, step: 1 },     // px: largest cell size of a piece waiting in the tray (shrinks to fit)
  rotate_from: { value: 3, min: 1, max: 7, step: 1 },      // room number from which pieces arrive turned and can be rotated
  shuffle_from: { value: 2, min: 1, max: 7, step: 1 },     // room number from which the tray order is shuffled
  tap_slop: { value: 14, min: 4, max: 40, step: 1 },       // px: a press that moves less than this is a tap (rotate)
  clear_delay: { value: 1.1, min: 0, max: 4, step: 0.1 },  // s after the last piece before "next room" shows
  glow_time: { value: 1.6, min: 0.2, max: 5, step: 0.1 },  // s for the lights to warm up on a solved room
  motes: { value: 26, min: 0, max: 80, step: 1 },          // dust motes floating in a lit room
  hand_loop: { value: 2.4, min: 1, max: 5, step: 0.1 },    // s per loop of the tutorial hand in room 1
};

// The six rooms. Each map is the room's solution: one letter per piece, '#' a fixed built-in.
// The pieces are cut from the map, so any arrangement that fills every free cell wins.
window.LEVELS = [
  { name: 'Phòng ngủ', wall: '#e9b7b1', floor: 'wood',
    map: ['AAB#', 'AAB#', 'AACC', '##CC'],
    types: { A: 'bed', B: 'wardrobe', C: 'rug' } },
  { name: 'Phòng khách', wall: '#b5dcc6', floor: 'wood',
    map: ['AAABB', 'ACCCB', 'DCCCB', 'DEEFG', 'DEEFG'],
    types: { A: 'sofa', B: 'shelf', C: 'table', D: 'tv', E: 'sofa', F: 'table', G: 'plant' } },
  { name: 'Phòng bếp', wall: '#f3d79f', floor: 'tile',
    map: ['AAAAB', 'CCDDB', 'CFDDB', 'EFFGG', 'EFHGI', 'EJJJI'],
    types: { A: 'counter', B: 'fridge', C: 'counter', D: 'table', E: 'stove', F: 'rug', G: 'plant', H: 'chair', I: 'counter', J: 'sink' } },
  { name: 'Phòng tắm', wall: '#a9d0e2', floor: 'tile',
    map: ['AA#BBB', 'AACCDB', 'EECCDF', 'E#GGDF', 'HHGII#', 'HHJJIK'],
    types: { A: 'tub', B: 'counter', C: 'rug', D: 'shelf', E: 'plant', F: 'wardrobe', G: 'rug', H: 'shower', I: 'counter', J: 'bench', K: 'toilet' } },
  { name: 'Phòng làm việc', wall: '#cbbbe2', floor: 'wood',
    map: ['AAA#BB', 'CDDDDB', 'CEEFFB', 'CEEFGG', '#HHFG#', 'IIHJJK', 'ILLLJK'],
    types: { A: 'shelf', B: 'shelf', C: 'wardrobe', D: 'desk', E: 'rug', F: 'sofa', G: 'plant', H: 'rug', I: 'plant', J: 'shelf', K: 'chair', L: 'desk' } },
  { name: 'Ban công', wall: '#cde2a9', floor: 'terracotta',
    map: ['AAAB#CC', 'DDABBBC', 'DEEFFGC', '#EEFHGG', 'IIJFHHK', 'IJJ#LLK', 'MMMNNLK'],
    types: { A: 'planter', B: 'rug', C: 'planter', D: 'plant', E: 'table', F: 'sofa', G: 'plant', H: 'rug', I: 'planter', J: 'plant', K: 'bench', L: 'planter', M: 'bench', N: 'chair' } },
];
