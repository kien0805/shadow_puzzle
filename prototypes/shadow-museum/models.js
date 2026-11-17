// PROTOTYPE - NOT FOR PRODUCTION
// Question: Kéo từng bộ phận của vật thể vào bóng đen cho nó hiện ra có đủ vui để làm hết 6 vật không?
// Date: 2026-11-17
// The 18 objects as real 3D models, built from three.js shapes: turned profiles (vases, pots, domes),
// tubes (handles, plumes, frames), spheres, cylinders and rounded boxes, each with its own material,
// in the colours of its 2D picture. Each builder makes the object about 100 units tall, standing on
// y = 0, facing +z; world.js scales it to the picture's size. Keyed by OBJECTS[i].art.
'use strict';
const MODELS = (() => {
const T = THREE, V2 = T.Vector2, V3 = T.Vector3, PI = Math.PI;
// ---- Kit ----------------------------------------------------------------------------------------
const std = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.45 }, o));
const metal = (color, r = 0.28) => std(color, { metalness: 0.85, roughness: r });
const glass = (color, op = 0.35) => new T.MeshPhysicalMaterial({ color, roughness: 0.05, transparent: true, opacity: op, clearcoat: 1, depthWrite: false });
const glow = (color, i = 1.2) => std(color, { emissive: color, emissiveIntensity: i });
function tex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
}
const M = (geo, m, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) => { const o = new T.Mesh(geo, m); o.position.set(...p); o.rotation.set(...r); o.scale.set(...s); return o; };
const G = (...kids) => { const g = new T.Group(); kids.flat().forEach(k => k && g.add(k)); return g; };
// a profile [[radius, height], ...] turned round the y axis; smooth: run a spline through the points first
function turn(pts, m, smooth = true, seg = 56) {
  let v = pts.map(([r, y]) => new V2(Math.max(0.01, r), y));
  if (smooth && v.length > 2) v = new T.SplineCurve(v).getPoints(Math.max(24, v.length * 8));
  return new T.Mesh(new T.LatheGeometry(v, seg), m);
}
const cyl = (rt, rb, h, m, seg = 40, open = false) => new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg, 1, open), m);
const ball = (r, m, ws = 32, hs = 20) => new T.Mesh(new T.SphereGeometry(r, ws, hs), m);
const tube = (pts, r, m, closed = false, seg = 64) => new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new V3(...p)), closed), seg, r, 12, closed), m);
const ring = (R, r, m, arc = PI * 2, seg = 64) => new T.Mesh(new T.TorusGeometry(R, r, 14, seg, arc), m);
const cone = (r, h, m, seg = 24) => new T.Mesh(new T.ConeGeometry(r, h, seg), m);
function rshape(w, h, r) { const s = new T.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
// a box with soft edges, centred: w across, h up, d deep
function box(w, h, d, m, r = 2) {
  const b = Math.max(0.2, Math.min(r, d / 2 - 0.1, w / 2 - 0.1, h / 2 - 0.1));
  const geo = new T.ExtrudeGeometry(rshape(w - 2 * b, h - 2 * b, Math.max(0.2, r - b)), { depth: Math.max(0.1, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 6 });
  geo.translate(0, 0, -(d - 2 * b) / 2); return new T.Mesh(geo, m);
}
const at = (o, x, y, z, rx = 0, ry = 0, rz = 0, s) => { o.position.set(x, y, z); o.rotation.set(rx, ry, rz); if (s !== undefined) (Array.isArray(s) ? o.scale.set(...s) : o.scale.setScalar(s)); return o; };
const around = (n, f) => Array.from({ length: n }, (_, k) => f(k / n * PI * 2, k));
// ---- Textures -------------------------------------------------------------------------------------
const meander = tex(512, 256, (g, w, h) => { // terracotta with a black band of running figures and key pattern
  g.fillStyle = '#d97a45'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b2220'; g.fillRect(0, h * 0.42, w, h * 0.22);
  g.strokeStyle = '#d97a45'; g.lineWidth = 4; g.lineCap = 'round';
  for (let x = 0; x < w; x += 28) { g.beginPath(); g.moveTo(x, h * 0.36); g.lineTo(x + 14, h * 0.36); g.lineTo(x + 14, h * 0.32); g.lineTo(x + 4, h * 0.32); g.lineTo(x + 4, h * 0.34); g.stroke(); }
  for (let x = 20; x < w; x += 64) { const y = h * 0.54; g.beginPath(); g.arc(x, y - 12, 4, 0, 7); g.moveTo(x, y - 8); g.lineTo(x, y + 3); g.lineTo(x - 6, y + 12); g.moveTo(x, y + 3); g.lineTo(x + 6, y + 12); g.moveTo(x - 7, y - 4); g.lineTo(x + 7, y - 1); g.stroke(); }
  g.fillStyle = '#2b2220'; g.fillRect(0, h * 0.18, w, 6); g.fillRect(0, h * 0.82, w, 6);
});
const earth = tex(512, 256, (g, w, h) => {
  g.fillStyle = '#4c9ad6'; g.fillRect(0, 0, w, h); g.fillStyle = '#a8cf7e';
  for (const [x, y, rx, ry] of [[90, 90, 60, 45], [130, 170, 35, 50], [270, 80, 70, 40], [300, 160, 40, 45], [420, 120, 55, 40], [470, 200, 30, 20], [200, 40, 30, 15]]) { g.beginPath(); g.ellipse(x, y, rx, ry, 0.3, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; for (let x = 0; x < w; x += 42) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 32; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
});
const flowers = tex(512, 256, (g, w, h) => { g.fillStyle = '#5b9ad0'; g.fillRect(0, 0, w, h); for (let k = 0; k < 40; k++) { const x = (k * 97) % w, y = 40 + (k * 61) % (h - 80); g.fillStyle = '#ffffff'; for (let p = 0; p < 5; p++) { g.beginPath(); g.arc(x + Math.cos(p * 1.26) * 7, y + Math.sin(p * 1.26) * 7, 5, 0, 7); g.fill(); } g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); } });
const gingham = (c, n = 8) => tex(128, 128, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = c; g.globalAlpha = 0.45; for (let k = 0; k < n; k++) { g.fillRect(k * w / n, 0, w / n / 2, h); g.fillRect(0, k * h / n, w, h / n / 2); } }, [2, 2]);
const wicker = tex(128, 128, (g, w, h) => { g.fillStyle = '#c48a4a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 16) for (let x = 0; x < w; x += 16) { g.fillStyle = (x + y) % 32 ? '#d9a566' : '#b07838'; g.fillRect(x + 1, y + 2, 14, 12); } }, [3, 2]);
const label = tex(512, 128, (g, w, h) => { g.fillStyle = '#fbf4e8'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(169,59,49,0.45)'; for (let k = 0; k < 32; k++) { g.fillRect(k * 16, 0, 8, h); } for (let k = 0; k < 8; k++) g.fillRect(0, k * 16, w, 8); g.fillStyle = '#fbf4e8'; g.fillRect(80, 34, 150, 60); g.fillRect(330, 34, 150, 60); g.fillStyle = '#a93b31'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('COOKIES', 155, 76); g.fillText('COOKIES', 405, 76); });
const stripes = (a, b, n = 12) => tex(256, 64, (g, w, h) => { for (let k = 0; k < n; k++) { g.fillStyle = k % 2 ? a : b; g.fillRect(k * w / n, 0, w / n, h); } });
const marble = std('#ece6db', { roughness: 0.35 }), gold = metal('#e2b54a', 0.25), steel = metal('#cfd6dd', 0.22), dark = std('#2a2a30', { roughness: 0.4 });

// ---- The objects --------------------------------------------------------------------------------
const B = {};
B.bust = () => {
  const hair = std('#d8d0c3', { roughness: 0.5 }), leaf = std('#a8c97e', { roughness: 0.5 }), line = std('#a99d8c', { roughness: 0.5 });
  const curls = around(16, (a, k) => at(ball(5 + (k % 3), hair), Math.cos(a) * 14, 80 + Math.max(0, -Math.sin(a)) * 2 + (k % 2) * 3, Math.sin(a) * 13 - 3));
  const laurel = around(14, a => at(ball(3.2, leaf), Math.cos(a) * 16.5, 79, Math.sin(a) * 15.5, 0, -a, 0.5, [1.8, 0.6, 0.9]));
  return G(
    at(box(50, 9, 34, marble, 2), 0, 4.5, 0), at(cyl(15, 18, 7, marble), 0, 12.5, 0),
    at(M(new T.SphereGeometry(30, 48, 24, 0, PI * 2, 0, PI * 0.5), marble), 0, 15, 0, 0, 0, 0, [1.3, 0.95, 0.62]), // shoulders and chest
    tube([[-30, 22, 12], [-12, 30, 17], [8, 38, 16], [22, 42, 10]], 2.2, std('#d9d0c2')), // the toga's fold
    at(cyl(8.5, 10, 16, marble), 0, 48, 0),
    at(ball(17, marble), 0, 66, 0, 0, 0, 0, [0.86, 1.1, 0.95]), // head
    at(cone(2.6, 8, marble, 12), 0, 65, 15.8, PI / 2.4), // nose
    at(ring(3, 0.7, line, PI), -6, 69, 14.6, 0, 0, PI), at(ring(3, 0.7, line, PI), 6, 69, 14.6, 0, 0, PI), // closed eyes
    at(ring(4, 0.7, line, PI), 0, 59, 15, 0, 0, PI), // a small smile
    at(ball(3.4, marble), -14.4, 66, 0), at(ball(3.4, marble), 14.4, 66, 0), // ears
    curls, laurel,
  );
};
B.amphora = () => {
  const clay = std('#d97a45', { roughness: 0.55, map: meander }), clayP = std('#c4683a', { roughness: 0.6 }), black = std('#2b2220', { roughness: 0.5 });
  const body = turn([[10, 0], [12, 3], [7, 8], [12, 14], [24, 26], [29, 42], [27, 56], [18, 68], [9, 74], [8, 84], [10, 90], [12, 92], [9, 93]], clay);
  body.material.side = T.DoubleSide;
  const handle = s => tube([[s * 9, 82, 0], [s * 18, 88, 0], [s * 26, 80, 0], [s * 22, 66, 0], [s * 16, 62, 0]], 2.4, clayP);
  return G(body, at(cyl(6, 6, 0.6, black), 0, 92.2, 0), handle(-1), handle(1), at(ring(12, 1.2, black), 0, 3, 0, PI / 2));
};
B.helmet = () => {
  const silver = metal('#c9d1d8', 0.22), navy = std('#3a4a63', { roughness: 0.4, metalness: 0.4 }), slit = std('#20262c', { roughness: 0.6 }), plume = std('#d9534f', { roughness: 0.6 });
  const dome = turn([[34, 4], [35, 14], [35, 36], [33, 50], [27, 64], [16, 74], [0, 78]], silver);
  const collar = turn([[46, 0], [44, 2], [36, 10], [34, 12]], navy, false);
  const visorPlate = at(M(new T.CylinderGeometry(35.6, 35.6, 34, 40, 1, true, -PI * 0.42, PI * 0.84), std('#9aa6b0', { metalness: 0.7, roughness: 0.3 })), 0, 30, 0);
  const slits = [44, 37].map(y => at(M(new T.CylinderGeometry(36.2, 36.2, 3.2, 40, 1, true, -PI * 0.3, PI * 0.6), slit), 0, y, 0));
  const holes = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const a = 0.2 + c * 0.12; holes.push(at(ball(1.1, slit, 8, 6), Math.sin(a) * 36, 26 - r * 5, Math.cos(a) * 36)); }
  const ridge = at(ring(34, 1.5, silver, PI), 0, 40, 0, 0, PI / 2, 0, [1, 1.12, 1]);
  const rivets = around(14, a => at(ball(1.6, steel, 10, 8), Math.cos(a) * 35.4, 8, Math.sin(a) * 35.4));
  const pts = [[0, 78, 0], [6, 96, -2], [22, 106, -8], [38, 98, -14], [46, 80, -18], [44, 64, -16]];
  const feather = [0, 1, 2].map(k => tube(pts.map(([x, y, z]) => [x + k * 2.4 - 2.4, y + k * 1.5, z + k * 2 - 2]), 3.2 - k * 0.5, k === 1 ? std('#e7746c', { roughness: 0.6 }) : plume));
  return G(dome, collar, visorPlate, slits, holes, ridge, rivets, at(cyl(0.8, 0.8, 10, steel), 0, 82, 0), feather);
};
B.globe = () => {
  const wood = std('#b0703f', { roughness: 0.5 });
  const sphere = at(M(new T.SphereGeometry(30, 48, 32), std('#ffffff', { map: earth, roughness: 0.35 })), 0, 60, 0, 0, 0, -0.41);
  const meridian = at(ring(33, 1.6, gold, PI * 1.25), 0, 60, 0, 0, 0, PI * 0.5 - 0.41 + PI * 0.125);
  return G(
    turn([[24, 0], [26, 2], [24, 6], [14, 9], [10, 12]], wood, false), at(cyl(2.4, 3.2, 20, gold), 0, 20, 0), at(ball(4, gold), 0, 13, 0),
    sphere, meridian, at(cyl(1.2, 1.2, 70, gold), 0, 60, 0, 0, 0, -0.41),
  );
};
B.crown = () => {
  const red = std('#c4324a', { roughness: 0.75 }), pearl = std('#ffffff', { roughness: 0.2 }), jewel = c => std(c, { roughness: 0.1, metalness: 0.2, emissive: c, emissiveIntensity: 0.15 });
  const cushion = at(box(84, 16, 64, red, 7), 0, 8, 0);
  const tassels = [[-40, -30], [40, -30], [-40, 30], [40, 30]].map(([x, z]) => at(cone(3, 9, gold, 12), x, 2, z, PI));
  const band = turn([[28, 22], [30, 22], [30, 40], [28, 40]], gold, false);
  const cap = at(M(new T.SphereGeometry(27, 32, 16, 0, PI * 2, 0, PI / 2), red), 0, 38, 0, 0, 0, 0, [1, 0.9, 1]);
  const points = around(6, a => G(at(cone(6, 22, gold, 4), Math.sin(a) * 28, 50, Math.cos(a) * 28), at(ball(3, pearl), Math.sin(a) * 28, 62, Math.cos(a) * 28)));
  const gems = around(6, (a, k) => at(ball(3.6, jewel(['#e0384f', '#2f8fd6', '#3fae5a'][k % 3])), Math.sin(a + PI / 6) * 30.6, 31, Math.cos(a + PI / 6) * 30.6, 0, 0, 0, [1, 1.2, 0.7]));
  const orb = G(at(ball(6, gold), 0, 66, 0), at(box(3, 12, 3, gold, 0.8), 0, 76, 0), at(box(9, 3, 3, gold, 0.8), 0, 77, 0));
  return G(cushion, tassels, band, cap, points, gems, orb, at(ring(29.5, 1.3, gold), 0, 23, 0, PI / 2), at(ring(29.5, 1.3, gold), 0, 39.5, 0, PI / 2));
};
B.cat = () => {
  const bronze = std('#2f5f63', { roughness: 0.3, metalness: 0.35 }), plinth = std('#d9b65a', { roughness: 0.4, metalness: 0.3 }), eye = glow('#f2cf62', 0.5);
  return G(
    at(box(52, 8, 34, plinth, 2), 0, 4, 0),
    at(ball(17, bronze), 0, 30, -2, 0, 0, 0, [1, 1.45, 1.05]), // body sitting up
    at(ball(9, bronze), -6, 13, 7, 0, 0, 0, [1, 0.6, 1.4]), at(ball(9, bronze), 6, 13, 7, 0, 0, 0, [1, 0.6, 1.4]), // front paws
    at(cyl(3.2, 3.6, 22, bronze), -5, 22, 10), at(cyl(3.2, 3.6, 22, bronze), 5, 22, 10),
    at(ball(11, bronze), 0, 62, 1, 0, 0, 0, [1, 1, 0.95]), // head
    at(ball(5, bronze), 0, 58, 9, 0, 0, 0, [1, 0.8, 0.9]),
    at(cone(4.5, 16, bronze, 4), -6, 76, 0, 0, 0, 0.18), at(cone(4.5, 16, bronze, 4), 6, 76, 0, 0, 0, -0.18),
    at(ball(1.8, eye, 12, 8), -4, 64, 10), at(ball(1.8, eye, 12, 8), 4, 64, 10),
    at(ring(9, 1.8, gold), 0, 52, 1, PI / 2.2), at(ring(2, 0.7, gold), 7, 60, 9, 0, PI / 2), // collar, earring
    tube([[10, 9, -12], [18, 9, -4], [20, 10, 8], [12, 9, 14], [4, 9, 16]], 3, bronze),
  );
};
B.teapot = () => {
  const blue = std('#ffffff', { map: flowers, roughness: 0.25 }), china = std('#eef2f6', { roughness: 0.25 }), trim = std('#4f8fbf', { roughness: 0.3 });
  return G(
    turn([[34, 0], [36, 1], [36, 2.5], [20, 4], [12, 5], [0, 5]], china), at(ring(36, 1, trim), 0, 2, 0, PI / 2),
    turn([[14, 5], [24, 10], [30, 24], [27, 40], [18, 48], [16, 50]], blue),
    turn([[17, 49], [16, 54], [10, 58], [4, 60], [0, 61]], blue), at(ball(4.5, std('#f2cf62', { roughness: 0.3 })), 0, 63, 0),
    tube([[24, 22, 0], [34, 24, 0], [40, 34, 0], [46, 44, 0]], 3.4, blue),
    tube([[-22, 42, 0], [-36, 44, 0], [-40, 30, 0], [-26, 16, 0]], 2.6, trim),
  );
};
B.cookiejar = () => {
  const china = std('#fbf4e8', { roughness: 0.25 }), lid = std('#a93b31', { roughness: 0.3 }), cookie = std('#e3b778', { roughness: 0.7 }), chip = std('#5a3520', { roughness: 0.6 });
  const doily = turn([[40, 0], [42, 0.5], [40, 1], [0, 1]], std('#fff8ec', { roughness: 0.8 }), false);
  const jar = turn([[18, 1], [26, 4], [29, 16], [29, 50], [25, 60], [18, 64]], china);
  const band = at(M(new T.CylinderGeometry(29.3, 29.3, 22, 64, 1, true), std('#ffffff', { map: label, roughness: 0.4 })), 0, 32, 0);
  const top = turn([[20, 63], [22, 66], [18, 72], [8, 75], [0, 76]], lid);
  const cookies = [[-32, 8], [30, 14], [-22, 22]].map(([x, z], k) => G(at(cyl(9, 9, 3, cookie, 24), x, 2.5 + k * 3, z), ...[0, 1, 2].map(c => at(ball(1.4, chip, 8, 6), x + Math.cos(c * 2.1) * 4, 4.2 + k * 3, z + Math.sin(c * 2.1) * 4))));
  return G(doily, jar, band, top, at(ball(5, lid), 0, 79, 0), cookies);
};
B.mixer = () => {
  const mint = std('#7cc5ad', { roughness: 0.25 }), batter = std('#f6e7c8', { roughness: 0.8 });
  return G(
    at(box(60, 8, 36, mint, 3), 0, 4, 0), at(box(16, 54, 22, mint, 6), -22, 34, -4),
    at(M(new T.CapsuleGeometry(13, 40, 8, 24), mint), 2, 66, -2, 0, 0, PI / 2), at(ring(13.2, 1.4, steel), 10, 66, -2, 0, PI / 2),
    turn([[10, 8], [18, 10], [22, 22], [22, 34], [23, 35]], steel), at(cyl(19, 19, 1, batter), 6, 30, 0),
    at(cyl(1.5, 1.5, 22, steel), 6, 43, 0), at(ball(5, steel), 6, 33, 0, 0, 0, 0, [1, 1.5, 1]), at(ball(3, steel), 26, 66, -2),
  ).translateX(0);
};
B.toaster = () => {
  const red = std('#e0574f', { roughness: 0.25, metalness: 0.15 }), crust = std('#c98a4a', { roughness: 0.75 }), crumb = std('#f2d29a', { roughness: 0.85 }), slot = std('#3a1e18', { roughness: 0.6 });
  const slice = x => G(at(box(26, 34, 7, crust, 6), x, 62, 0), at(box(21, 29, 7.4, crumb, 5), x, 62.5, 0));
  return G(
    at(box(70, 52, 40, red, 16), 0, 30, 0), // the retro body, very rounded
    at(box(71, 9, 41, steel, 3), 0, 26, 0), // the chrome band
    at(box(26, 3, 9, slot, 1.5), -14, 56, 0), at(box(26, 3, 9, slot, 1.5), 14, 56, 0), // the two slots
    slice(-14), slice(14),
    at(cyl(5.5, 5.5, 2.4, std('#fbf3e6', { roughness: 0.3 }), 24), 0, 15, 20.5, PI / 2), at(box(1.2, 4, 1, std('#3a2357'), 0.4), 1.5, 16.5, 22),
    at(box(6, 3, 6, std('#2b2b31'), 1), 37, 44, 0), at(box(5, 8, 8, steel, 2), 41, 44, 0), // the lever
    [-24, 24].map(x => at(box(10, 4, 30, std('#26262c'), 1.5), x, 2, 0)),
  );
};
B.pie = () => {
  const dish = std('#f6f1ea', { roughness: 0.3 }), crust = std('#e7b26a', { roughness: 0.65 }), filling = std('#c4843f', { roughness: 0.5 });
  const lattice = []; for (let k = -2; k <= 2; k++) { lattice.push(at(box(66, 2.4, 6, crust, 1), 0, 21, k * 11, 0, 0, 0)); lattice.push(at(box(6, 2.4, 66, crust, 1), k * 11, 22, 0)); }
  return G(
    turn([[30, 0], [34, 2], [42, 14], [46, 16], [44, 17]], dish), at(cyl(38, 38, 4, filling), 0, 18, 0),
    at(M(new T.SphereGeometry(38, 40, 12, 0, PI * 2, 0, 0.4), filling), 0, 6, 0, 0, 0, 0, [1, 0.6, 1]), lattice,
    around(28, a => at(ball(3.6, crust, 10, 8), Math.cos(a) * 39, 19, Math.sin(a) * 39)),
  );
};
B.cake = () => {
  const white = std('#ffffff', { roughness: 0.3 }), pink = std('#fbd3dd', { roughness: 0.6 }), cream = std('#fff6ea', { roughness: 0.7 }), berry = std('#e0384f', { roughness: 0.3 }), leaf = std('#4fa04a');
  const berries = around(6, a => G(at(ball(5, berry), Math.cos(a) * 18, 72, Math.sin(a) * 18, 0, 0, 0, [1, 1.25, 1]), at(cone(3, 3, leaf, 6), Math.cos(a) * 18, 78, Math.sin(a) * 18)));
  return G(
    turn([[14, 0], [16, 1], [6, 4], [5, 12], [8, 14], [40, 15], [42, 17], [0, 17]], white, false),
    at(cyl(32, 32, 24, pink), 0, 30, 0), at(cyl(26, 26, 22, pink), 0, 53, 0),
    around(20, a => at(ball(3.4, cream, 10, 8), Math.cos(a) * 32, 42, Math.sin(a) * 32)), around(16, a => at(ball(3.2, cream, 10, 8), Math.cos(a) * 26, 64, Math.sin(a) * 26)),
    at(cyl(26.5, 26.5, 2, cream), 0, 64, 0), berries,
    at(cyl(1.4, 1.4, 14, std('#9ec6ff')), 0, 71, 0), at(cone(2, 5, glow('#ff9a3a', 1.5), 10), 0, 80.5, 0),
  );
};
B.bench = () => {
  const wood = std('#d0924f', { roughness: 0.6 }), iron = std('#2f3a36', { roughness: 0.35, metalness: 0.5 });
  const side = s => G(tube([[s * 52, 0, 12], [s * 52, 26, 10], [s * 52, 36, 2], [s * 52, 36, -12]], 2.4, iron), tube([[s * 52, 0, -14], [s * 52, 30, -12], [s * 52, 60, -18], [s * 52, 76, -20]], 2.4, iron),
    tube([[s * 52, 50, -14], [s * 52, 52, 0], [s * 52, 48, 10], [s * 52, 44, 12]], 2, iron));
  return G(side(-1), side(1),
    [0, 1, 2].map(k => at(box(112, 3, 7, wood, 1.2), 0, 37, 9 - k * 9)), [0, 1, 2].map(k => at(box(112, 7, 3, wood, 1.2), 0, 48 + k * 10, -15 - k * 1.5, -0.12)));
};
B.lamp = () => {
  const green = std('#2f4a3f', { roughness: 0.35, metalness: 0.4 }), lightM = glow('#fff1b0', 1.4);
  return G(
    turn([[10, 0], [11, 2], [8, 6], [5, 10], [3.5, 16]], green), at(cyl(2.2, 2.6, 120, green), 0, 74, 0),
    at(ring(4, 1.2, gold), 0, 40, 0, PI / 2), at(ring(4, 1.2, gold), 0, 120, 0, PI / 2),
    tube([[-14, 118, 0], [-8, 124, 0], [0, 122, 0], [8, 124, 0], [14, 118, 0]], 1.2, green),
    at(cyl(7, 5, 3, green), 0, 134, 0), at(cyl(7, 9, 18, glass('#fff8d0', 0.4), 6), 0, 145, 0), at(cyl(4, 4, 14, lightM, 12), 0, 145, 0),
    at(cone(11, 9, green, 6), 0, 159, 0), at(ball(2.4, gold), 0, 165, 0),
  );
};
B.picnic = () => {
  const weave = std('#ffffff', { map: wicker, roughness: 0.75 }), cloth = std('#ffffff', { map: gingham('#e0574f'), roughness: 0.85, side: T.DoubleSide }), bottle = glass('#2f5a30', 0.85);
  return G(
    at(box(100, 2, 64, std('#ffffff', { map: gingham('#e0574f'), roughness: 0.9 }), 1), 0, 1, 0),
    at(box(58, 34, 38, weave, 5), 0, 19, 0), at(box(60, 4, 40, std('#cf9a5a', { roughness: 0.6 }), 2), 0, 37, 0),
    at(ring(18, 2.2, std('#8a5a2a', { roughness: 0.6 }), PI), 0, 39, 0),
    at(M(new T.PlaneGeometry(40, 26, 8, 4), cloth), -6, 32, 20, -0.5, 0, 0.1),
    G(at(cyl(4.5, 4.5, 26, bottle), 22, 46, -6), at(cyl(2, 3, 8, bottle), 22, 62, -6), at(cyl(2.2, 2.2, 3, std('#d9a566')), 22, 67, -6)),
  );
};
B.bicycle = () => {
  const red = std('#e0574f', { roughness: 0.3, metalness: 0.3 }), tyre = std('#2f2f36', { roughness: 0.7 }), weave = std('#ffffff', { map: wicker, roughness: 0.75 });
  const wheel = x => G(at(ring(24, 2.6, tyre), x, 24, 0), at(ring(22, 0.9, steel), x, 24, 0), around(12, a => at(cyl(0.35, 0.35, 44, steel, 6), x, 24, 0, 0, 0, a)), at(cyl(2, 2, 5, steel, 12), x, 24, 0, PI / 2));
  const bar = (a, b, r = 1.8) => tube([a, b], r, red, false, 2);
  const BB = [0, 24, 0], seat = [-12, 56, 0], head = [22, 58, 0];
  return G(wheel(-40), wheel(40),
    bar([-40, 24, 0], BB), bar(BB, seat), bar(seat, [-40, 24, 0]), bar(BB, head), bar(seat, head), bar(head, [40, 24, 0]),
    at(box(14, 3, 7, std('#3a2f2a', { roughness: 0.6 }), 1.5), -14, 60, 0), tube([[22, 58, 0], [24, 66, 0], [20, 70, -8], [20, 70, 8]], 1.4, steel),
    at(cyl(10, 8, 12, weave, 16), 34, 66, 0), around(5, (a, k) => at(ball(3, std(['#f4a3b8', '#fff6c8', '#c8a2e0'][k % 3])), 34 + Math.cos(a) * 5, 74, Math.sin(a) * 5)),
    at(cyl(5, 5, 2, steel, 16), 0, 24, 0, PI / 2),
  );
};
B.fountain = () => {
  const stone = std('#d8cfbd', { roughness: 0.7 }), water = std('#7fc2ea', { roughness: 0.05, transparent: true, opacity: 0.75 }), jet = glass('#bfe6fb', 0.55);
  return G(
    turn([[56, 0], [58, 2], [58, 14], [55, 16], [52, 14], [52, 6], [0, 6]], stone, false), at(cyl(51.5, 51.5, 1, water), 0, 12, 0),
    turn([[12, 6], [9, 14], [8, 40], [11, 46]], stone, false),
    turn([[10, 46], [24, 50], [32, 58], [30, 60], [0, 56]], stone, false), at(cyl(28, 28, 1, water), 0, 58, 0),
    turn([[5, 58], [4, 72], [7, 78], [3, 82], [0, 84]], stone), at(ball(3, jet), 0, 88, 0),
    around(6, a => tube([[0, 84, 0], [Math.cos(a) * 14, 92, Math.sin(a) * 14], [Math.cos(a) * 26, 70, Math.sin(a) * 26], [Math.cos(a) * 30, 60, Math.sin(a) * 30]], 1.2, jet)),
    around(8, a => tube([[Math.cos(a) * 31, 59, Math.sin(a) * 31], [Math.cos(a) * 42, 48, Math.sin(a) * 42], [Math.cos(a) * 48, 14, Math.sin(a) * 48]], 1, jet)),
  );
};
B.cart = () => {
  const body = std('#ffffff', { map: stripes('#f4b8c6', '#fff6ea'), roughness: 0.4 }), tyre = std('#2f2f36', { roughness: 0.7 }), shade = std('#ffffff', { map: stripes('#e0574f', '#ffffff', 16), roughness: 0.5, side: T.DoubleSide });
  const cones = [-14, 0, 14].map((x, k) => G(at(cone(4, 12, std('#e3a85c', { roughness: 0.7 }), 12), x, 50, 8, PI), at(ball(5, std(['#f4a3b8', '#fff6c8', '#a8e0c0'][k], { roughness: 0.6 })), x, 58, 8)));
  return G(
    at(box(70, 34, 36, body, 4), 0, 30, 0), at(box(74, 4, 40, std('#e0574f', { roughness: 0.4 }), 2), 0, 48, 0),
    [-26, 26].map(x => G(at(ring(10, 2.4, tyre), x, 12, 19), at(cyl(1.5, 1.5, 4, steel, 8), x, 12, 19, PI / 2))), at(cyl(3, 3, 10, steel), 30, 5, -10),
    tube([[-36, 40, 0], [-50, 44, 0], [-56, 46, 0]], 1.6, steel), at(cyl(1.2, 1.2, 60, steel), 0, 80, -6),
    at(M(new T.ConeGeometry(46, 18, 16, 1, true), shade), 0, 116, -6), at(ball(2.4, std('#e0574f')), 0, 126, -6),
    cones,
  );
};
return B;
})();
