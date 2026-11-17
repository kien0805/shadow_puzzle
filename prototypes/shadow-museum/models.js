// PROTOTYPE - NOT FOR PRODUCTION
// Question: Kéo từng bộ phận của vật thể vào bóng đen cho nó hiện ra có đủ vui để làm hết 6 vật không?
// Date: 2026-11-17
// The 18 objects as real 3D models, each built to the measurements of its own 2D picture (ART in
// index.html): the kit below takes ART coordinates (x right, y down, on the 480 square), so a
// profile, a box or a tube is placed where the picture draws it, and the finished model lines up
// with the pieces it replaces. Depth (z, towards the viewer) is the only thing added.
// Keyed by OBJECTS[i].art; world.js stands each model on its base and centres it.
'use strict';
const MODELS = (() => {
const T = THREE, V2 = T.Vector2, V3 = T.Vector3, PI = Math.PI;
const AX = x => x - 240, AY = y => 480 - y; // picture coordinates to model space
// ---- Kit ----------------------------------------------------------------------------------------
const std = (color, o = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.45 }, o));
const metal = (color, r = 0.28) => std(color, { metalness: 0.85, roughness: r });
const glow = (color, i = 1.2) => std(color, { emissive: color, emissiveIntensity: i });
function tex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = T.RepeatWrapping;
  if (rep) t.repeat.set(rep[0], rep[1]);
  return t;
}
const G = (...kids) => { const g = new T.Group(); kids.flat(Infinity).forEach(k => k && g.add(k)); return g; };
const mesh = (geo, m, x, y, z = 0) => { const o = new T.Mesh(geo, m); o.position.set(AX(x), AY(y), z); return o; };
// A profile [[half-width, y], ...] turned round a vertical axis at x = cx. The texture's v runs with
// height and its middle column faces the viewer.
function turn(pts, m, o = {}) {
  let v = pts.map(([r, y]) => new V2(Math.max(0.01, r), AY(y)));
  if (v[0].y > v[v.length - 1].y) v.reverse();
  if (o.smooth !== false && v.length > 2) v = new T.SplineCurve(v).getPoints(Math.max(24, v.length * 8)).map(q => new V2(Math.max(0.01, q.x), q.y));
  const geo = new T.LatheGeometry(v, o.seg || 64), p = geo.attributes.position, uv = geo.attributes.uv; let y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < p.count; i++) { y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); }
  for (let i = 0; i < p.count; i++) uv.setXY(i, uv.getX(i) + 0.5, (p.getY(i) - y0) / Math.max(1e-6, y1 - y0));
  if (o.double) m.side = T.DoubleSide;
  const out = new T.Mesh(geo, m); out.position.x = AX(o.cx || 240); out.position.z = o.z || 0; return out;
}
const cyl = (cx, yTop, yBot, rTop, rBot, m, seg = 40, z = 0) => mesh(new T.CylinderGeometry(rTop, rBot, Math.abs(yBot - yTop), seg), m, cx, (yTop + yBot) / 2, z);
const ball = (cx, cy, r, m, s = [1, 1, 1], z = 0) => { const o = mesh(new T.SphereGeometry(r, 32, 20), m, cx, cy, z); o.scale.set(...s); return o; };
function rshape(w, h, r) { const s = new T.Shape(), x = -w / 2, y = -h / 2; r = Math.max(0.01, Math.min(r, w / 2, h / 2)); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
// The picture's rounded rectangle (x, y, w, h) made d deep, centred on z.
function box(x, y, w, h, d, m, r = 4, z = 0) {
  const b = Math.max(0.3, Math.min(r, d / 2 - 0.2, w / 2 - 0.2, h / 2 - 0.2));
  const geo = new T.ExtrudeGeometry(rshape(w - 2 * b, h - 2 * b, Math.max(0.3, r - b)), { depth: Math.max(0.1, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 8 });
  geo.translate(0, 0, -(d - 2 * b) / 2); return mesh(geo, m, x + w / 2, y + h / 2, z);
}
// A flat outline drawn with the picture's own path calls, made d deep.
function ext(draw, d, m, bev = 3, z = 0) {
  const s = new T.Shape();
  draw({ M: (x, y) => s.moveTo(AX(x), AY(y)), L: (x, y) => s.lineTo(AX(x), AY(y)), C: (a, b, c, e, f, g) => s.bezierCurveTo(AX(a), AY(b), AX(c), AY(e), AX(f), AY(g)), Q: (a, b, c, e) => s.quadraticCurveTo(AX(a), AY(b), AX(c), AY(e)) });
  const b = Math.max(0.2, Math.min(bev, d / 2 - 0.2)), geo = new T.ExtrudeGeometry(s, { depth: Math.max(0.1, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelOffset: -b, bevelSegments: 3, curveSegments: 20 });
  geo.translate(0, 0, -(d - 2 * b) / 2 + z); return new T.Mesh(geo, m);
}
const P3 = pts => pts.map(([x, y, z = 0]) => new V3(AX(x), AY(y), z));
const tube = (pts, r, m, closed = false, seg = 48) => new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(P3(pts), closed), seg, r, 12, closed), m);
function taper(pts, r0, r1, m, seg = 32) { // a tube that narrows from r0 to r1
  const curve = new T.CatmullRomCurve3(P3(pts)), geo = new T.TubeGeometry(curve, seg, r0, 16, false), p = geo.attributes.position, c = new V3();
  for (let i = 0; i <= seg; i++) { curve.getPointAt(i / seg, c); const k = (r0 + (r1 - r0) * i / seg) / r0; for (let j = 0; j <= 16; j++) { const q = i * 17 + j; p.setXYZ(q, c.x + (p.getX(q) - c.x) * k, c.y + (p.getY(q) - c.y) * k, c.z + (p.getZ(q) - c.z) * k); } }
  geo.computeVertexNormals(); return new T.Mesh(geo, m);
}
const bez = (p0, c1, c2, p1, n = 16, zf = () => 0) => Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = 1 - t, x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0], y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1]; return [x, y, zf(x, y)]; });
const quad = (p0, c, p1, n = 12, zf = () => 0) => Array.from({ length: n + 1 }, (_, k) => { const t = k / n, u = 1 - t, x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]; return [x, y, zf(x, y)]; });
const arcPts = (cx, cy, r, a0, a1, n = 12, zf = () => 0) => Array.from({ length: n + 1 }, (_, k) => { const a = a0 + (a1 - a0) * k / n, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; return [x, y, zf(x, y)]; }); // canvas angles
// A ring standing in the picture's plane; a0 and arc in canvas angles (clockwise on screen from +x).
function ring(cx, cy, R, r, m, a0 = 0, arc = PI * 2, z = 0) { const o = mesh(new T.TorusGeometry(R, r, 14, 64, arc), m, cx, cy, z); o.rotation.z = -(a0 + arc); return o; }
// A ring lying flat (round the vertical axis).
function hoop(cx, cy, R, r, m, z = 0) { const o = mesh(new T.TorusGeometry(R, r, 12, 64), m, cx, cy, z); o.rotation.x = PI / 2; return o; }
const around = (n, f, a0 = 0) => Array.from({ length: n }, (_, k) => f(a0 + k / n * PI * 2, k));
const onEllipsoid = (cx, cy, rx, ry, rz, lift = 0) => (x, y) => rz * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2)) + lift;
const gold = std('#f0c657', { metalness: 0.6, roughness: 0.3 }), steel = metal('#cfd6dd', 0.22);

// ---- Textures -------------------------------------------------------------------------------------
// The amphora's body from y = 148 to 420, wrapped once round: black band, key pattern, running figures.
const amphoraTex = () => tex(1024, 272, (g, w, h) => {
  g.fillStyle = '#d97a45'; g.fillRect(0, 0, w, h); const Y = y => y - 148, c = '#e0884f';
  g.fillStyle = '#2b2220'; g.fillRect(0, Y(248), w, 78); g.fillRect(0, Y(344), w, 8); g.fillRect(0, Y(232), w, 6);
  g.strokeStyle = c; g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); for (let x = 0; x < w; x += 28) { g.moveTo(x, Y(256)); g.lineTo(x + 14, Y(256)); g.lineTo(x + 14, Y(266)); g.lineTo(x + 5, Y(266)); } g.stroke();
  for (let k = -3; k <= 3; k++) for (const [fx, d] of [[461 + k * 205, 1], [563 + k * 205, -1]]) {
    g.fillStyle = c; g.beginPath(); g.ellipse(fx, Y(284), 9, 8, 0, 0, 7); g.fill();
    g.lineWidth = 7; g.beginPath(); g.moveTo(fx, Y(292)); g.lineTo(fx - 5 * d, Y(306)); g.stroke();
    g.lineWidth = 4.5; g.beginPath(); g.moveTo(fx - 5 * d, Y(306)); g.lineTo(fx - 18 * d, Y(320)); g.moveTo(fx - 5 * d, Y(306)); g.lineTo(fx + 10 * d, Y(318)); g.moveTo(fx, Y(296)); g.lineTo(fx + 18 * d, Y(290)); g.moveTo(fx, Y(296)); g.lineTo(fx - 15 * d, Y(300)); g.stroke();
  }
});
// The globe's own painted disc (ART.globe's sphere layer) wrapped onto a ball: the front half is the
// picture exactly, the back half its mirror.
const globeTex = () => {
  const src = document.createElement('canvas'); src.width = src.height = 480; const sg = src.getContext('2d'); ART.globe[2](sg);
  const sd = sg.getImageData(0, 0, 480, 480).data;
  return tex(1024, 512, (g, w, h) => {
    const im = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const lat = (0.5 - (y + 0.5) / h) * PI; let lon = ((x + 0.5) / w - 0.25) * PI * 2; if (lon > PI) lon -= PI * 2;
      if (lon > PI / 2) lon = PI - lon; else if (lon < -PI / 2) lon = -PI - lon;
      const sx = Math.round(240 + 126 * Math.cos(lat) * Math.sin(lon)), sy = Math.round(214 - 126 * Math.sin(lat)), s = (sy * 480 + sx) * 4, q = (y * w + x) * 4;
      im.data[q] = sd[s]; im.data[q + 1] = sd[s + 1]; im.data[q + 2] = sd[s + 2]; im.data[q + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  });
};
// The teapot's body from y = 194 to 406: a white line and a ring of daisies.
const teapotTex = () => tex(1024, 212, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#b9dcf2'); gr.addColorStop(0.5, '#8fc1e3'); gr.addColorStop(1, '#4f8fbf'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, 76 + Math.sin(x / w * PI * 8) * 4); g.stroke();
  for (let k = 0; k < 26; k++) { const x = 20 + k * w / 26, y = 110 + Math.sin(k * 1.3) * 6; g.fillStyle = '#ffffff'; for (let p = 0; p < 5; p++) { const a = p * PI * 2 / 5; g.beginPath(); g.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 7, 8, 4.5, a, 0, 7); g.fill(); } g.fillStyle = '#f2cf62'; g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); }
});
// The cookie jar from y = 190 to 428: gingham band and the COOKIES label, front and back.
const jarTex = () => tex(1024, 238, (g, w, h) => {
  g.fillStyle = '#fbf2e2'; g.fillRect(0, 0, w, h); const Y = y => y - 190;
  g.fillStyle = '#e0574f'; g.fillRect(0, Y(292), w, 68); g.fillStyle = 'rgba(255,255,255,0.4)'; for (let x = 0; x < w; x += 28) g.fillRect(x, Y(292), 14, 68); for (let y = 292; y < 360; y += 20) g.fillRect(0, Y(y), w, 10);
  for (const cx of [0, 512, 1024]) { g.fillStyle = '#fff8ec'; g.beginPath(); g.roundRect(cx - 106, Y(306), 212, 40, 12); g.fill(); g.fillStyle = '#c0392b'; g.font = '800 30px "Segoe UI", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COOKIES', cx, Y(327)); }
});
const gingham = (rep) => tex(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(224,56,79,0.55)'; g.fillRect(0, 0, w / 2, h); g.fillRect(0, 0, w, h / 2); }, rep);
const wickerTex = rep => tex(112, 76, (g, w, h) => { g.fillStyle = '#b87b3e'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let c = -1; c < 4; c++) { g.fillStyle = r % 2 ? '#d9a566' : '#cf9a5a'; g.beginPath(); g.roundRect(c * 28 + (r % 2) * 14 + 3, r * 19 + 3, 22, 13, 5); g.fill(); } }, rep);
const stripeTex = (a, b, n) => tex(64, 8, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w / 2, h); g.fillStyle = b; g.fillRect(w / 2, 0, w / 2, h); }, [n, 1]);
const ringsTex = (a, b, n) => tex(8, 64, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h / 2); g.fillStyle = b; g.fillRect(0, h / 2, w, h / 2); }, [1, n]);
const signTex = () => tex(320, 100, (g, w, h) => { g.fillStyle = '#fff6ea'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 22); g.fill(); g.strokeStyle = '#e0574f'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#e0574f'; g.font = '800 46px "Segoe UI", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ICE CREAM', w / 2, h / 2 + 2); });

// ---- The museum -------------------------------------------------------------------------------------
const B = {};
B.bust = () => {
  const marble = std('#eee8dd', { roughness: 0.38 }), hairA = std('#d9d0c2', { roughness: 0.5 }), hairB = std('#e6dfd3', { roughness: 0.5 }), leaf = std('#b6c48f', { roughness: 0.5 }), line = std('#a99d8c', { roughness: 0.6 }), fold = std('#cbbfae', { roughness: 0.5 });
  const face = onEllipsoid(240, 165, 72, 90, 76, 1), chest = onEllipsoid(240, 395, 142, 112, 78, 1);
  const shoulders = mesh(new T.SphereGeometry(1, 48, 24, 0, PI * 2, 0, PI / 2), marble, 240, 395); shoulders.scale.set(142, 112, 78);
  const curls = [];
  [[0.3, 5], [0.62, 9], [0.95, 12], [1.28, 13], [1.6, 12]].forEach(([th, n], row) => around(n, (az, k) => {
    if (th > 0.8 && Math.cos(az) > (th > 1.4 ? -0.15 : 0.35)) return; // leave the face clear
    curls.push(ball(240 + 74 * Math.sin(th) * Math.sin(az), 165 - 92 * Math.cos(th), 22 - row, (k + row) % 2 ? hairA : hairB, [1, 0.92, 1], 78 * Math.sin(th) * Math.cos(az)));
  }, row * 0.4));
  curls.push(ball(240, 78, 26, hairB, [1.3, 0.8, 1.2]));
  const laurel = around(18, (az, k) => { const th = 0.98, o = ball(240 + 97 * Math.sin(th) * Math.sin(az), 165 - 116 * Math.cos(th) + (k % 2) * 6, 1, leaf, [15, 6, 8], 101 * Math.sin(th) * Math.cos(az)); o.rotation.set(0, az + PI / 2, 0.45); return o; });
  return G(
    box(150, 405, 180, 55, 124, std('#d6cdc0', { roughness: 0.4 }), 6), box(135, 392, 210, 20, 140, std('#e2dbcf', { roughness: 0.4 }), 5),
    shoulders, cyl(240, 200, 302, 31, 43, marble), ball(240, 165, 1, marble, [72, 90, 76]),
    ball(168, 172, 1, marble, [13, 24, 13]), ball(312, 172, 1, marble, [13, 24, 13]),
    curls, laurel,
    ball(241, 172, 1, marble, [9, 24, 13], face(241, 172) - 4), // nose
    tube(quad([198, 130], [214, 122], [228, 130], 8, face), 2, line), tube(quad([252, 130], [266, 122], [282, 130], 8, face), 2, line), // brows
    tube(arcPts(214, 148, 12, 0.2, PI - 0.2, 10, face), 1.8, line), tube(arcPts(266, 148, 12, 0.2, PI - 0.2, 10, face), 1.8, line), // closed eyes
    tube(quad([224, 220], [240, 230], [256, 220], 8, face), 2, line), // a small smile
    tube(bez([130, 330], [190, 360], [250, 340], [300, 380], 16, chest), 3.2, fold), tube(bez([160, 300], [200, 330], [240, 320], [270, 350], 16, chest), 2.6, fold), // the toga's folds
  );
};
B.amphora = () => {
  const clay = std('#ffffff', { roughness: 0.5, map: amphoraTex() }), plain = std('#d97a45', { roughness: 0.5 }), dark = std('#a24f28', { roughness: 0.55 }), foot = std('#9b4a25', { roughness: 0.55 });
  const handle = s => tube(bez([240 + s * 28, 100], [240 + s * 92, 92], [240 + s * 114, 150], [240 + s * 74, 205], 20), 9, dark);
  return G(
    turn([[58, 455], [35, 418]], foot, { smooth: false }), cyl(240, 455, 459, 58, 58, foot),
    turn([[26, 420], [40, 410], [62, 392], [90, 360], [104, 345], [120, 310], [128, 270], [124, 245], [105, 205], [70, 170], [35, 148]], clay),
    cyl(240, 86, 152, 35, 35, plain), turn([[35, 100], [42, 92], [54, 86], [54, 80], [42, 78]], plain, { double: true }),
    cyl(240, 81, 83, 41, 41, std('#3a2018')),
    handle(-1), handle(1),
  );
};
B.helmet = () => {
  const silver = metal('#c2cad2', 0.24), visorM = metal('#8f9aa4', 0.34), dark = std('#20262c', { roughness: 0.6 }), ridgeM = metal('#eef2f5', 0.2);
  const prof = [[0, 187], [30, 190], [60, 202], [82, 225], [94, 255], [99, 290], [100, 330], [96, 365], [90, 395], [88, 402]];
  const part = (y0, y1, r, a, m) => mesh(new T.CylinderGeometry(r, r, y1 - y0, 48, 1, true, -a, a * 2), m, 240, (y0 + y1) / 2);
  const holes = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = 268 + c * 14, y = 322 + r * 14, a = Math.asin((x - 240) / 102); holes.push(ball(x, y, 3.6, dark, [1, 1, 0.5], Math.cos(a) * 102.5)); }
  const ridge = [[240, 108, 0]].concat(prof.map(([r, y]) => [240, y, r + 1]));
  const plume = [0, 1, 2, 3, 4].map(k => tube(bez([240, 92], [300 + k * 8, 30 - k * 4], [380 + k * 6, 60 + k * 10], [400 - k * 6, 150 + k * 18], 20).map(([x, y]) => [x, y, (k - 2) * 5]), (22 - k * 2) / 2, std(['#d9534f', '#e7746c', '#c64440', '#f08c80', '#b83a37'][k], { roughness: 0.65 })));
  visorM.side = T.DoubleSide; dark.side = T.DoubleSide;
  return G(
    turn([[122, 446], [88, 385]], silver, { smooth: false }), cyl(240, 446, 450, 122, 122, silver, 64),
    turn(prof, silver),
    part(250, 386, 101.5, 1.25, visorM), hoop(240, 243, 99, 2.2, std('#4b5660', { metalness: 0.6, roughness: 0.4 })),
    part(266, 278, 102.6, 0.82, dark), part(292, 304, 102.6, 0.82, dark), holes,
    tube(ridge, 3, ridgeM),
    around(18, a => ball(240 + Math.sin(a) * 91, 394, 5, ridgeM, [1, 1, 1], Math.cos(a) * 91)),
    plume,
  );
};
B.globe = () => {
  const wood = std('#b0703f', { roughness: 0.5 });
  const sphere = mesh(new T.SphereGeometry(128, 64, 40), std('#ffffff', { map: globeTex(), roughness: 0.32 }), 240, 214);
  return G(
    turn([[90, 452], [66, 414]], wood, { smooth: false }), cyl(240, 452, 458, 90, 90, std('#6e3f22', { roughness: 0.5 }), 64), cyl(240, 412, 416, 66, 66, std('#c58250', { roughness: 0.45 }), 64),
    cyl(240, 352, 418, 12, 12, gold, 24), ball(240, 362, 12, gold, [1, 0.85, 1]),
    sphere, ring(240, 214, 146, 7, gold, PI * 0.62, PI * 1.76), ball(240, 66, 10, gold),
  );
};
B.crown = () => {
  const velvet = std('#c23a50', { roughness: 0.85 }), pearl = std('#fbf6ec', { roughness: 0.2 }), crownGold = std('#f2c95c', { metalness: 0.55, roughness: 0.32 }), jewel = c => std(c, { roughness: 0.08, metalness: 0.3, emissive: c, emissiveIntensity: 0.2 });
  crownGold.side = T.DoubleSide;
  const peaks = 8, seg = peaks * 12, pos = [], idx = [];
  for (let i = 0; i <= seg; i++) { const a = i / seg * PI * 2, t = (i % 12) / 12, top = 218 + (320 - 218) * (1 - Math.abs(2 * t - 1)); pos.push(Math.sin(a) * 121, AY(304), Math.cos(a) * 121, Math.sin(a) * 121, top, Math.cos(a) * 121); if (i < seg) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); } }
  const wall = new T.BufferGeometry(); wall.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); wall.setIndex(idx); wall.computeVertexNormals();
  const cap = mesh(new T.SphereGeometry(1, 40, 20, 0, PI * 2, 0, PI / 2), velvet, 240, 300); cap.scale.set(104, 98, 104);
  const gems = around(16, (a, k) => { const o = mesh(new T.OctahedronGeometry(1), jewel(['#2f8fd6', '#e0384f', '#2fae6a', '#e0384f'][k % 4]), 240 + Math.sin(a) * 125, 333, Math.cos(a) * 125); o.scale.set(13, 16, 5); o.rotation.y = a; return o; });
  return G(
    ball(240, 413, 1, velvet, [152, 44, 112]),
    [-1, 1].map(s => [-1, 1].map(f => G(tube([[240 + s * 146, 404, f * 60], [240 + s * 156, 436, f * 66]], 3, gold), ball(240 + s * 157, 442, 1, gold, [9, 12, 9], f * 66)))),
    cyl(240, 300, 366, 124, 124, crownGold, 64), hoop(240, 304, 124, 4, crownGold), hoop(240, 362, 124, 4, crownGold), gems,
    new T.Mesh(wall, crownGold), around(peaks, a => ball(240 + Math.sin(a) * 121, 150, 13, pearl, [1, 1, 1], Math.cos(a) * 121), PI / peaks),
    cap, cyl(240, 136, 206, 7, 9, gold, 16), ball(240, 118, 22, gold),
    box(234, 62, 12, 42, 10, gold, 3), box(220, 74, 40, 12, 10, gold, 3),
  );
};
B.cat = () => {
  const bz = c => std(c, { roughness: 0.32, metalness: 0.45 }), bronze = bz('#3f7678'), bronzeD = bz('#2d5559'), plinth = std('#e2bd62', { metalness: 0.5, roughness: 0.4 }), eye = glow('#f2cf62', 0.4), ink = std('#7f5f22', { roughness: 0.6 });
  const face = onEllipsoid(237, 168, 50, 46, 44, 0.5);
  const body = turn([[69, 408], [70, 380], [68, 340], [58, 290], [40, 240], [23, 212]], bronze, { cx: 249 }); body.scale.z = 0.86;
  const ear = (tx, bx, by) => { const h = Math.hypot(tx - bx, 66 - by), o = mesh(new T.ConeGeometry(22, h, 4), bronzeD, (tx + bx) / 2, (66 + by) / 2); o.rotation.z = -Math.atan2(tx - bx, by - 66); o.scale.z = 0.55; return o; };
  const eyes = [222, 256].map(x => G(ball(x, 160, 1, eye, [10, 6, 3], face(x, 160)), ball(x, 160, 1, std('#1b2b2d'), [2.5, 6, 3.4], face(x, 160) + 0.5)));
  const xs = []; for (let x = 156; x < 330; x += 30) xs.push(tube([[x, 420, 61], [x + 10, 446, 61]], 1.3, ink), tube([[x + 10, 420, 61], [x, 446, 61]], 1.3, ink));
  const collar = hoop(243, 224, 34, 5.5, gold); collar.rotation.x = PI / 2 + 0.3;
  return G(
    box(140, 408, 200, 50, 120, plinth, 6), xs,
    body, ball(196, 384, 1, bronzeD, [30, 34, 44], -4), ball(304, 384, 1, bronzeD, [30, 34, 44], -4), // haunches
    box(202, 290, 30, 118, 28, bz('#3d7173'), 14, 46), box(236, 296, 28, 112, 28, bz('#356668'), 14, 46), // front legs
    ball(217, 402, 1, bronze, [16, 9, 20], 56), ball(250, 402, 1, bronze, [15, 9, 20], 56),
    tube(bez([300, 404], [370, 404], [372, 352], [336, 340], 16).map(([x, y]) => [x, y, 10]), 11, bronzeD),
    ball(237, 168, 1, bronze, [50, 46, 44]), ball(230, 190, 1, bz('#4a8486'), [22, 16, 14], 34),
    ear(200, 213, 139), ear(272, 260, 140), eyes,
    collar, [0, 1, 2, 3, 4].map(k => { const a = (k - 2) * 0.5; return ball(243 + Math.sin(a) * 36, 226 + Math.cos(a) * 10, 5, std('#5f9fd6', { roughness: 0.2 }), [1, 1, 1], Math.cos(a) * 37); }),
    ring(276, 118, 8, 2, gold, 0, PI * 2, 6),
  );
};
// ---- The cozy kitchen -----------------------------------------------------------------------------
B.teapot = () => {
  const china = std('#ffffff', { map: teapotTex(), roughness: 0.22 }), blue = std('#4f8fbf', { roughness: 0.25 }), white = std('#eef2f6', { roughness: 0.22 }), lidM = std('#8fc1e3', { roughness: 0.22 });
  const lid = mesh(new T.SphereGeometry(1, 40, 16, 0, PI * 2, 0, PI / 2), lidM, 240, 203); lid.scale.set(70, 34, 70);
  return G(
    turn([[0, 430], [120, 430], [160, 424], [150, 417], [118, 416], [0, 416]], white, { double: true }), hoop(240, 424, 158, 2.4, std('#5f9fd6')),
    cyl(240, 390, 416, 70, 70, blue), turn([[58, 406], [96, 380], [118, 335], [122, 300], [117, 262], [98, 226], [72, 204], [60, 196]], china),
    cyl(240, 200, 206, 80, 80, std('#6fa6d3', { roughness: 0.25 })), lid, ball(240, 160, 1, gold, [18, 15, 18]),
    ring(124, 292, 58, 11, std('#3f7fb0', { roughness: 0.25 }), PI * 0.45, PI * 1.1),
    taper([[330, 326], [372, 304], [404, 258], [428, 194]], 30, 13, std('#6fa9d6', { roughness: 0.22 })),
  );
};
B.cookiejar = () => {
  const jarM = std('#ffffff', { map: jarTex(), roughness: 0.25 }), lidM = std('#c9483d', { roughness: 0.3 }), cookie = std('#e0a865', { roughness: 0.75 }), chip = std('#5a3420', { roughness: 0.6 }), lace = std('#fbf4e8', { roughness: 0.8 });
  const cookieAt = (x, y, r, z, tilt) => { const g = new T.Group(); g.position.set(AX(x), AY(y), z); g.rotation.set(tilt, 0, 0); const d = new T.Mesh(new T.CylinderGeometry(r, r, 12, 32), cookie); d.rotation.x = PI / 2; g.add(d); for (let k = 0; k < 7; k++) { const a = k * 0.95, q = r * (0.25 + (k % 3) * 0.2), c = new T.Mesh(new T.SphereGeometry(4.5, 10, 8), chip); c.position.set(Math.cos(a) * q, -Math.sin(a) * q, 6); c.scale.z = 0.6; g.add(c); } return g; };
  return G(
    cyl(240, 436, 442, 168, 168, std('#efe1cc', { roughness: 0.8 }), 64), around(26, a => ball(240 + Math.sin(a) * 166, 439, 1, lace, [11, 3, 11], Math.cos(a) * 166)),
    turn([[0, 434], [80, 434], [88, 420], [102, 390], [111, 350], [114, 310], [112, 270], [104, 230], [90, 190]], jarM),
    turn([[100, 198], [102, 190], [94, 184], [80, 168], [50, 150], [20, 145], [0, 144]], lidM), ball(240, 128, 1, gold, [22, 18, 22]),
    cookieAt(384, 404, 44, 50, -0.25), cookieAt(102, 414, 36, 56, -0.3),
  );
};
B.mixer = () => {
  const mint = std('#8fd3c1', { roughness: 0.25 }), mintD = std('#6fbfa8', { roughness: 0.28 }), bowlM = metal('#d6dce2', 0.2), batter = std('#f6e7c8', { roughness: 0.85 }), cream = std('#fbf3e6', { roughness: 0.3 });
  const whisk = [0, PI / 2].map(ry => { const o = mesh(new T.TorusGeometry(33, 3, 10, 40), steel, 240, 296); o.scale.set(26 / 33, 40 / 33, 26 / 33); o.rotation.y = ry; return o; });
  return G(
    box(108, 404, 264, 48, 170, std('#7cc5ad', { roughness: 0.25 }), 22),
    box(310, 190, 56, 216, 74, mintD, 12),
    ext(p => { p.M(128, 202); p.C(128, 142, 200, 120, 262, 120); p.L(352, 120); p.C(402, 120, 412, 162, 406, 202); p.L(392, 236); p.L(160, 238); p.C(138, 238, 128, 224, 128, 202); }, 112, mint, 16),
    box(124, 186, 64, 20, 116, steel, 8), ball(376, 178, 11, cream, [1, 1, 0.5], 56),
    turn([[0, 404], [25, 402], [55, 388], [76, 362], [88, 330], [92, 300], [92, 280]], bowlM, { double: true }), hoop(240, 280, 92, 3, bowlM), cyl(240, 284, 288, 86, 86, batter, 48),
    cyl(240, 236, 262, 8, 8, steel, 16), whisk,
  );
};
B.toaster = () => {
  const red = std('#e0574f', { roughness: 0.25, metalness: 0.15 }), crust = std('#c98a4a', { roughness: 0.75 }), crumb = std('#f2d29a', { roughness: 0.85 }), slot = std('#3a1e18', { roughness: 0.6 }), dark = std('#26262c', { roughness: 0.5 });
  const slice = x => G(box(x, 96, 90, 120, 24, crust, 24), box(x + 9, 106, 72, 104, 25.5, crumb, 18));
  const face = mesh(new T.CylinderGeometry(24, 24, 5, 32), std('#fbf3e6', { roughness: 0.3 }), 240, 360, 73); face.rotation.x = PI / 2;
  return G(
    box(96, 182, 290, 222, 144, red, 64),
    box(93, 286, 296, 34, 150, steel, 10),
    box(140, 186, 82, 12, 34, slot, 5), box(260, 186, 82, 12, 34, slot, 5), slice(150), slice(254),
    face, ring(240, 360, 24, 2, std('#c9b393'), 0, PI * 2, 75), tube([[240, 360, 77], [252, 346, 77]], 2.4, std('#3a2357')),
    box(382, 220, 34, 14, 14, dark, 5), box(408, 210, 26, 34, 30, steel, 9),
    [126, 322].map(x => [-44, 44].map(z => box(x, 398, 34, 22, 26, dark, 7, z))),
  );
};
B.pie = () => {
  // The picture looks down on the pie; the model is a real round pie, so it stands lower and is
  // sized by its width. Heights (h) are from the table up.
  const dish = std('#f1ebe2', { roughness: 0.3, side: T.DoubleSide }), crustA = std('#e7b26a', { roughness: 0.7 }), crustB = std('#d9a25a', { roughness: 0.7 }), filling = std('#a8392a', { roughness: 0.45 }), base = std('#c4843f', { roughness: 0.7 });
  const up = (o, x, h, z) => { o.position.set(x, h, z); return o; };
  const strips = [];
  for (const [rot, m, h] of [[PI / 4, crustA, 52], [-PI / 4, crustB, 57]]) for (let k = -4; k <= 4; k++) {
    const off = k * 42, len = 2 * Math.sqrt(Math.max(0, 172 * 172 - off * off)); if (len < 40) continue;
    const s = new T.Mesh(new T.BoxGeometry(len, 7, 24), m); s.rotation.y = rot; strips.push(up(s, Math.sin(rot) * off, h, Math.cos(rot) * off));
  }
  const bumps = around(34, (a, k) => { const o = new T.Mesh(new T.SphereGeometry(1, 12, 8), k % 2 ? crustA : crustB); o.scale.set(17, 11, 13); o.rotation.y = a; return up(o, Math.sin(a) * 178, 54, Math.cos(a) * 178); });
  const dishMesh = new T.Mesh(new T.LatheGeometry([[0.01, 0], [150, 0], [165, 6], [206, 44], [216, 48], [214, 54], [200, 50], [160, 12], [0.01, 10]].map(([r, y]) => new V2(r, y)), 64), dish);
  const fill = new T.Mesh(new T.SphereGeometry(1, 48, 12, 0, PI * 2, 0, PI / 2), filling); fill.scale.set(180, 12, 180);
  return G(dishMesh, up(new T.Mesh(new T.CylinderGeometry(184, 160, 36, 64), base), 0, 30, 0), up(fill, 0, 46, 0), strips, bumps);
};
B.cake = () => {
  const white = std('#ffffff', { roughness: 0.3 }), pink = std('#f5bccb', { roughness: 0.6 }), cream = std('#fff6ea', { roughness: 0.7 }), berry = std('#d92a43', { roughness: 0.3 }), leaf = std('#4f8f4c', { roughness: 0.6 });
  const top = mesh(new T.SphereGeometry(1, 48, 12, 0, PI * 2, 0, PI / 2), cream, 240, 214); top.scale.set(108, 16, 108);
  const drips = around(20, (a, k) => { const len = k % 2 ? 40 : 20; return mesh(new T.CapsuleGeometry(12, len, 6, 12), cream, 240 + Math.sin(a) * 100, 244 + len / 2 - 4, Math.cos(a) * 100); });
  const berryAt = a => G(ball(240 + Math.sin(a) * 68, 204, 1, berry, [22, 18, 22], Math.cos(a) * 68), mesh(new T.ConeGeometry(15, 13, 5), leaf, 240 + Math.sin(a) * 68, 184, Math.cos(a) * 68));
  return G(
    cyl(240, 440, 452, 72, 72, std('#d6cdc0', { roughness: 0.3 }), 48), cyl(240, 392, 444, 14, 14, white, 20),
    turn([[0, 398], [150, 398], [176, 390], [170, 384], [0, 382]], white, { double: true }),
    cyl(240, 222, 382, 102, 102, pink, 64), cyl(240, 296, 312, 103.2, 103.2, cream, 64),
    cyl(240, 212, 246, 108, 108, cream, 64), top, drips,
    berryAt(-PI / 2), berryAt(PI / 2), berryAt(PI * 0.82), berryAt(-PI * 0.82),
    cyl(240, 124, 196, 6, 6, std('#ffffff', { map: ringsTex('#9fd2ee', '#ffffff', 5), roughness: 0.4 }), 16), ball(240, 112, 1, glow('#ffb347', 1.6), [8, 13, 8]),
  );
};
// ---- The city park ----------------------------------------------------------------------------------
B.bench = () => {
  const iron = std('#2f3a36', { roughness: 0.4, metalness: 0.5 }), woodA = std('#c98a48', { roughness: 0.6 }), woodB = std('#d99a56', { roughness: 0.6 });
  const side = x => { const s = x < 240 ? -1 : 1; return G(
    box(x - 8, 172, 16, 268, 16, iron, 5, -52), box(x - 8, 300, 16, 140, 16, iron, 5, 52), // back post, front leg
    box(x - 7, 300, 14, 14, 120, iron, 4), box(x - 32, 433, 64, 14, 18, iron, 6, -52), box(x - 32, 433, 64, 14, 18, iron, 6, 52), box(x - 7, 433, 14, 14, 120, iron, 4),
    ring(x + s * 24, 384, 22, 4, iron, 0, PI * 2, 52), ring(x + s * 24, 384, 22, 4, iron, 0, PI * 2, -52),
    tube([[x, 288, -52], [x + s * 30, 274, -14], [x + s * 42, 280, 30], [x + s * 50, 302, 56]], 6, iron),
  ); };
  return G(side(126), side(354),
    [0, 1, 2].map(k => box(88, 176 + k * 34, 304, 24, 12, k % 2 ? woodB : woodA, 5, -60)),
    [0, 1, 2].map(k => box(76, 296, 328, 14, 34, k % 2 ? woodA : woodB, 5, -40 + k * 40)));
};
B.lamp = () => {
  const green = std('#2f4a3f', { roughness: 0.35, metalness: 0.45 }), warm = glow('#ffe9a8', 1.3), q = Math.SQRT2;
  const frustum = (yTop, yBot, wTop, wBot, m) => { const o = cyl(240, yTop, yBot, wTop / 2 * q, wBot / 2 * q, m, 4); o.rotation.y = PI / 4; return o; };
  const bars = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => tube([[240 + sx * 32, 62, sz * 32], [240 + sx * 46, 142, sz * 46]], 3.4, green));
  const mull = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([sx, sz]) => tube([[240 + sx * 32, 62, sz * 32], [240 + sx * 46, 142, sz * 46]], 1.8, green));
  return G(
    frustum(398, 456, 56, 92, green), cyl(240, 386, 402, 36, 36, green, 24), cyl(240, 150, 392, 10, 10, green, 20),
    box(178, 151, 124, 10, 10, green, 4), [-1, 1].map(d => ring(240 + d * 40, 176, 18, 3, green)),
    box(198, 138, 84, 12, 84, green, 4), frustum(62, 142, 64, 92, warm), bars, mull, box(204, 58, 72, 8, 72, green, 3),
    frustum(30, 64, 4, 100, green), ball(240, 24, 1, gold, [9, 11, 9]),
  );
};
B.picnic = () => {
  const q = Math.SQRT2, weave = std('#ffffff', { map: wickerTex([8, 3]), roughness: 0.8 }), rim = std('#b98344', { roughness: 0.6 }), ging = std('#ffffff', { map: gingham([1 / 28, 1 / 28]), roughness: 0.9, side: T.DoubleSide });
  const basket = cyl(240, 252, 422, 1, 0.8, weave, 4); basket.rotation.y = PI / 4; basket.scale.set(132 * q, 1, 88 * q);
  const cloth = new T.Mesh(new T.ShapeGeometry(rshape(424, 280, 6)), ging); cloth.rotation.x = -PI / 2; cloth.position.set(0, AY(456), 0);
  const flapS = new T.Shape(); [[150, 250], [268, 250], [246, 326], [206, 302], [168, 336]].forEach(([x, y], k) => (k ? flapS.lineTo(AX(x), AY(y)) : flapS.moveTo(AX(x), AY(y))));
  const flap = new T.Mesh(new T.ShapeGeometry(flapS), ging); flap.position.z = 100;
  const loaf = mesh(new T.CapsuleGeometry(20, 104, 8, 20), std('#e3ab62', { roughness: 0.7 }), 186, 214, -10); loaf.rotation.z = 0.5;
  const slashes = [-2, -1, 0, 1, 2].map(k => { const c = Math.cos(-0.5), s = Math.sin(-0.5), px = (x, y) => [186 + x * c - y * s, 214 + x * s + y * c, 10]; return tube([px(-12, k * 24 - 6), px(12, k * 24 + 6)], 2, std('#a86a30')); });
  return G(cloth, basket, box(98, 240, 284, 24, 196, rim, 10),
    tube(bez([150, 252], [150, 118], [330, 118], [330, 252], 24), 9, std('#8a5a2a', { roughness: 0.6 })),
    box(300, 150, 32, 118, 32, std('#3f7a3c', { roughness: 0.15 }), 14, -20), cyl(316, 196, 226, 16.6, 16.6, std('#fbf3e6', { roughness: 0.5 }), 24, -20),
    loaf, slashes, flap, box(150, 238, 118, 8, 120, std('#f6d9dd', { roughness: 0.9 }), 3, 40));
};
B.bicycle = () => {
  const red = std('#c0392b', { roughness: 0.3, metalness: 0.3 }), tyre = std('#2f2f36', { roughness: 0.75 }), darkM = std('#2f2f36', { roughness: 0.5 }), wick = std('#c48a4a', { roughness: 0.75 });
  const axle = (cx, cy, r, len, m) => { const o = mesh(new T.CylinderGeometry(r, r, len, 24), m, cx, cy); o.rotation.x = PI / 2; return o; };
  const wheel = cx => G(ring(cx, 352, 84, 7, tyre), ring(cx, 352, 75, 1.6, steel), around(12, a => { const o = mesh(new T.CylinderGeometry(0.9, 0.9, 150, 6), steel, cx, 352); o.rotation.z = a; return o; }), axle(cx, 352, 9, 24, std('#6a6a74', { metalness: 0.6, roughness: 0.3 })));
  const bar = (a, b, r = 7.5, m = red) => tube([a, b], r, m, false, 2);
  const flower = (x, y, c, z) => G(around(5, a => ball(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 1, std(c, { roughness: 0.6 }), [7, 5, 5], z)), ball(x, y, 4, std('#fff6c8'), [1, 1, 1], z + 2));
  return G(wheel(128), wheel(352),
    bar([128, 352], [240, 352]), bar([240, 352], [214, 228]), bar([214, 228], [128, 352]), bar([240, 352], [326, 236]), bar([326, 236], [214, 234]), bar([326, 236], [352, 352]),
    ball(220, 213, 1, std('#3d2f2b', { roughness: 0.6 }), [33, 10, 18]),
    bar([326, 236], [318, 194], 5, darkM), tube([[296, 192, 0], [320, 184, 0], [348, 196, 0]], 5, darkM), tube([[320, 186, -42], [320, 186, 42]], 4.5, darkM),
    axle(240, 352, 17, 12, steel), box(248, 362, 30, 10, 14, darkM, 3, 16), box(202, 332, 30, 10, 14, darkM, 3, -16),
    box(330, 186, 92, 58, 70, wick, 10), [0, 1, 2].map(k => box(329, 198 + k * 16, 94, 3, 72, std('#8a5a2a'), 1.4)),
    flower(348, 178, '#f4a3b8', 14), flower(372, 170, '#f2cf62', -8), flower(398, 178, '#e0574f', 10), flower(386, 186, '#c8a2e0', 24), flower(360, 182, '#ffffff', -22), flower(404, 184, '#f4a3b8', -18),
  );
};
B.fountain = () => {
  const stone = std('#e3dac8', { roughness: 0.7 }), stoneD = std('#cfc5b1', { roughness: 0.7 }), water = std('#6fbbe6', { roughness: 0.08, transparent: true, opacity: 0.85 }), jet = std('#b5defa', { roughness: 0.1, transparent: true, opacity: 0.8 });
  const ripples = [60, 110, 150].map(r => hoop(240, 402, r, 1.2, std('#ffffff', { transparent: true, opacity: 0.6 })));
  const upper = around(8, a => tube(quad([0, 136], [84, 70], [108, 234], 14).map(([d, y]) => [240 + Math.sin(a) * d, y, Math.cos(a) * d]), 4, jet));
  const lower = around(10, a => tube(quad([120, 246], [172, 252], [178, 392], 14).map(([d, y]) => [240 + Math.sin(a) * d, y, Math.cos(a) * d]), 3.5, jet), 0.3);
  return G(
    turn([[0, 462], [206, 462], [206, 404], [200, 396], [190, 396], [186, 408], [0, 408]], stone, { smooth: false, double: true }), cyl(240, 402, 406, 186, 186, water, 64), ripples,
    cyl(240, 250, 406, 28, 28, stoneD, 32),
    turn([[28, 292], [60, 288], [95, 273], [115, 256], [122, 240], [116, 238], [108, 246], [0, 250]], stone, { double: true }), cyl(240, 242, 246, 108, 108, water, 48),
    cyl(240, 148, 244, 10, 10, stoneD, 20), ball(240, 146, 1, stone, [26, 12, 26]),
    upper, lower,
  );
};
B.cart = () => {
  const stripe = n => std('#ffffff', { map: stripeTex('#f4b8c6', '#fff6ea', n), roughness: 0.4 }), tyre = std('#2f2f36', { roughness: 0.7 }), blue = std('#5f9fd6', { roughness: 0.35 });
  const body = mesh(new T.BoxGeometry(280, 152, 140), [stripe(3.5), stripe(3.5), std('#fff6ea'), std('#fff6ea'), stripe(7), stripe(7)], 240, 326);
  const sign = mesh(new T.PlaneGeometry(160, 50), new T.MeshStandardMaterial({ map: signTex(), transparent: true, roughness: 0.4 }), 240, 317, 71);
  const wheels = [150, 330].map(x => [-78, 78].map(z => { const g = new T.Group(), t = new T.Mesh(new T.CylinderGeometry(34, 34, 16, 32), tyre), h = new T.Mesh(new T.CylinderGeometry(16, 16, 18, 24), steel); t.rotation.x = h.rotation.x = PI / 2; g.add(t, h); g.position.set(AX(x), AY(420), z); return g; }));
  const canopyM = std('#ffffff', { map: stripeTex('#e0384f', '#ffffff', 6), roughness: 0.55, side: T.DoubleSide });
  const canopy = turn([[170, 146], [140, 112], [100, 86], [55, 70], [0, 62]], canopyM), p = canopy.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), f = Math.pow(Math.hypot(x, z) / 170, 5); p.setY(i, p.getY(i) - f * 22 * (1 - Math.abs(Math.cos(6 * Math.atan2(x, z))))); }
  canopy.geometry.computeVertexNormals();
  const scoop = (x, c) => { const cone = mesh(new T.ConeGeometry(17, 40, 20), std('#e3a85c', { roughness: 0.7 }), x, 233); cone.rotation.z = PI; return G(cone, ball(x, 204, 1, std(c, { roughness: 0.6 }), [23, 21, 23])); };
  return G(wheels, body, sign, box(92, 236, 296, 24, 156, blue, 8),
    [-44, 44].map(z => tube([[378, 286, z], [436, 252, z]], 5, steel)), tube([[436, 252, -48], [436, 252, 48]], 5.5, steel),
    cyl(240, 80, 300, 6, 6, steel, 16), canopy, ball(240, 54, 8, gold),
    scoop(164, '#f4a3b8'), scoop(240, '#fff6c8'), scoop(316, '#8fd3c1'));
};
return B;
})();
