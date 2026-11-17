// PROTOTYPE - NOT FOR PRODUCTION
// Question: Kéo từng bộ phận của vật thể vào bóng đen cho nó hiện ra có đủ vui để làm hết 6 vật không?
// Date: 2026-11-17
// The 3D side of Shadow Museum, drawn with three.js (vendor/three.js). The 2D art of every piece
// and object is traced into outlines and pushed out into thick, glossy toy blocks; the puzzle is a
// round board with the object's shadow pressed into it; each scene's hub is a small 3D room.
// The rules stay in index.html: this file only draws, and answers "where is that on the screen".
'use strict';
const G3 = (() => {
const T = THREE, V3 = T.Vector3;
let R = null, ENV = null;
const tmp = new V3(), tmp2 = new V3();
const easeOutBack = u => { const c = 1.9; u = Math.min(1, Math.max(0, u)); return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const easeOutCubic = u => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
const easeInOut = u => { u = Math.min(1, Math.max(0, u)); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const easeOutElastic = u => { u = Math.min(1, Math.max(0, u)); return u === 0 || u === 1 ? u : Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
const damp = (k, dt) => 1 - Math.exp(-k * dt);

// ---- Renderer -------------------------------------------------------------------------------------
function init(cnv) {
  R = new T.WebGLRenderer({ canvas: cnv, antialias: !CHEAP, powerPreference: 'high-performance' });
  R.setPixelRatio(CHEAP ? 0.5 : Math.min(2, devicePixelRatio || 1));
  R.shadowMap.enabled = !CHEAP; R.shadowMap.type = T.PCFShadowMap;
  R.toneMapping = T.NeutralToneMapping; R.toneMappingExposure = 1;
  ENV = makeEnv();
}
function resize(w, h) { if (R) R.setSize(w, h, false); }
// A soft studio around everything, so the plastic has something bright to reflect.
function makeEnv() {
  const s = new T.Scene();
  s.add(new T.Mesh(new T.SphereGeometry(100, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, map: canvasTex(8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#dfe6f2'); gr.addColorStop(1, '#6c5f80'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }) })));
  const panel = (x, y, z, w, h, i) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(i, i, i), side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  panel(-30, 70, 50, 70, 40, 4); panel(70, 30, 40, 30, 50, 1.6); panel(-60, 10, -60, 40, 30, 1.2);
  const pm = new T.PMREMGenerator(R), tex = pm.fromScene(s, 0.03).texture; pm.dispose(); return tex;
}
function canvasTex(w, h, draw, rep) {
  const c = makeCanvas(w, h), g = c.getContext('2d'); draw(g, w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const matCache = new Map();
function mat(color, o = {}) {
  const key = color + JSON.stringify(o, (k, v) => (v && v.isTexture ? v.uuid : v));
  if (!matCache.has(key)) matCache.set(key, new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.6 }, o)));
  return matCache.get(key);
}
function toScreen(cam, v) { tmp.copy(v).project(cam); return { x: (tmp.x + 1) / 2 * W, y: (1 - tmp.y) / 2 * H, z: tmp.z }; }
function rayAt(cam, x, y) { const rc = new T.Raycaster(); rc.setFromCamera(new T.Vector2(x / W * 2 - 1, 1 - y / H * 2), cam); return rc; }
// The point at screen x, y that lies dist in front of the camera, and how many world units one screen pixel is there.
function camPoint(cam, x, y, dist) {
  const th = Math.tan(cam.fov * Math.PI / 360), v = new V3((x / W * 2 - 1) * th * cam.aspect * dist, (1 - y / H * 2) * th * dist, -dist);
  return cam.localToWorld(v);
}
const pxAt = (cam, dist) => 2 * dist * Math.tan(cam.fov * Math.PI / 360) / H;

// ---- Tracing a picture into outlines --------------------------------------------------------------
// Marching squares over the alpha channel: every crossing on a cell edge is a point, and each point
// joins exactly two others, so walking neighbours gives closed loops. A loop inside an odd number of
// others is a hole.
function traceLoops(cv, thr = 110) {
  const w = cv.width, h = cv.height, d = cv.getContext('2d').getImageData(0, 0, w, h).data, GW = w + 2, GH = h + 2, A = new Float32Array(GW * GH);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) A[(y + 1) * GW + x + 1] = d[(y * w + x) * 4 + 3];
  const pts = new Map(), adj = new Map();
  const at = (gx, gy) => A[gy * GW + gx];
  const P = (key, ax, ay, bx, by) => { if (!pts.has(key)) { const a0 = at(ax, ay), a1 = at(bx, by), t = (thr - a0) / (a1 - a0); pts.set(key, [ax + (bx - ax) * t - 1, ay + (by - ay) * t - 1]); } return key; };
  const link = (a, b) => { if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []); adj.get(a).push(b); adj.get(b).push(a); };
  const SEG = [[], ['L', 'B'], ['B', 'R'], ['L', 'R'], ['T', 'R'], ['T', 'R', 'L', 'B'], ['T', 'B'], ['T', 'L'], ['T', 'L'], ['T', 'B'], ['T', 'L', 'B', 'R'], ['T', 'R'], ['L', 'R'], ['R', 'B'], ['L', 'B'], []];
  for (let gy = 0; gy < GH - 1; gy++) for (let gx = 0; gx < GW - 1; gx++) {
    const c = (at(gx, gy) > thr ? 8 : 0) | (at(gx + 1, gy) > thr ? 4 : 0) | (at(gx + 1, gy + 1) > thr ? 2 : 0) | (at(gx, gy + 1) > thr ? 1 : 0);
    if (c === 0 || c === 15) continue;
    const E = { T: () => P((gy * GW + gx) * 2, gx, gy, gx + 1, gy), B: () => P(((gy + 1) * GW + gx) * 2, gx, gy + 1, gx + 1, gy + 1),
      L: () => P((gy * GW + gx) * 2 + 1, gx, gy, gx, gy + 1), R: () => P((gy * GW + gx + 1) * 2 + 1, gx + 1, gy, gx + 1, gy + 1) };
    const s = SEG[c]; for (let k = 0; k < s.length; k += 2) link(E[s[k]](), E[s[k + 1]]());
  }
  const seen = new Set(), loops = [];
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop = []; let cur = start, prev = -1;
    for (let guard = 0; guard < 200000; guard++) {
      seen.add(cur); loop.push(pts.get(cur));
      const nb = adj.get(cur), next = nb[0] !== prev ? nb[0] : nb[1];
      prev = cur; cur = next; if (cur === start || seen.has(cur)) break;
    }
    if (loop.length > 2) loops.push(loop);
  }
  return loops;
}
function rdp(p, eps) {
  if (p.length < 3) return p;
  const [ax, ay] = p[0], [bx, by] = p[p.length - 1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
  let dm = -1, idx = 0;
  for (let i = 1; i < p.length - 1; i++) { const d = L > 1e-9 ? Math.abs(dy * (p[i][0] - ax) - dx * (p[i][1] - ay)) / L : Math.hypot(p[i][0] - ax, p[i][1] - ay); if (d > dm) { dm = d; idx = i; } }
  if (dm > eps) return rdp(p.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(p.slice(idx), eps));
  return [p[0], p[p.length - 1]];
}
function simplifyLoop(l, eps) {
  let far = 0, fd = -1; l.forEach((q, i) => { const d = (q[0] - l[0][0]) ** 2 + (q[1] - l[0][1]) ** 2; if (d > fd) { fd = d; far = i; } });
  return rdp(l.slice(0, far + 1), eps).slice(0, -1).concat(rdp(l.slice(far).concat([l[0]]), eps).slice(0, -1));
}
const areaOf = l => { let a = 0; for (let i = 0, j = l.length - 1; i < l.length; j = i++) a += (l[j][0] - l[i][0]) * (l[j][1] + l[i][1]); return a / 2; };
function inPoly(pt, l) { let c = false; for (let i = 0, j = l.length - 1; i < l.length; j = i++) { const [xi, yi] = l[i], [xj, yj] = l[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
// Loops of a picture with how deeply each is nested: even depth is solid, odd is a hole.
function nestedLoops(cv, eps = 0.75, minArea = 10) {
  const loops = traceLoops(cv).map(l => simplifyLoop(l, eps)).filter(l => l.length >= 3 && Math.abs(areaOf(l)) > minArea);
  return loops.map((l, i) => ({ l, depth: loops.reduce((n, o, j) => n + (j !== i && inPoly(l[0], o) ? 1 : 0), 0) }));
}
function shapesFrom(nl, V, solidParity = 0) {
  const shapes = [];
  nl.forEach(a => {
    if (a.depth % 2 !== solidParity) return;
    const s = new T.Shape(a.l.map(V));
    nl.forEach(b => { if (b.depth === a.depth + 1 && inPoly(b.l[0], a.l)) s.holes.push(new T.Path(b.l.map(V))); });
    shapes.push(s);
  });
  return shapes;
}
function avgColor(cv) {
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 12) { if (d[i + 3] < 160) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  return n ? [r / n, g / n, b / n] : [150, 150, 150];
}
// A picture as a toy block: its outline pushed back depthArt (art px), its face the picture itself,
// its sides the picture's own colour a shade darker. Origin at the picture's centre, face towards +z.
function block(cv, depthArt) {
  const key = '_g3_' + depthArt; if (cv[key]) return cv[key];
  const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
  const shapes = shapesFrom(nestedLoops(cv), q => new T.Vector2(q[0] - cx, cy - q[1]));
  const bs = Math.min(2.4, depthArt * 0.2);
  const UV = {
    generateTopUV(g, v, a, b, c) { return [a, b, c].map(i => new T.Vector2((v[i * 3] + cx) / w, 1 - (cy - v[i * 3 + 1]) / h)); },
    generateSideWallUV() { return [new T.Vector2(), new T.Vector2(), new T.Vector2(), new T.Vector2()]; },
  };
  const geo = new T.ExtrudeGeometry(shapes, { depth: Math.max(0.5, depthArt - 2 * bs), bevelEnabled: true, bevelThickness: bs, bevelSize: bs, bevelOffset: -bs, bevelSegments: 2, UVGenerator: UV });
  geo.translate(0, 0, bs);
  const rgb = avgColor(cv), pad = makeCanvas(w, h), pg = pad.getContext('2d');
  pg.fillStyle = `rgb(${rgb.map(Math.round).join(',')})`; pg.fillRect(0, 0, w, h); pg.drawImage(cv, 0, 0);
  const map = new T.CanvasTexture(pad); map.colorSpace = T.SRGBColorSpace; map.anisotropy = 8;
  const face = new T.MeshStandardMaterial({ map, roughness: 0.36, metalness: 0 });
  const side = new T.MeshStandardMaterial({ color: new T.Color().setRGB(rgb[0] / 255 * 0.68, rgb[1] / 255 * 0.66, rgb[2] / 255 * 0.7, T.SRGBColorSpace), roughness: 0.42 });
  return (cv[key] = { geo, face, side, w, h, mats: [face, side] });
}
const SIL = new T.MeshStandardMaterial({ color: '#1d1828', roughness: 0.32, metalness: 0.15 });
// The object's real 3D model (models.js), a fresh copy each call that shares geometry and materials,
// sized to its picture: as tall as the picture's box in art px (narrower if the picture is), standing
// on y = 0, centred on x and z. An object with no model falls back to the inflated picture.
const MODEL_PROTO = {}, ORIG_MAT = new WeakMap();
function artBox(i) { const A = ARTS[i]; return A.box || (A.box = alphaBox(A.img.getContext('2d').getImageData(0, 0, ART_N, ART_N).data, 0, 0, ART_N, ART_N)); }
function objectModel(i) {
  const art = OBJECTS[i].art, box = artBox(i);
  if (!MODEL_PROTO[art]) {
    let raw; if (MODELS[art]) raw = MODELS[art](); else { const s = solidModel(i); raw = new T.Mesh(s.geo, s.mat); }
    raw.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(raw), size = bb.getSize(new V3()), k = Math.min(box.h / size.y, box.w * 1.15 / size.x);
    raw.position.sub(new V3((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2));
    const inner = new T.Group(); inner.add(raw); inner.scale.setScalar(k);
    const proto = new T.Group(); proto.add(inner); proto.userData = { h: size.y * k, w: size.x * k, d: size.z * k };
    proto.traverse(o => { if (o.isMesh) { o.castShadow = !CHEAP; o.receiveShadow = !CHEAP; } });
    MODEL_PROTO[art] = proto;
  }
  return MODEL_PROTO[art].clone(true);
}
function setSil(g, on) { // a model all in shadow, or back in its own colours
  g.traverse(o => { if (!o.isMesh) return; if (!ORIG_MAT.has(o)) ORIG_MAT.set(o, o.material); o.material = on ? SIL : ORIG_MAT.get(o); });
}
// ---- The object as a real solid ---------------------------------------------------------------------
// The picture inflated into a round 3D shape: every point inside the outline lies in some circle that
// fits inside it, and a ball of that circle's radius around each centre, all joined, gives the depth
// there. A disc becomes a ball, a strip a tube, a vase a round vase, so it can be turned all the way
// round. The picture is painted on from the front, and shows mirrored from behind.
function solidModel(i) {
  const A = ARTS[i]; if (A.solid) return A.solid;
  const N = ART_N, px = A.img.getContext('2d').getImageData(0, 0, N, N).data, thr = 100, BIG = 1e6, Q = Math.SQRT2;
  const D = new Float32Array(N * N);
  for (let k = 0; k < N * N; k++) D[k] = px[k * 4 + 3] > thr ? BIG : 0;
  const get = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0 : D[y * N + x]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const k = y * N + x; if (!D[k]) continue; // distance to the outside, two chamfer passes
    D[k] = Math.min(D[k], get(x - 1, y) + 1, get(x, y - 1) + 1, get(x - 1, y - 1) + Q, get(x + 1, y - 1) + Q); }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const k = y * N + x; if (!D[k]) continue;
    D[k] = Math.min(D[k], get(x + 1, y) + 1, get(x, y + 1) + 1, get(x + 1, y + 1) + Q, get(x - 1, y + 1) + Q); }
  const S = 4, G = Math.floor((N - 1) / S) + 1, gi = (gx, gy) => gy * G + gx;
  const at = (gx, gy) => Math.min(N - 1, gy * S) * N + Math.min(N - 1, gx * S);
  const alpha = g => px[at(g % G, (g / G) | 0) * 4 + 3], inside = new Uint8Array(G * G), h = new Float32Array(G * G);
  for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) inside[gi(gx, gy)] = D[at(gx, gy)] > 0 ? 1 : 0;
  for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) { // each inside point's ball
    if (!inside[gi(gx, gy)]) continue; const r = D[at(gx, gy)], R = Math.ceil(r / S);
    for (let dy = -R; dy <= R; dy++) { const y = gy + dy; if (y < 0 || y >= G) continue;
      for (let dx = -R; dx <= R; dx++) { const x = gx + dx; if (x < 0 || x >= G) continue; const q = gi(x, y); if (!inside[q]) continue;
        const dd = (dx * S) ** 2 + (dy * S) ** 2; if (dd < r * r) { const z = Math.sqrt(r * r - dd); if (z > h[q]) h[q] = z; } } }
  }
  // the points used: inside ones, and outside ones next to them pulled onto the outline
  const b = alphaBox(px, 0, 0, N, N), cx = b.x + b.w / 2, cy = b.y + b.h / 2, k3 = tune.inflate;
  const pos = [], uv = [], idxF = new Int32Array(G * G).fill(-1), idxB = new Int32Array(G * G).fill(-1);
  // texture lookups are pulled a few px inside the outline, so the sides are painted with the
  // object's own colours rather than smeared copies of its dark outline
  const Dp = (x, y) => D[Math.max(0, Math.min(N - 1, Math.round(y))) * N + Math.max(0, Math.min(N - 1, Math.round(x)))];
  const uvOf = (x, y) => { const d = Dp(x, y), gx = Dp(x + 3, y) - Dp(x - 3, y), gy = Dp(x, y + 3) - Dp(x, y - 3), L = Math.hypot(gx, gy), s = Math.max(0, 8 - d);
    if (L > 0 && s > 0) { x += gx / L * s; y += gy / L * s; } return [x / N, 1 - y / N]; };
  let maxH = 0;
  for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
    const g = gi(gx, gy); let x = gx * S, y = gy * S, z = 0;
    if (inside[g]) z = h[g] * k3;
    else {
      let sx = 0, sy = 0, n = 0;
      for (const [nx, ny] of [[gx - 1, gy], [gx + 1, gy], [gx, gy - 1], [gx, gy + 1]]) {
        if (nx < 0 || ny < 0 || nx >= G || ny >= G || !inside[gi(nx, ny)]) continue;
        const a0 = alpha(g), a1 = alpha(gi(nx, ny)), t = Math.max(0, Math.min(1, (thr - a0) / Math.max(1, a1 - a0)));
        sx += gx * S + (nx - gx) * S * t; sy += gy * S + (ny - gy) * S * t; n++;
      }
      if (!n) continue; x = sx / n; y = sy / n;
    }
    maxH = Math.max(maxH, z);
    const u = uvOf(x, y);
    idxF[g] = pos.length / 3; pos.push(x - cx, cy - y, z); uv.push(u[0], u[1]);
    idxB[g] = pos.length / 3; pos.push(x - cx, cy - y, -z); uv.push(u[0], u[1]);
  }
  const ind = [];
  for (let gy = 0; gy < G - 1; gy++) for (let gx = 0; gx < G - 1; gx++) {
    const a = gi(gx, gy), bq = gi(gx + 1, gy), c = gi(gx + 1, gy + 1), d = gi(gx, gy + 1);
    if (idxF[a] < 0 || idxF[bq] < 0 || idxF[c] < 0 || idxF[d] < 0) continue;
    if (!(inside[a] || inside[bq] || inside[c] || inside[d])) continue;
    ind.push(idxF[a], idxF[d], idxF[c], idxF[a], idxF[c], idxF[bq]); // the front, facing +z
    ind.push(idxB[a], idxB[c], idxB[d], idxB[a], idxB[bq], idxB[c]); // the back
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(ind); geo.computeVertexNormals();
  const rgb = avgColor(A.img), pad = makeCanvas(N, N), pg = pad.getContext('2d');
  pg.fillStyle = `rgb(${rgb.map(Math.round).join(',')})`; pg.fillRect(0, 0, N, N); pg.drawImage(A.img, 0, 0);
  const map = new T.CanvasTexture(pad); map.colorSpace = T.SRGBColorSpace; map.anisotropy = 8;
  const mat = new T.MeshStandardMaterial({ map, roughness: 0.36 });
  return (A.solid = { geo, mat, box: b, depth: maxH * 2 });
}

// ---- Shapes for the set ---------------------------------------------------------------------------
function rrShape(w, h, r) {
  const s = new T.Shape(), x = -w / 2, y = -h / 2; r = Math.max(0.01, Math.min(r, w / 2, h / 2));
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
// A box with soft rounded edges, centred on its middle: w across, h up, d deep.
function rbox(w, h, d, r, m) {
  const b = Math.max(0.5, Math.min(r, d / 2 - 0.5, w / 2 - 1, h / 2 - 1));
  const geo = new T.ExtrudeGeometry(rrShape(w - 2 * b, h - 2 * b, Math.max(0.5, r - b)), { depth: Math.max(0.5, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 });
  geo.translate(0, 0, -(d - 2 * b) / 2);
  return shade(new T.Mesh(geo, m));
}
function shade(m, cast = true) { m.castShadow = cast && !CHEAP; m.receiveShadow = !CHEAP; return m; }
function put(parent, m, x, y, z, ry = 0) { m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m; }
const cyl = (rt, rb, h, m, seg = 40) => shade(new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m));
const sph = (r, m) => shade(new T.Mesh(new T.SphereGeometry(r, 24, 16), m));
function plane(w, h, m) { return shade(new T.Mesh(new T.PlaneGeometry(w, h), m), false); }
function floorPlane(w, d, m) { const p = plane(w, d, m); p.rotation.x = -Math.PI / 2; return p; }
function lights(sc, o) {
  const hemi = new T.HemisphereLight(o.sky || '#ffffff', o.ground || '#a89a86', o.hemi || 1.0); sc.add(hemi);
  const key = new T.DirectionalLight(o.key || '#fff2dc', o.keyI || 2.2); key.position.copy(o.keyPos || new V3(-500, 1200, 700));
  key.castShadow = !CHEAP; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.8; key.shadow.radius = 5;
  const sc2 = key.shadow.camera, e = o.shadowExtent || 800; sc2.left = -e; sc2.right = e; sc2.top = e; sc2.bottom = -e; sc2.near = 50; sc2.far = 4000;
  key.target.position.copy(o.keyTarget || new V3(0, 0, 0)); sc.add(key); sc.add(key.target);
  const fill = new T.DirectionalLight(o.fill || '#d6e4ff', o.fillI || 0.55); fill.position.set(600, 400, 900); sc.add(fill);
  sc.environment = ENV; sc.environmentIntensity = o.env || 0.5;
  return { hemi, key, fill, base: { hemi: hemi.intensity, key: key.intensity } };
}
function plant(s, leafC = '#4f9a52') { // a pot with spiky leaves
  const g = new T.Group();
  put(g, cyl(26 * s, 19 * s, 44 * s, mat('#d9744a', { roughness: 0.5 })), 0, 22 * s, 0);
  put(g, cyl(28 * s, 28 * s, 8 * s, mat('#e58a5c', { roughness: 0.5 })), 0, 44 * s, 0);
  for (let k = 0; k < 9; k++) {
    const a = k / 9 * Math.PI * 2, leaf = shade(new T.Mesh(new T.ConeGeometry(7 * s, 90 * s * (0.7 + (k % 3) * 0.15), 6), mat(k % 2 ? leafC : '#6bb86a', { roughness: 0.5 })));
    leaf.position.set(Math.cos(a) * 9 * s, 80 * s, Math.sin(a) * 9 * s); leaf.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45); g.add(leaf);
  }
  return g;
}
function tree(s) {
  const g = new T.Group();
  put(g, cyl(14 * s, 20 * s, 240 * s, mat('#8a5a3a', { roughness: 0.8 })), 0, 120 * s, 0);
  const leaf = mat('#5aa54e', { roughness: 0.75 }), leaf2 = mat('#74bd5c', { roughness: 0.75 });
  for (const [x, y, z, r] of [[0, 290, 0, 95], [-70, 250, 20, 70], [70, 255, -10, 72], [10, 350, -10, 70], [-30, 300, 60, 60], [50, 310, 50, 58]]) put(g, sph(r * s, (x + z) % 3 ? leaf : leaf2), x * s, y * s, z * s);
  return g;
}
function person(shirt, hair, kid) {
  const g = new T.Group(), s = kid ? 0.7 : 1;
  const legs = [-1, 1].map(k => put(g, cyl(5 * s, 5 * s, 44 * s, mat('#3d3a4a')), k * 7 * s, 22 * s, 0));
  put(g, shade(new T.Mesh(new T.CapsuleGeometry(15 * s, 30 * s, 4, 12), mat(shirt, { roughness: 0.5 }))), 0, 70 * s, 0);
  put(g, sph(14 * s, mat('#f2c9a5', { roughness: 0.5 })), 0, 112 * s, 0);
  const h = put(g, sph(15 * s, mat(hair, { roughness: 0.7 })), 0, 117 * s, -3 * s); h.scale.set(1, 0.75, 1);
  g.userData.legs = legs; return g;
}

// ---- The puzzle ------------------------------------------------------------------------------------
// Board space is index.html's: x, y from 0 to BOARD.s, the object's art at BS board units per art px.
// In the world the board lies on y = 0 with its centre at the origin; board y runs towards the camera.
const BOARD_R = 395, SLAB = 46, HOLLOW = 22;
const PZ_LOOK = {
  museum: { wall: '#8fb3ea', floor: '#5a73c4', rim: '#8b64d6', base: '#6c4bb8', top: '#f1d9ab', bg: '#7fa3dc' },
  kitchen: { wall: '#a5dcc4', floor: '#d39a62', rim: '#ec8a6a', base: '#c96a4e', top: '#f6e5c2', bg: '#94cdb5' },
  park: { wall: '#9fd5f4', floor: '#6fbf62', rim: '#4f97e0', base: '#3a78c2', top: '#f3dfb0', bg: '#8ccdf0' },
};
const qFlat = new T.Quaternion().setFromAxisAngle(new V3(1, 0, 0), -Math.PI / 2);
let PZ = null;
// The board stands upright, facing the camera. Its frame is the board laid flat and then stood up:
// in the frame, y comes out of the board towards the viewer and z runs down the screen.
const b2w = (bx, by) => new V3(bx - BOARD.s / 2, 0, by - BOARD.s / 2); // board space to the board frame
const FRAME_Q = new T.Quaternion().setFromAxisAngle(new V3(1, 0, 0), Math.PI / 2), FRAME_QI = FRAME_Q.clone().invert();
const toFrame = v => PZ.frame.worldToLocal(v.clone()), fromFrame = v => PZ.frame.localToWorld(v.clone());
const qToFrame = q => FRAME_QI.clone().multiply(q);
const FLOOR_Y = -(BOARD_R + 190);
function buildPuzzleSet() {
  const sc = new T.Scene(), cam = new T.PerspectiveCamera(32, W / H, 20, 8000);
  sc.add(cam);
  const L = lights(sc, { keyPos: new V3(-380, 760, 1500), keyI: 2.3, hemi: 1.05, shadowExtent: 700, env: 0.55 });
  const wallM = new T.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(64, 512, (g, w, h) => { // light falling down the wall
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c9d2df'); gr.addColorStop(0.45, '#ffffff'); gr.addColorStop(1, '#dfe4ee'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }) });
  put(sc, plane(5000, 3600, wallM), 0, 300, -700);
  const floorM = new T.MeshStandardMaterial({ roughness: 0.7, map: canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e4e8f0'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }, [16, 16]) });
  put(sc, floorPlane(5000, 4000, floorM), 0, FLOOR_Y, 0).receiveShadow = !CHEAP;
  // a picture and a shelf with a plant on the wall, like a corner of a room
  const pic = new T.Group(); put(pic, rbox(300, 230, 20, 8, mat('#f3e1b8', { roughness: 0.45 })), 0, 0, 0);
  put(pic, plane(250, 180, new T.MeshStandardMaterial({ roughness: 0.8, map: canvasTex(256, 180, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd2f5'); gr.addColorStop(1, '#e6f5ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7cc46a'; g.beginPath(); g.ellipse(70, 200, 160, 90, 0, 0, 7); g.fill(); g.fillStyle = '#5daa52'; g.beginPath(); g.ellipse(220, 210, 150, 80, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; for (const [x, y] of [[60, 50], [180, 35]]) { g.beginPath(); g.arc(x, y, 18, 0, 7); g.arc(x + 20, y - 6, 20, 0, 7); g.arc(x + 40, y, 16, 0, 7); g.fill(); }
  }) })), 0, 0, 11);
  put(sc, pic, -560, 480, -688).rotation.z = 0.04;
  put(sc, rbox(240, 26, 120, 8, mat('#f2c45a', { roughness: 0.45 })), 560, 300, -640);
  put(sc, plant(1.5), 560, 313, -640);
  // the board, stood up: a thick round back plate, a raised rim, the board with the shadow pressed in
  const frameG = new T.Group(); frameG.quaternion.copy(FRAME_Q); sc.add(frameG);
  const table = new T.Group(); frameG.add(table);
  const baseM = mat('#6c4bb8', { roughness: 0.35 }), rimM = mat('#8b64d6', { roughness: 0.3 });
  put(table, cyl(BOARD_R + 70, BOARD_R + 80, 70, baseM, 96), 0, -SLAB - 35, 0);
  const ringShape = new T.Shape(); ringShape.absarc(0, 0, BOARD_R + 50, 0, Math.PI * 2, false);
  const hole = new T.Path(); hole.absarc(0, 0, BOARD_R + 2, 0, Math.PI * 2, true); ringShape.holes.push(hole);
  const rim = shade(new T.Mesh(new T.ExtrudeGeometry(ringShape, { depth: SLAB, bevelEnabled: true, bevelThickness: 7, bevelSize: 7, bevelSegments: 4, curveSegments: 96 }), rimM));
  rim.rotation.x = -Math.PI / 2; rim.position.y = -SLAB; table.add(rim);
  const hollowFloor = shade(new T.Mesh(new T.CircleGeometry(BOARD_R, 96), new T.MeshStandardMaterial({ color: '#241d36', roughness: 0.55, metalness: 0.05 })), false);
  hollowFloor.rotation.x = -Math.PI / 2; hollowFloor.position.y = -HOLLOW; table.add(hollowFloor);
  // its foot on the floor
  put(sc, rbox(300, 120, 260, 30, baseM), 0, FLOOR_Y + 60, -60);
  put(sc, rbox(120, BOARD_R - 200, 80, 20, rimM), 0, FLOOR_Y + 110 + (BOARD_R - 200) / 2, -90);
  // the tray: a bar of slots that faces the camera at the foot of the screen
  const tray = new T.Group(); sc.add(tray);
  const barM = mat('#7b52cc', { roughness: 0.32 }), slotM = mat('#6a44b8', { roughness: 0.5 }), lipM = mat('#b79af0', { roughness: 0.4 });
  put(tray, rbox(TRAY3.pitch * TRAY3.n + 34, TRAY3.h, 40, 30, barM), 0, 0, 0).castShadow = false;
  put(tray, rbox(TRAY3.pitch * TRAY3.n + 14, TRAY3.h - 20, 12, 22, lipM), 0, 0, 16).castShadow = false;
  for (let k = 0; k < TRAY3.n; k++) put(tray, rbox(TRAY3.pitch - 14, TRAY3.h - 36, 10, 18, slotM), (k - (TRAY3.n - 1) / 2) * TRAY3.pitch, 0, 20).castShadow = false;
  PZ = { sc, cam, L, wallM, floorM, baseM, rimM, frame: frameG, table, tray, boards: new Map(), board: null, model: null, pieces: new Map(), cur: null, ghost: null, area: -1 };
  sc.updateMatrixWorld(true);
  placeCam();
}
function placeCam() {
  fitPuzzleCam();
  const tc = camPoint(PZ.cam, TRAY3.cx, TRAY3.cy, TRAY3.depth); PZ.tray.position.copy(tc); PZ.tray.quaternion.copy(PZ.cam.quaternion); PZ.tray.scale.setScalar(pxAt(PZ.cam, TRAY3.depth));
  PZ.tray.updateMatrixWorld(true);
}
// Look at the standing board from the front, tune.cam_tilt degrees down from level, sized so it spans
// the screen's width with its centre at BOARD3.cy.
function fitPuzzleCam() {
  const cam = PZ.cam, th = tune.cam_tilt * Math.PI / 180, f = H / 2 / Math.tan(cam.fov * Math.PI / 360);
  let D = 2400, ty = 0;
  for (let k = 0; k < 40; k++) {
    cam.position.set(0, ty + Math.sin(th) * D, Math.cos(th) * D); cam.lookAt(0, ty, 0); cam.updateMatrixWorld(true);
    const a = toScreen(cam, new V3(-BOARD_R - 50, 0, 0)), b = toScreen(cam, new V3(BOARD_R + 50, 0, 0)), c = toScreen(cam, new V3(0, 0, 0));
    D *= (b.x - a.x) / BOARD3.width; ty -= (c.y - BOARD3.cy) * D / f * 0.7;
  }
  PZ.camTilt = tune.cam_tilt;
}
function boardMesh(i) { // the board with the object's shadow cut out of it
  if (PZ.boards.has(i)) return PZ.boards.get(i);
  const nl = nestedLoops(ARTS[i].sil, 0.75, 30);
  const V = q => new T.Vector2(q[0] * BS - BOARD.s / 2, -(q[1] * BS - BOARD.s / 2));
  const outline = new T.Shape(); outline.absarc(0, 0, BOARD_R, 0, Math.PI * 2, false);
  nl.filter(a => a.depth === 0).forEach(a => outline.holes.push(new T.Path(a.l.map(V))));
  const shapes = [outline].concat(shapesFrom(nl, V, 1)); // islands inside the shadow are board again
  const geo = new T.ExtrudeGeometry(shapes, { depth: SLAB - 6, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelOffset: 0, bevelSegments: 3, curveSegments: 96 });
  geo.translate(0, 0, 3);
  const topM = new T.MeshStandardMaterial({ roughness: 0.55, map: canvasTex(512, 512, (g, w, h) => { // a soft wood grain
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 60; k++) { const y = (k * 37) % h; g.strokeStyle = `rgba(150,105,60,${0.04 + (k % 5) * 0.012})`; g.lineWidth = 2 + (k % 3); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 12 * Math.sin(k), w * 0.7, y - 10 * Math.cos(k), w, y + 6); g.stroke(); }
  }) });
  const m = shade(new T.Mesh(geo, [topM, new T.MeshStandardMaterial({ color: '#3a2f4e', roughness: 0.6 })]));
  m.rotation.x = -Math.PI / 2; m.position.y = -SLAB;
  PZ.boards.set(i, m); return m;
}
function pieceVis(p) {
  let v = PZ.pieces.get(p);
  if (!v) {
    const b = block(p.part.cv, tune.piece_depth_3d), mesh = shade(new T.Mesh(b.geo, b.mats));
    v = { mesh, pos: new V3(), quat: new T.Quaternion(), scl: 0, fresh: true, b, vel: new V3(), last: new V3() };
    PZ.pieces.set(p, v); PZ.frame.add(mesh);
  }
  return v;
}
// Where a piece sits in the tray (in the board frame): its place in the row of pieces still to
// place, less the scroll.
function trayTarget(p, rank, scroll, t) {
  const v = rank - scroll, x = (v - (TRAY3.n - 1) / 2) * TRAY3.pitch, out = Math.max(0, Math.abs(v - (TRAY3.n - 1) / 2) - (TRAY3.n - 1) / 2 - 0.15);
  const k = Math.max(0, 1 - out * 2.2), pos = toFrame(PZ.tray.localToWorld(new V3(x, 2, 44)));
  const room = (TRAY3.pitch - 38) / Math.max(p.part.w, p.part.h), sc = Math.min(room, tune.thumb_zoom_max) * PZ.tray.scale.x * k;
  const wob = Math.sin(t * 1.6 + p.id * 1.3) * 0.06;
  const q = qToFrame(PZ.cam.quaternion.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(-0.32, 0.22 + wob, wob * 0.5))));
  return { pos, q, sc, visible: k > 0.01 };
}
function homeWorld(p) { const c = b2w((p.part.x + p.part.w / 2) * BS, (p.part.y + p.part.h / 2) * BS); c.y = -HOLLOW; return c; }
function setPuzzleLook(a) {
  if (PZ.area === a) return; PZ.area = a;
  const L = PZ_LOOK[AREAS[a].key]; PZ.wallM.color.set(L.wall); PZ.floorM.color.set(L.floor); PZ.rimM.color.set(L.rim); PZ.baseM.color.set(L.base); PZ.sc.background = new T.Color(L.bg); PZ.topC = L.top;
}
function openPuzzle(cur) {
  for (const v of PZ.pieces.values()) PZ.frame.remove(v.mesh);
  PZ.pieces.clear();
  if (PZ.board) PZ.table.remove(PZ.board);
  if (PZ.model) PZ.sc.remove(PZ.model);
  if (PZ.ghost) { PZ.frame.remove(PZ.ghost); PZ.ghost = null; }
  setPuzzleLook(OBJECTS[cur.i].area);
  PZ.board = boardMesh(cur.i); PZ.board.material[0].color.set(PZ.topC); PZ.table.add(PZ.board);
  PZ.model = objectModel(cur.i); PZ.model.visible = false; PZ.mbox = artBox(cur.i); PZ.sc.add(PZ.model);
  PZ.cur = cur;
}
function renderPuzzle(dt) {
  if (!PZ) buildPuzzleSet();
  if (PZ.camTilt !== tune.cam_tilt) placeCam();
  const cur = state.cur; if (PZ.cur !== cur) openPuzzle(cur);
  const t = cur.t, won = cur.wonAt !== null, w = won ? t - cur.wonAt : 0;
  // the board comes forward and rolls in when the level opens, and shakes on a miss
  const intro = easeOutBack(t / 0.55), shake = t - cur.wrongAt < 0.3 ? Math.sin((t - cur.wrongAt) * 70) * 9 * (1 - (t - cur.wrongAt) / 0.3) : 0;
  PZ.table.position.set(shake, (1 - intro) * -400, 0);
  PZ.table.rotation.y = (1 - easeOutCubic(t / 0.7)) * -0.9;
  // finished: the flat pieces puff up into the whole object, which comes forward and turns round
  const showObj = won && w > 0.3;
  PZ.model.visible = showObj;
  if (showObj) {
    const b = PZ.mbox, u = PZ.model.userData, cx = (b.x + b.w / 2) * BS - BOARD.s / 2, by = -((b.y + b.h) * BS - BOARD.s / 2) + (b.h - u.h) / 2 * BS;
    const puff = easeOutBack((w - 0.3) / 0.7), fwd = easeInOut((w - 0.35) / 0.9), grow = 1 + 0.12 * fwd;
    PZ.model.position.set(cx * (1 - fwd * 0.6), by * (1 - fwd * 0.25) + fwd * 40, fwd * (u.d * BS * 0.5 + 120));
    PZ.model.scale.set(BS * grow, BS * grow, BS * grow * Math.max(0.03, puff));
    const s = Math.max(0, w - 0.9); PZ.model.rotation.y = (s < 1 ? s * s * 0.9 : 0.9 + (s - 1) * 1.8) + (cur.spin || 0);
    PZ.model.rotation.x = 0.08 * fwd;
  }
  // the pieces, in the board frame
  const list = state.cur.pz.pieces.filter(p => !p.placed).sort((a, b) => a.slot - b.slot), d = cur.drag;
  cur.scrollVis = cur.scrollVis === undefined ? cur.scroll : cur.scrollVis + (cur.scroll - cur.scrollVis) * damp(14, dt);
  for (const p of cur.pz.pieces) {
    const v = pieceVis(p); let tp, tq, ts, k = 16, vis = true;
    if (p.placed) {
      tp = homeWorld(p); tq = qFlat; ts = BS; k = p.hinted ? 7 : 20;
      const u = (t - p.placedAt) / 0.32; if (u < 1 && u > 0) ts *= 1 + 0.12 * Math.sin(u * Math.PI) * (1 - u * 0.5);
      if (v.pos.distanceTo(tp) > 30) tp = tp.clone().setY(tp.y + Math.min(140, v.pos.distanceTo(tp) * 0.35)); // an arc on the way in
      vis = !showObj;
    } else if ((d && d.p === p && d.moved && d.mode === 'piece') || (cur.kb && list[cur.sel] === p)) {
      const at = d && d.p === p ? d : null, hold = at && at.pos ? at.pos : cur.cursor; // board space, already less the lift
      const inTray = at && at.y > TRAY3.cy - TRAY3.h * 0.75;
      if (inTray) { tp = toFrame(camPoint(PZ.cam, at.x, at.y - 30, TRAY3.depth - 30)); tq = qToFrame(PZ.cam.quaternion.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(-0.5, 0, 0)))); ts = trayTarget(p, 0, 0, t).sc * 1.25; }
      else {
        tp = b2w(hold.x, hold.y); tp.y = tune.lift_height; ts = BS * 1.04;
        const vx = v.vel.x, vz = v.vel.z, cl = q => Math.max(-0.4, Math.min(0.4, q));
        tq = qFlat.clone().premultiply(new T.Quaternion().setFromEuler(new T.Euler(cl(vz * 0.0009), 0, cl(-vx * 0.0009))));
      }
      k = 22;
    } else {
      const rank = list.indexOf(p), tt = trayTarget(p, rank, cur.scrollVis, t);
      tp = tt.pos; tq = tt.q; ts = tt.sc; vis = tt.visible; k = 12;
      const pop = easeOutBack((t - 0.3 - rank * 0.06) / 0.4); ts *= pop;
    }
    if (v.fresh) { const tt = trayTarget(p, Math.max(0, list.indexOf(p)), cur.scroll, t); v.pos.copy(tt.pos); v.quat.copy(tt.q); v.scl = 0; v.fresh = false; v.last.copy(v.pos); }
    const a = damp(k, dt);
    v.pos.lerp(tp, a); v.quat.slerp(tq, Math.min(1, a * 1.1)); v.scl += (ts - v.scl) * a;
    if (dt > 0) v.vel.lerp(tmp2.copy(v.pos).sub(v.last).divideScalar(dt), damp(10, dt)); v.last.copy(v.pos);
    v.mesh.position.copy(v.pos); v.mesh.quaternion.copy(v.quat); v.mesh.scale.setScalar(Math.max(1e-4, v.scl)); v.mesh.visible = vis && v.scl > 0.002;
    v.mesh.renderOrder = p.placed ? 0 : 2;
  }
  // the first level's ghost piece, carried from the tray to its place by the hand
  PZ.ghostAt = null;
  const tip = cur.tip, showGhost = tip && tip.kind === 'drag' && cur.waitFirst && !d && !won;
  if (showGhost) {
    const p = cur.pz.pieces.find(q => !q.placed && !q.decoy);
    if (!PZ.ghost || PZ.ghost.userData.p !== p) {
      if (PZ.ghost) PZ.frame.remove(PZ.ghost);
      const b = block(p.part.cv, tune.piece_depth_3d), gm = b.mats.map(m => { const c = m.clone(); c.transparent = true; c.opacity = 0.6; c.depthWrite = false; return c; });
      PZ.ghost = new T.Mesh(b.geo, gm); PZ.ghost.userData.p = p; PZ.ghost.renderOrder = 5; PZ.frame.add(PZ.ghost);
    }
    const k = (t % 2.4) / 2.4, e = easeInOut(k < 0.15 ? 0 : k > 0.75 ? 1 : (k - 0.15) / 0.6), rank = list.indexOf(p), a = trayTarget(p, rank, cur.scrollVis, t), hp = homeWorld(p);
    hp.y += 60 * (1 - e);
    PZ.ghost.position.lerpVectors(a.pos, hp, e); PZ.ghost.quaternion.slerpQuaternions(a.q, qFlat, e); PZ.ghost.scale.setScalar(a.sc + (BS - a.sc) * e);
    PZ.ghost.visible = k > 0.1 && k < 0.88;
    PZ.ghostAt = toScreen(PZ.cam, fromFrame(PZ.ghost.position));
  } else if (PZ.ghost) PZ.ghost.visible = false;
  R.render(PZ.sc, PZ.cam);
}
// Screen point to board space (on the board's face), or null when the ray misses it.
function screenToBoard(x, y) {
  if (!PZ) buildPuzzleSet();
  const r = rayAt(PZ.cam, x, y).ray; if (Math.abs(r.direction.z) < 1e-6) return null;
  const t = -r.origin.z / r.direction.z; if (t <= 0) return null;
  const p = r.origin.clone().addScaledVector(r.direction, t); return { x: p.x + BOARD.s / 2, y: -p.y + BOARD.s / 2 };
}
function boardToScreen(bx, by, h = 0) { if (!PZ) buildPuzzleSet(); const v = b2w(bx, by); v.y = h; return toScreen(PZ.cam, fromFrame(v)); }
function pieceScreen(p) { const v = PZ && PZ.pieces.get(p); return v ? toScreen(PZ.cam, fromFrame(v.pos)) : null; }

// ---- The hubs ---------------------------------------------------------------------------------------
// Each object's place in its room: x, z on the floor, y the top of what it stands on, s the height
// of its 480 art square. stand says what to build under it.
const HUB_SPOTS = {
  museum: [ // bust, amphora, helmet, globe, crown, cat
    { x: -205, y: 300, z: -380, s: 175, stand: 'niche' },
    { x: 205, y: 300, z: -380, s: 175, stand: 'niche' },
    { x: -200, y: 130, z: 60, s: 200, stand: 'plinth' },
    { x: 200, y: 130, z: 60, s: 200, stand: 'plinth' },
    { x: 0, y: 200, z: -250, s: 165, stand: 'case' },
    { x: 0, y: 80, z: 330, s: 190, stand: 'plinth' },
  ],
  kitchen: [ // teapot, cookie jar, mixer, toaster, pie, cake
    { x: -215, y: 232, z: -350, s: 200 },
    { x: -190, y: 222, z: 60, s: 200 },
    { x: 215, y: 232, z: -350, s: 220 },
    { x: 0, y: 232, z: -350, s: 220 },
    { x: 0, y: 222, z: 60, s: 210 },
    { x: 190, y: 222, z: 60, s: 210 },
  ],
  park: [ // bench, lamp, picnic basket, bicycle, fountain, ice-cream cart
    { x: 215, y: 0, z: -300, s: 260, stand: 'pad' },
    { x: -230, y: 0, z: -320, s: 360, stand: 'pad' },
    { x: 200, y: 0, z: 130, s: 230, stand: 'pad' },
    { x: -200, y: 0, z: 120, s: 280, stand: 'pad' },
    { x: 0, y: 0, z: -430, s: 330, stand: 'pad' },
    { x: 0, y: 0, z: 300, s: 270, stand: 'pad' },
  ],
};
const HUB_CAM = {
  museum: { pos: [0, 780, 1500], look: [0, 230, -120], fov: 42 },
  kitchen: { pos: [0, 800, 1450], look: [0, 260, -120], fov: 42 },
  park: { pos: [0, 760, 1550], look: [0, 200, -120], fov: 42 },
};
const HUBS = {};
function wallTex(base, pattern, rep) {
  return canvasTex(256, 256, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); pattern(g, w, h); }, rep);
}
function buildMuseum(sc, H3) {
  const RW = 340, BZ = -440;
  const floorT = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#f6efe2'; g.fillRect(0, 0, w, h); g.fillStyle = '#9db6df'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); }, [9, 14]);
  put(sc, floorPlane(RW * 2, 1300, new T.MeshStandardMaterial({ map: floorT, roughness: 0.35, metalness: 0.05 })), 0, 0, BZ + 650);
  put(sc, rbox(150, 6, 1150, 3, mat('#c23a4e', { roughness: 0.85 })), 0, 3, BZ + 600).castShadow = false;
  const wallT = wallTex('#a9c6ee', (g, w, h) => { g.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h); }, [5, 3]);
  const wallM = new T.MeshStandardMaterial({ map: wallT, roughness: 0.85 });
  put(sc, plane(RW * 2, 1000, wallM), 0, 500, BZ);
  for (const s of [-1, 1]) { const p = put(sc, plane(1300, 1000, wallM), s * RW, 500, BZ + 650); p.rotation.y = -s * Math.PI / 2; }
  const trim = mat('#f4f1ea', { roughness: 0.45 });
  put(sc, rbox(RW * 2, 150, 14, 4, mat('#7f9fd6', { roughness: 0.5 })), 0, 75, BZ + 7);
  put(sc, rbox(RW * 2, 14, 22, 5, trim), 0, 152, BZ + 10);
  for (const s of [-1, 1]) { put(sc, rbox(14, 150, 1300, 4, mat('#7f9fd6', { roughness: 0.5 })), s * (RW - 7), 75, BZ + 650); put(sc, rbox(22, 14, 1300, 5, trim), s * (RW - 10), 152, BZ + 650); }
  // a tall arched window, glowing, with light falling into the room
  const glassM = new T.MeshStandardMaterial({ color: '#dff1ff', emissive: '#cfe9ff', emissiveIntensity: 0.45, roughness: 0.2 });
  put(sc, rbox(200, 300, 18, 6, trim), 0, 640, BZ + 4);
  put(sc, plane(170, 270, glassM), 0, 640, BZ + 14);
  const arch = put(sc, new T.Mesh(new T.CircleGeometry(100, 40, 0, Math.PI), trim), 0, 790, BZ + 5); arch.scale.y = 0.8;
  put(sc, new T.Mesh(new T.CircleGeometry(85, 40, 0, Math.PI), glassM), 0, 790, BZ + 14).scale.y = 0.8;
  for (const x of [-30, 30]) put(sc, rbox(8, 270, 6, 2, trim), x, 640, BZ + 18);
  put(sc, rbox(170, 8, 6, 2, trim), 0, 690, BZ + 18);
  const rayM = new T.MeshBasicMaterial({ map: canvasTex(64, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,248,220,0.16)'); gr.addColorStop(1, 'rgba(255,248,220,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }), transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
  for (const [x, r] of [[-40, 0.12], [40, -0.12], [0, 0]]) { const ray = put(sc, plane(120, 900, rayM), x, 340, BZ + 330); ray.rotation.x = -0.9; ray.rotation.z = r; }
  // niches: an arched recess with a shelf; pilasters in the corners
  const recessM = mat('#7d9cd0', { roughness: 0.8 });
  for (const sx of [-205, 205]) {
    const sh = new T.Shape(); sh.moveTo(-95, 0); sh.lineTo(95, 0); sh.lineTo(95, 230); sh.absarc(0, 230, 95, 0, Math.PI, false); sh.lineTo(-95, 0);
    const rec = shade(new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: false, curveSegments: 24 }), recessM), false); put(sc, rec, sx, 290, BZ + 1);
    const ring = new T.Shape(); ring.absarc(0, 0, 108, 0, Math.PI, false); const ih = new T.Path(); ih.absarc(0, 0, 95, Math.PI, 0, true); ring.holes.push(ih);
    put(sc, shade(new T.Mesh(new T.ExtrudeGeometry(ring, { depth: 10, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, curveSegments: 24 }), trim)), sx, 520, BZ + 2);
    put(sc, rbox(220, 24, 120, 8, trim), sx, 288, BZ + 55);
    put(sc, rbox(150, 26, 16, 6, mat('#e6c36a', { roughness: 0.3, metalness: 0.6 })), sx, 250, BZ + 116);
  }
  for (const sx of [-1, 1]) { put(sc, cyl(26, 30, 1000, trim, 32), sx * (RW - 34), 500, BZ + 34); }
  // the glass case
  const wood = mat('#b97b49', { roughness: 0.45 });
  put(sc, rbox(200, 200, 150, 10, wood), 0, 100, -250);
  for (const y of [55, 140]) put(sc, rbox(150, 60, 6, 6, mat('#a46a3c', { roughness: 0.5 })), 0, y, -175);
  const glass = new T.MeshPhysicalMaterial({ color: '#e8f6ff', roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false, clearcoat: 1 });
  const gb = put(sc, new T.Mesh(new T.BoxGeometry(190, 220, 140), glass), 0, 310, -250); gb.renderOrder = 4;
  const gold = mat('#e2b54a', { roughness: 0.25, metalness: 0.7 });
  for (const [x, z] of [[-95, -320], [95, -320], [-95, -180], [95, -180]]) put(sc, cyl(3.5, 3.5, 220, gold, 8), x, 310, z);
  for (const z of [-320, -180]) put(sc, rbox(196, 8, 8, 3, gold), 0, 422, z);
  for (const x of [-95, 95]) put(sc, rbox(8, 8, 146, 3, gold), x, 422, -250);
  // the chandelier
  const ch = new T.Group(); put(sc, ch, 0, 900, -40);
  put(ch, cyl(2, 2, 160, gold, 6), 0, 80, 0);
  const tor = put(ch, shade(new T.Mesh(new T.TorusGeometry(90, 6, 12, 48), gold)), 0, 0, 0); tor.rotation.x = Math.PI / 2;
  const bulbM = new T.MeshStandardMaterial({ color: '#fff3c8', emissive: '#ffd27a', emissiveIntensity: 0.3 });
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; put(ch, cyl(5, 5, 26, trim, 8), Math.cos(a) * 90, 14, Math.sin(a) * 90); put(ch, sph(9, bulbM), Math.cos(a) * 90, 34, Math.sin(a) * 90); }
  H3.glow = [bulbM];
  // what comes as the museum fills: rope barriers, plants, banners
  const dec = [];
  const rope = new T.Group(); for (const x of [-120, 120]) { put(rope, cyl(5, 5, 90, gold, 12), x, 45, 0); put(rope, sph(9, gold), x, 94, 0); put(rope, cyl(22, 24, 8, gold, 24), x, 4, 0); }
  const curve = new T.CatmullRomCurve3([new V3(-120, 86, 0), new V3(0, 58, 0), new V3(120, 86, 0)]);
  put(rope, shade(new T.Mesh(new T.TubeGeometry(curve, 24, 5, 8), mat('#c23a4e', { roughness: 0.6 }))), 0, 0, 0);
  dec.push([1, put(sc, rope, 0, 0, 470)]);
  dec.push([2, put(sc, plant(1.7), -280, 0, 330)], [2, put(sc, plant(1.7), 280, 0, 330)]);
  for (const s of [-1, 1]) { const ban = new T.Group(); put(ban, plane(90, 220, mat('#c23a4e', { roughness: 0.7, side: T.DoubleSide })), 0, 0, 0); put(ban, rbox(110, 10, 10, 4, gold), 0, 112, 0); put(ban, sph(12, gold), 0, -20, 4); const b = put(sc, ban, s * (RW - 4), 520, -80); b.rotation.y = -s * Math.PI / 2; dec.push([4, b]); }
  dec.push([6, put(sc, plant(1.3, '#3f8a46'), -300, 300, BZ + 60)]);
  H3.decor = dec;
  H3.visitorLanes = [[460, 0.95], [540, 1]];
  return { hemi: 1.0, keyI: 2.2, keyPos: new V3(-450, 1300, 900), shadowExtent: 900, env: 0.55, bg: '#2b2340' };
}
function buildKitchen(sc, H3) {
  const RW = 350, BZ = -440;
  const plank = canvasTex(256, 256, (g, w, h) => { const cs = ['#c98c58', '#bf8250', '#d39762', '#b97c4a']; for (let k = 0; k < 8; k++) { g.fillStyle = cs[k % 4]; g.fillRect(k * 32, 0, 32, h); g.fillStyle = 'rgba(60,30,10,0.25)'; g.fillRect(k * 32, 0, 2, h); g.fillRect(k * 32, (k * 97) % h, 32, 2); } }, [3, 5]);
  put(sc, floorPlane(RW * 2, 1300, new T.MeshStandardMaterial({ map: plank, roughness: 0.55 })), 0, 0, BZ + 650);
  const tiles = wallTex('#fbf6ec', (g, w, h) => { g.strokeStyle = '#ded4c2'; g.lineWidth = 3; for (let r = 0; r < 8; r++) for (let c = -1; c < 4; c++) g.strokeRect(c * 64 + (r % 2) * 32, r * 32, 64, 32); }, [4, 6]);
  put(sc, plane(RW * 2, 1000, new T.MeshStandardMaterial({ map: tiles, roughness: 0.4 })), 0, 500, BZ);
  const sageM = mat('#a9cfa5', { roughness: 0.85 });
  for (const s of [-1, 1]) { const p = put(sc, plane(1300, 1000, sageM), s * RW, 500, BZ + 650); p.rotation.y = -s * Math.PI / 2; }
  const mint = mat('#8fcdb6', { roughness: 0.4 }), mintD = mat('#7bbca4', { roughness: 0.45 }), brass = mat('#e2b54a', { roughness: 0.25, metalness: 0.7 });
  // back counter, cupboards, window with gingham curtains
  put(sc, rbox(RW * 2, 212, 150, 8, mint), 0, 106, -360);
  for (let k = 0; k < 4; k++) { const x = -255 + k * 170; put(sc, rbox(150, 170, 8, 8, mintD), x, 104, -283); put(sc, cyl(4, 4, 30, brass, 8), x + 55, 150, -276); }
  put(sc, rbox(RW * 2 + 10, 22, 170, 6, mat('#dca36d', { roughness: 0.4 })), 0, 221, -355);
  for (const s of [-1, 1]) { put(sc, rbox(210, 230, 110, 8, mint), s * 240, 640, -385); put(sc, rbox(170, 190, 8, 8, mintD), s * 240, 640, -328); put(sc, cyl(4, 4, 30, brass, 8), s * 240 - s * 60, 580, -322); }
  const trim = mat('#ffffff', { roughness: 0.4 });
  put(sc, rbox(230, 270, 20, 6, trim), 0, 600, BZ + 6);
  put(sc, plane(200, 240, new T.MeshStandardMaterial({ color: '#cfeaff', emissive: '#bfe3ff', emissiveIntensity: 0.85, map: canvasTex(128, 160, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fcaf2'); gr.addColorStop(1, '#e6f6ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#6fb86a'; g.beginPath(); g.ellipse(40, h, 60, 40, 0, 0, 7); g.ellipse(110, h, 50, 34, 0, 0, 7); g.fill(); }) })), 0, 600, BZ + 17);
  put(sc, rbox(8, 240, 6, 2, trim), 0, 600, BZ + 20); put(sc, rbox(200, 8, 6, 2, trim), 0, 620, BZ + 20);
  put(sc, rbox(250, 16, 50, 4, trim), 0, 462, BZ + 25);
  const ging = new T.MeshStandardMaterial({ roughness: 0.8, side: T.DoubleSide, map: canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(214,72,80,0.45)'; for (let k = 0; k < 4; k++) { g.fillRect(k * 16, 0, 8, h); g.fillRect(0, k * 16, w, 8); } }, [3, 4]) });
  for (const s of [-1, 1]) { const c = put(sc, plane(70, 260, ging), s * 120, 610, BZ + 40); c.rotation.y = s * 0.15; }
  put(sc, rbox(280, 10, 10, 4, brass), 0, 745, BZ + 40);
  // the island and its pendant lamps
  put(sc, rbox(560, 200, 210, 10, mint), 0, 100, 60);
  for (let k = 0; k < 3; k++) put(sc, rbox(160, 160, 8, 8, mintD), -180 + k * 180, 100, 166);
  put(sc, rbox(600, 22, 250, 8, mat('#f6efe4', { roughness: 0.25 })), 0, 211, 60);
  const shadeM = mat('#3f6f5c', { roughness: 0.35, side: T.DoubleSide }), bulbM = new T.MeshStandardMaterial({ color: '#fff3c8', emissive: '#ffd27a', emissiveIntensity: 0.6 });
  for (const x of [-160, 160]) { put(sc, cyl(1.5, 1.5, 300, mat('#333333'), 6), x, 830, 40); put(sc, cyl(18, 62, 54, shadeM, 32), x, 660, 40).geometry = new T.CylinderGeometry(18, 62, 54, 32, 1, true); put(sc, sph(16, bulbM), x, 640, 40); }
  H3.glow = [bulbM];
  // what comes as the kitchen fills: copper pans, a fruit bowl, herbs on the sill, a clock
  const dec = [];
  const pans = new T.Group(); put(pans, rbox(8, 8, 260, 3, brass), 0, 120, 0);
  for (let k = 0; k < 3; k++) { put(pans, cyl(4, 4, 70 + k * 10, brass, 6), 0, 85 - k * 5, -90 + k * 90); const pan = put(pans, cyl(42 - k * 6, 36 - k * 6, 14, mat('#c8703e', { roughness: 0.3, metalness: 0.6 })), 6, 40 - k * 10, -90 + k * 90); pan.rotation.z = Math.PI / 2; }
  dec.push([1, put(sc, pans, RW - 8, 460, -120)]);
  const bowl = new T.Group(); put(bowl, cyl(50, 30, 30, mat('#f4f1ea', { roughness: 0.3 })), 0, 15, 0);
  for (const [x, z, c] of [[-18, 0, '#e0574f'], [16, -6, '#f2a93b'], [0, 14, '#e0574f'], [4, -2, '#8fc44f']]) put(bowl, sph(17, mat(c, { roughness: 0.4 })), x, 36, z);
  dec.push([3, put(sc, bowl, -305, 232, -350)]);
  for (const x of [-80, 0, 80]) dec.push([2, put(sc, plant(0.75), x, 470, BZ + 30)]);
  const clock = new T.Group(); put(clock, cyl(46, 46, 10, mat('#e0574f', { roughness: 0.4 }), 32), 0, 0, 0).rotation.x = Math.PI / 2; put(clock, cyl(38, 38, 12, trim, 32), 0, 0, 1).rotation.x = Math.PI / 2;
  put(clock, rbox(4, 30, 4, 1, mat('#333333')), 0, 12, 8); put(clock, rbox(24, 4, 4, 1, mat('#333333')), 10, 0, 8);
  const cl = put(sc, clock, -RW + 8, 600, -40); cl.rotation.y = Math.PI / 2; dec.push([0, cl]);
  dec.push([5, put(sc, plant(1.6), 290, 0, 330)]);
  H3.decor = dec; H3.visitorLanes = null;
  return { hemi: 1.05, keyI: 2.1, keyPos: new V3(-450, 1300, 900), shadowExtent: 900, env: 0.55, bg: '#2b2340' };
}
function buildPark(sc, H3) {
  sc.background = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#5fa9e8'); gr.addColorStop(0.6, '#bfe3fb'); gr.addColorStop(1, '#e9f7ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const grass = canvasTex(256, 256, (g, w, h) => { for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#86c96a' : '#7cc062'; g.fillRect(0, k * 32, w, 32); } }, [8, 8]);
  put(sc, floorPlane(5000, 5000, new T.MeshStandardMaterial({ map: grass, roughness: 0.9 })), 0, 0, 0);
  const pathM = mat('#ead9b4', { roughness: 0.85 });
  put(sc, floorPlane(170, 1500, pathM), 0, 1, 250);
  put(sc, shade(new T.Mesh(new T.CircleGeometry(230, 64), pathM), false), 0, 1.2, -430).rotation.x = -Math.PI / 2;
  // the city behind, a hedge, trees
  const tower = (w, h, c) => { const t = canvasTex(64, 128, (g, cw, ch) => { g.fillStyle = c; g.fillRect(0, 0, cw, ch); g.fillStyle = 'rgba(255,255,255,0.45)'; for (let y = 6; y < ch; y += 12) for (let x = 6; x < cw; x += 14) g.fillRect(x, y, 8, 7); }); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(Math.max(1, w / 90), Math.max(1, h / 160)); return shade(new T.Mesh(new T.BoxGeometry(w, h, 120), new T.MeshStandardMaterial({ map: t, roughness: 0.6 })), false); };
  let bx = -1100; for (let k = 0; bx < 1100; k++) { const w = 140 + (k * 53) % 120, h = 380 + (k * 211) % 520; put(sc, tower(w, h, ['#b8c9e2', '#c9d5e8', '#e0cfc3', '#aebfd9'][k % 4]), bx + w / 2, h / 2, -1500 - (k % 3) * 80); bx += w + 20; }
  const hedgeM = mat('#4f9a4c', { roughness: 0.8 });
  put(sc, rbox(1600, 90, 70, 30, hedgeM), 0, 45, -760);
  const flowers = ['#f28fb0', '#ffd25a', '#ffffff', '#c8a2e0'];
  const t1 = put(sc, tree(1.5), -440, 0, -520), t2 = put(sc, tree(1.4), 440, 0, -480);
  put(sc, tree(1.6), -560, 0, 200); put(sc, tree(1.6), 560, 0, 260);
  // what comes as the park fills: flower beds, bunting, balloons, a cat on the lawn
  const dec = [];
  for (const [s, z] of [[-1, -60], [1, -60], [-1, 420], [1, 420]]) { const bed = new T.Group(); put(bed, cyl(70, 76, 18, mat('#9a6a48', { roughness: 0.8 }), 32), 0, 9, 0); for (let k = 0; k < 12; k++) { const a = k * 2.4; put(bed, sph(11, mat(flowers[k % 4], { roughness: 0.5 })), Math.cos(a) * 46 * ((k % 3 + 1) / 3), 24, Math.sin(a) * 46 * ((k % 3 + 1) / 3)); } dec.push([z < 0 ? 1 : 3, put(sc, bed, s * 330, 0, z)]); }
  const bunt = new T.Group(), pts = []; for (let k = 0; k <= 16; k++) { const u = k / 16; pts.push(new V3(-440 + 880 * u, 470 - Math.sin(u * Math.PI) * 90, -500)); }
  put(bunt, shade(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 2, 6), mat('#ffffff')), false), 0, 0, 0);
  for (let k = 1; k < 16; k++) { const f = shade(new T.Mesh(new T.ConeGeometry(18, 40, 3), mat(['#e0574f', '#ffd25a', '#5f9fd6', '#9cc7a0'][k % 4], { roughness: 0.6 })), false); f.position.copy(pts[k]).add(new V3(0, -22, 0)); f.rotation.z = Math.PI; bunt.add(f); }
  dec.push([3, put(sc, bunt, 0, 0, 0)]);
  const balloons = new T.Group(); for (let k = 0; k < 3; k++) { put(balloons, sph(26, mat(['#e0574f', '#ffd25a', '#5f9fd6'][k], { roughness: 0.25 })), (k - 1) * 30, 260 + k * 18, 0).scale.y = 1.2; put(balloons, cyl(1, 1, 200, mat('#ffffff'), 4), (k - 1) * 15, 150, 0); }
  dec.push([5, put(sc, balloons, 110, 0, 330)]);
  H3.decor = dec; H3.trees = [t1, t2];
  H3.visitorLanes = [[470, 1], [560, 1]];
  return { hemi: 1.15, sky: '#d8efff', ground: '#86c96a', key: '#fff3d6', keyI: 2.5, keyPos: new V3(-600, 1300, 700), shadowExtent: 1000, env: 0.5 };
}
function standFor(sc, sp, area) {
  const trim = mat('#f6f0e4', { roughness: 0.35 }), gold = mat('#e2b54a', { roughness: 0.25, metalness: 0.7 });
  if (sp.stand === 'plinth') {
    const g = new T.Group(); put(sc, g, sp.x, 0, sp.z);
    put(g, cyl(78, 84, 16, trim, 48), 0, 8, 0); put(g, cyl(62, 62, sp.y - 30, mat('#efe6d6', { roughness: 0.4 }), 48), 0, (sp.y - 30) / 2 + 16, 0);
    put(g, cyl(76, 72, 16, trim, 48), 0, sp.y - 8, 0); put(g, rbox(70, 18, 6, 4, gold), 0, sp.y * 0.55, 62);
  } else if (sp.stand === 'pad') {
    put(sc, shade(new T.Mesh(new T.CylinderGeometry(sp.s * 0.42, sp.s * 0.44, 6, 48), mat('#e1cfa8', { roughness: 0.85 })), false), sp.x, 3, sp.z);
  }
}
function hubScene(a) {
  if (HUBS[a]) return HUBS[a];
  const key = AREAS[a].key, sc = new T.Scene(), H3 = { sc, key, objs: [], people: [] };
  const look = { museum: buildMuseum, kitchen: buildKitchen, park: buildPark }[key](sc, H3);
  if (!sc.background) sc.background = new T.Color(look.bg || '#2b2340');
  H3.L = lights(sc, look);
  const C = HUB_CAM[key], cam = new T.PerspectiveCamera(C.fov, W / H, 10, 8000); H3.cam = cam; H3.C = C;
  HUB_SPOTS[key].forEach(sp => standFor(sc, sp, a));
  areaObjects(a).forEach((i, k) => {
    const sp = HUB_SPOTS[key][k], kk = sp.s / ART_N, m = objectModel(i), g = new T.Group(); g.add(m); m.scale.setScalar(kk);
    put(sc, g, sp.x, sp.y, sp.z); g.userData = { i, mesh: m, h: m.userData.h * kk, w: m.userData.w * kk };
    H3.objs.push(g);
  });
  return (HUBS[a] = H3);
}
// view: { done, lit, t, pop, visitors, sel } — what the hub shows. Returns where each object is on the screen.
function renderHub(a, view, dt) {
  const H3 = hubScene(a), cam = H3.cam, C = H3.C, t = view.t;
  const intro = view.since === undefined ? 1 : easeOutCubic(view.since / 1.1);
  cam.position.set(C.pos[0] + Math.sin(t * 0.25) * 22, C.pos[1] + Math.sin(t * 0.18) * 8 + (1 - intro) * 160, C.pos[2] + (1 - intro) * 380);
  cam.lookAt(C.look[0], C.look[1], C.look[2]); cam.updateMatrixWorld(true);
  const n = H3.objs.filter(g => view.done[g.userData.i]).length, lit = view.lit || 0;
  H3.L.hemi.intensity = H3.L.base.hemi * (1 + 0.25 * lit); H3.L.key.intensity = H3.L.base.key * (1 + 0.15 * lit);
  if (H3.glow) for (const m of H3.glow) m.emissiveIntensity = 0.3 + 2.2 * lit;
  const jump = H3.lastT === undefined || Math.abs(t - H3.lastT) > 0.5; H3.lastT = t; // a fresh visit: no growing in
  for (const [need, m] of H3.decor) { // decorations grow in once enough objects are home
    const on = n >= need && need > 0 || need === 0, s = m.userData.s === undefined || view.since < 0.1 || jump ? (m.userData.s = on ? 1 : 0) : m.userData.s;
    m.userData.s = s + ((on ? 1 : 0) - s) * damp(6, dt); const e = on ? easeOutBack(m.userData.s) : m.userData.s;
    m.scale.setScalar(Math.max(1e-4, e)); m.visible = m.userData.s > 0.01;
  }
  if (H3.trees) H3.trees.forEach((tr, k) => { tr.rotation.z = Math.sin(t * 0.9 + k) * 0.015; });
  const marks = {};
  for (const g of H3.objs) {
    const i = g.userData.i, done = view.done[i], m = g.userData.mesh;
    setSil(m, !done);
    let s = 1, spin = 0, hop = 0;
    if (view.pop && view.pop.i === i) { const u = (t - view.pop.t) / 1.0; if (u < 1) { s = 0.2 + 0.8 * easeOutElastic(u); spin = (1 - easeOutCubic(u)) * Math.PI * 2; hop = Math.sin(Math.min(1, u * 1.6) * Math.PI) * 60; } }
    if (!done && view.next === i) hop = Math.abs(Math.sin(t * 3)) * 10;
    g.scale.setScalar(s); g.rotation.y = spin; g.position.y = HUB_SPOTS[H3.key][H3.objs.indexOf(g)].y + hop;
    g.updateMatrixWorld(true);
    const top = toScreen(cam, new V3(g.position.x, g.position.y + g.userData.h + 14, g.position.z)), base = toScreen(cam, new V3(g.position.x, g.position.y, g.position.z + 30));
    const mid = toScreen(cam, new V3(g.position.x, g.position.y + g.userData.h * 0.5, g.position.z));
    const half = Math.abs(toScreen(cam, new V3(g.position.x + g.userData.w / 2, g.position.y, g.position.z)).x - base.x);
    marks[i] = { top, base, mid, x0: base.x - Math.max(50, half), x1: base.x + Math.max(50, half), y0: top.y, y1: base.y + 10 };
  }
  // visitors walk through once the scene is finished
  const lanes = H3.visitorLanes, vs = lanes && lit > 0 ? view.visitors : [];
  while (H3.people.length < vs.length) { const v = vs[H3.people.length], p = person(v.shirt, v.hair, v.kid); H3.people.push(p); sc_add(H3.sc, p); }
  H3.people.forEach((p, k) => {
    const v = vs[k]; p.visible = !!v; if (!v) return;
    const [z] = lanes[v.lane % lanes.length]; p.position.set((v.x - 360) * 1.2, Math.abs(Math.sin(t * 6 + k)) * 4, z); p.rotation.y = Math.PI / 2;
    const sw = Math.sin(t * 6 + k) * 0.5; p.userData.legs[0].rotation.x = sw; p.userData.legs[1].rotation.x = -sw;
  });
  R.render(H3.sc, cam);
  return marks;
}
function sc_add(sc, o) { sc.add(o); return o; }
// The hub object under a screen point, front first, or -1.
function hubPick(a, x, y) {
  const H3 = HUBS[a]; if (!H3) return -1;
  const hits = rayAt(H3.cam, x, y).intersectObjects(H3.objs, true); if (!hits.length) return -1;
  let o = hits[0].object; while (o && o.userData.i === undefined) o = o.parent; return o ? o.userData.i : -1;
}

// ---- Every object side by side, for the figures check ------------------------------------------------
let FIG = null;
function renderFigures(t) {
  if (!FIG) {
    const sc = new T.Scene(); sc.background = new T.Color('#efe3cf');
    lights(sc, { keyPos: new V3(-400, 800, 1200), shadowExtent: 1400 });
    const cam = new T.PerspectiveCamera(30, W / H, 10, 8000); cam.position.set(0, 0, 3000); cam.lookAt(0, 0, 0);
    const objs = OBJECTS.map((o, i) => { const m = objectModel(i), k = 200 / ART_N; m.scale.setScalar(k); m.position.y = -m.userData.h * k / 2; const g = new T.Group(); g.add(m); sc.add(g); g.userData = { i, k }; return g; });
    FIG = { sc, cam, objs };
  }
  const labels = [];
  FIG.objs.forEach((g, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = (col - 1) * 300, y = 600 - row * 250;
    g.position.set(x, y, 0); g.rotation.y = t * 0.8 + i; g.updateMatrixWorld(true);
    labels.push({ i, ...toScreen(FIG.cam, new V3(x, y - 110, 0)) });
  });
  FIG.cam.updateMatrixWorld(true);
  R.render(FIG.sc, FIG.cam);
  return labels;
}

return { init, resize, renderPuzzle, renderHub, renderFigures, hubPick, screenToBoard, boardToScreen, pieceScreen, get ghostAt() { return PZ && PZ.ghostAt; } };
})();
