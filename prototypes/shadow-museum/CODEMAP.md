<!-- PROTOTYPE - NOT FOR PRODUCTION -->
<!-- Question: Kéo từng bộ phận của vật thể vào bóng đen cho nó hiện ra có đủ vui để làm hết 6 vật không? -->
<!-- Date: 2026-11-17 -->
# Shadow Pieces — code map

Read this first instead of reading the code. Open only the section a change needs: find it with
Grep on the function name or the `// ---- <section>` header named below (line numbers drift).
Keep this file up to date in the same commit as any change that moves, adds or renames something.

What the game is and what the person asked for: `brief.md` (the `After play:` lines are their
words, in order). Every change so far: `evidence/changes.tsv` and `git log -- prototypes/shadow-museum`.

## Files

| File | Size | What it holds |
|---|---|---|
| `index.html` | ~100 KB | Rules, state, 2D art of the 18 objects, cutting into pieces, HUD (2D canvas on top), input, scenes, loop |
| `world.js` | ~58 KB | Everything 3D (three.js, the canvas underneath): pieces and objects as meshes, the puzzle set, the 3 hub rooms. Draws only; holds no rules |
| `models.js` | ~25 KB | `MODELS`: one builder per object (`OBJECTS[i].art`) that makes its real 3D model from three.js shapes, ~100 units tall, standing on y = 0. Kit at the top: `turn` (lathe), `tube`, `ring`, `box`, `cyl`, `ball`, `cone`, textures (amphora band, globe map, flowers, gingham, wicker, label, stripes) |
| `config.js` | ~6 KB | `window.CONFIG` (every tuning value: value/min/max/step), `AREAS` (3 scenes), `OBJECTS` (18 levels: area, art, name, time, cut style, pieces) |
| `vendor/three.js` | 2.1 MB | three.js 0.186.1, core + module joined into one classic script (`window.THREE`) so the game plays from a double-click. Never read it |
| `brief.md` | | The game brief (copy of `design/game-brief.md`) |
| `evidence/` | | Screenshots from runs, `changes.tsv` |

Load order in `index.html`: `vendor/three.js` → `config.js` → `models.js` → `world.js` (defines `G3`) → the inline game
script. Classic scripts share top-level `const`s, so `world.js` reads `state`, `tune`, `ARTS`, `BOARD`,
`BS`, `TRAY3`, `BOARD3`, `W`, `H`, `CHEAP`, `makeCanvas`, `alphaBox`, `areaObjects` at call time.

## index.html, top to bottom (`// ---- <header>`)

- **Built to be checked**: `tune` (live CONFIG proxy), `STEP` (1/60 s fixed step), `W×H` = 720×1280
  logical screen, `clock`, `CHEAP` (`?render=cheap`), seeded `rng()`, `CONTROLS` text on the title.
- **Screen**: two stacked canvases in `#wrap`: `#gl` (WebGL, `G3`) under `#game` (2D HUD, gets the
  pointer). `fit()` sizes both and calls `G3.resize`.
- **Input / Audio**: pointer events go to `ptrQ` in logical px; `sfx.*` are Web Audio tones
  (`pick place wrong win tick fail open freeze magnet`).
- **Drawing helpers**: `rr fillRR strokeRR lin rad ellipse stroke drawStar poly sparkle`.
- **The six museum pieces** (`const ART`, the long block): each object = list of draw functions on a
  480×480 canvas (`ART_N`). Adding an object = an entry here + one in `config.js` `OBJECTS`.
- **Cutting**: `buildParts` (cut by the object's own parts), `jigsawCut` (grid with `kinked/wave/zigzag/mixed`
  edges + `WHIMSY` animal pieces), `labelCut` (`mosaic/amoeba/swirl/ribbon/fan`), `cutPicture` picks.
  `thicken`/`hollow` are 2D fake depth, now used only by the `?scene=cuts` gallery.
- **`splitIslands(parts)`**: a piece whose picture falls into separate bits becomes one piece per bit
  (bits under `tune.island_min` px or `tune.island_share` of the biggest stay attached, e.g. rivets).
- **`buildArt(i)` / `ARTS[i]`**: lazily `{ parts, img, sil }` — pieces (`{cv,x,y,w,h}` in art px), the
  whole picture, the black silhouette. world.js caches 3D data on these objects.
- **A puzzle**: `BOARD = {s:600}` board space (px, origin top-left of the 480 art square at `BS` = 1.25);
  `BOARD3` (where the board sits on screen), `TRAY3` (5-slot tray: centre, pitch, slots, depth from camera).
  `buildPuzzle(i)` shuffles pieces into slots.
- **State**: `reset()`, `openObject(i)` (makes `state.cur`: timer, scroll, freezes, tips),
  `runClock` (holds for tips, stops while `freezeLeft`), `failObject`, `tryDrop(p,x,y)` (snap if within
  `snap_dist` of `homeOf(p)`, board space), `winObject`, `useHint` (magnet), `useFreeze`, `backToHub`.
- **Buttons and HUD drawing**: `BTN` rects, `ui` (visual-only: pressed button, hub marks), `PAL` colours,
  `glossy outText drawButton drawIconBtn badge icon pill confetti`, easings `easeOutBack easeOut`.
- **The hub**: `areaStart areaObjects nextObject hubView`, `drawHub(dt)` = `G3.renderHub` then names,
  number badges, header, play button, tips, banners.
- **Tips**: `tipBubble`, `drawHand`.
- **The puzzle**: `drawPuzzle(dt)` = `G3.renderPuzzle` then frost, sparkles, magnet beam, HUD (level,
  timer pill, piece count), boosters, tray arrows, tips, win/fail cards.
- **Pointer**: `handlePointer` — hub taps (`G3.hubPick`), win screen drag spins the 3D object
  (`cur.spin`), tray press → `cur.drag` with `mode` `scroll` (sideways) or `piece`; drop → `tryDrop`.
- **Keyboard**: arrows/Enter in hub; Q/E/Tab pick piece, arrows move `cur.cursor`, Space place, H magnet,
  F freeze, Esc back, M mute.
- **Scenes**: `cuts` (2D gallery), `figures` (all 18 as 3D), `title`, `play`.
- **Loop**: `step()` fixed 60 Hz; `drawFrame()` draws the scene + the round reveal (iris) on screen change;
  `window.game` hook for the checks.

## world.js (`G3`), top to bottom

- **Renderer**: `init`, `resize`, `makeEnv` (soft studio env map for gloss), `canvasTex`, `mat` (cached
  materials), `toScreen` / `rayAt` / `camPoint` / `pxAt` (screen ↔ world).
- **Tracing a picture into outlines**: marching squares `traceLoops` → `simplifyLoop` → `nestedLoops`
  (depth parity = hole or solid) → `shapesFrom` (THREE.Shape with holes).
- **`block(cv, depthArt)`**: a piece as an extruded, bevelled toy block (face = picture, sides = darker
  average colour). Cached on the canvas.
- **`objectModel(i)`**: the object's real 3D model from `MODELS` (models.js), cloned from a cached
  prototype, sized to `artBox(i)` (the picture's box): `userData.h/w/d` in art px, bottom at y = 0.
  `setSil(g, on)` swaps every mesh to the dark `SIL` material for unfinished hub objects.
- **`solidModel(i)`** (fallback when an object has no builder): the picture inflated into a round 3D solid: distance transform of the
  silhouette, union of inscribed balls gives the depth (disc → ball, strip → tube), front/back surfaces
  on a 4 px grid, texture projected from the front with lookups pulled inside the outline. `tune.inflate`
  scales the depth. `SIL` = dark silhouette material.
- **Shapes for the set**: `rbox` (rounded box), `cyl sph plane floorPlane put shade lights plant tree person`.
- **The puzzle**: constants `BOARD_R SLAB HOLLOW`, per-scene colours `PZ_LOOK`.
  The board stands upright: everything board-related lives in `PZ.frame` (rotated +90° about X), where
  frame **y** points out of the board at the viewer and frame **z** runs down the screen. `b2w` (board
  space → frame), `toFrame / fromFrame / qToFrame` convert with the world. `qFlat` = a piece lying in
  the board. `buildPuzzleSet` (wall, floor, wall decor, board plate + rim + hollow, foot, tray bar),
  `fitPuzzleCam` (fits `BOARD3` with `tune.cam_tilt`), `boardMesh(i)` (board with the silhouette cut
  out), `pieceVis` / `trayTarget` / `homeWorld`, `openPuzzle`, **`renderPuzzle(dt)`** (intro, shake,
  win: `PZ.model` (objectModel) puffs up from flat, comes forward and spins (`cur.spin` adds drag), per-piece spring towards tray / drag / home, tutorial ghost),
  `screenToBoard`, `boardToScreen`, `pieceScreen`.
- **The hubs**: `HUB_SPOTS` (per scene: x,z on the floor, y top of stand, s size, stand type),
  `HUB_CAM`, `buildMuseum / buildKitchen / buildPark` (room + decor list `[needCount, mesh]`),
  `standFor`, `hubScene(a)` (cached), **`renderHub(a, view, dt)`** (camera dolly + sway, decor grow,
  object pop/spin/hop, visitors; returns screen marks), `hubPick`.
- **Figures**: `renderFigures(t)`.
- Exports: `init resize renderPuzzle renderHub renderFigures hubPick screenToBoard boardToScreen pieceScreen ghostAt`.

## Rules that are easy to break

- Game logic runs on the fixed step and reads `tune.<name>` live; never `Math.random` (use `rng()`),
  never `setTimeout` for logic. Visual-only smoothing (springs, `ui`) may use real frame `dt`.
- Every tuning number goes in `config.js` with value/min/max/step.
- Board space vs frame vs world: input converts screen → board space with `G3.screenToBoard`; the
  rules compare in board space; world.js converts board space → frame with `b2w`.
- Under `CHEAP` (all screenshots/checks): pixel ratio 0.5, no shadows, no antialias. Never tune for it.
- Brief: `brief.md` and `design/game-brief.md` are kept identical while this is the current game.

## Run and check

- Double-click `index.html`, or serve the folder. Address options: `?obj=N` (open level N),
  `?area=N` (start at scene N), `?scene=figures|cuts|title`, `?seed=N`, `?cut=<style>`.
- Screenshot a run: `bash .claude/scripts/one-shot-run.sh prototypes/shadow-museum <out.png> --log "Enter Enter KeyH" --stop 200 --size 540x960`
  (keys are `event.code`: `Enter`, `KeyH`, `ArrowUp:0.5` holds). Errors are `crash`/`uncaught` rows.
- Keep check: `bash .claude/scripts/one-shot-check.sh prototypes/shadow-museum --keep`.
- Re-vendoring three.js: `vendor-three.sh` fetches ES modules; they must be joined again into one
  classic `vendor/three.js` (core wrapped in its own function, module's imports destructured from it).
