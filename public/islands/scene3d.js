/* Cena 3D do arquipélago (Three.js, tudo procedural: sem modelos externos, sem texturas externas).
   Um oceano único (shader), seis ilhas modeladas em código e o barco. Exporta createScene(canvas, data). */
import * as THREE from './vendor/three.module.min.js';
import { mergeGeometries, mergeVertices } from './vendor/BufferGeometryUtils.js';

const P = 3.4;                 // altura do platô das ilhas
const FOV = 32, TAN = Math.tan(FOV * Math.PI / 360);
const PORT_PHI = [-0.34, 0.12, -0.2, 0.3, 0.1, -0.26];   // ângulo do cais (0 = voltado para a câmera)
const SEEDS = [1.7, 4.1, 0.6, 2.9, 5.3, 3.6];
const LAYOUT = {
  desk: [[-32, -17], [0, -24], [33, -15], [-31, 19], [1, 23], [34, 19]],
  mob: [[-12.5, -50], [12.5, -30], [-12.5, -10], [12.5, 10], [-12.5, 30], [12.5, 50]]
};

/* ---------- utilidades ---------- */
function hash3(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), u), L(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), u), v),
           L(L(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), u), L(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), u), v), w);
}
function fbm(x, y, z) { return 0.5 * vnoise(x, y, z) + 0.25 * vnoise(x * 2, y * 2, z * 2) + 0.125 * vnoise(x * 4, y * 4, z * 4); }
function rng(seed) { let a = Math.floor(seed * 99991) >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rr = (th, R, s) => R * (1 + 0.16 * Math.sin(3 * th + s) + 0.09 * Math.sin(5 * th + s * 2.3) + 0.05 * Math.sin(8 * th));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const norm = a => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

/* ---------- materiais ---------- */
const MAT = {};
function std(color, o) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.82, metalness: 0.02 }, o || {})); }
const emiCache = {};
function emi(color, k) { const key = color + k; if (!emiCache[key]) emiCache[key] = new THREE.MeshStandardMaterial({ color: '#05030a', emissive: color, emissiveIntensity: k, roughness: 0.6 }); return emiCache[key]; }
function winTex(color, cols, rows, lit) {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#04060c'; g.fillRect(0, 0, 64, 128);
  const r = rng(cols * 7 + rows), cw = 64 / cols, ch = 128 / rows;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (r() < lit) { g.fillStyle = color; g.globalAlpha = 0.55 + r() * 0.45; g.fillRect(x * cw + 2, y * ch + 2, cw - 4, ch - 4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- construtor de malhas (junta geometrias por material para reduzir draw calls) ---------- */
class Builder {
  constructor() { this.m = new Map(); this.glowS = []; this.glowL = []; this.inst = { cypress: [], palm: [], blossom: [], tuft: [], bush: [], flowerA: [], flowerB: [] }; }
  add(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x || 0, y || 0, z || 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx || 1, sy == null ? (sx || 1) : sy, sz == null ? (sx || 1) : sz));
    g.applyMatrix4(m);
    if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(g); return this;
  }
  box(w, h, d, x, y, z, mat, ry, rx, rz) { return this.add(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z, rx || 0, ry || 0, rz || 0); }
  cyl(rt, rb, h, x, y, z, mat, seg, ry) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg || 16), mat, x, y + h / 2, z, 0, ry || 0, 0); }
  sph(r, x, y, z, mat, sx, sy, sz) { return this.add(new THREE.SphereGeometry(r, 16, 10), mat, x, y, z, 0, 0, 0, sx, sy, sz); }
  tor(r, t, x, y, z, mat, rx, ry, rz) { return this.add(new THREE.TorusGeometry(r, t, 8, 40), mat, x, y, z, rx || 0, ry || 0, rz || 0); }
  glow(x, y, z, c, big) { (big ? this.glowL : this.glowS).push(x, y, z, c.r, c.g, c.b); }
  finish(group, glowMap) {
    this.m.forEach((geos, mat) => {
      const uv = !!(mat.map || mat.emissiveMap); const keep = geos.map(g => { const h = g.clone(); for (const k of Object.keys(h.attributes)) if (k !== 'position' && k !== 'normal' && !(uv && k === 'uv')) h.deleteAttribute(k); return h; });
      const mesh = new THREE.Mesh(mergeGeometries(keep), mat); group.add(mesh);
    });
    [[this.glowS, 1.15], [this.glowL, 3.4]].forEach(([arr, size]) => {
      if (!arr.length) return; const pos = [], col = [];
      for (let i = 0; i < arr.length; i += 6) { pos.push(arr[i], arr[i + 1], arr[i + 2]); col.push(arr[i + 3] * 0.6, arr[i + 4] * 0.6, arr[i + 5] * 0.6); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({ size, map: glowMap, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false }));
      pts.frustumCulled = false; group.add(pts);
    });
  }
}

/* ---------- vegetação instanciada ---------- */
function treeGeos() {
  const col = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3), k = new THREE.Color(c); for (let i = 0; i < n; i++) { a[i * 3] = k.r; a[i * 3 + 1] = k.g; a[i * 3 + 2] = k.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const T = (g, x, y, z) => { g = g.index ? g.toNonIndexed() : g; g.translate(x, y, z); g.deleteAttribute('uv'); return g; };
  const cyp = mergeGeometries([col(T(new THREE.ConeGeometry(0.95, 2.8, 7), 0, 1.5, 0), '#1f6a3a'), col(T(new THREE.ConeGeometry(0.6, 2.2, 7), 0, 3.0, 0), '#2a8248'), col(T(new THREE.CylinderGeometry(0.1, 0.14, 0.5, 5), 0, 0.2, 0), '#2a1a12')]);
  const fr = [];
  for (let i = 0; i < 7; i++) { const g = T(new THREE.ConeGeometry(0.28, 1.9, 4), 0, 0.95, 0); g.rotateZ(Math.PI / 2 + 0.55); g.translate(0.1, 0, 0); g.rotateY(i / 7 * Math.PI * 2); g.translate(0, 3.1, 0); fr.push(col(g, i % 2 ? '#2f9a52' : '#43b865')); }
  const trunk = col(T(new THREE.CylinderGeometry(0.1, 0.17, 3.2, 5), 0, 1.6, 0), '#4a3322');
  const palm = mergeGeometries([trunk].concat(fr));
  const blo = mergeGeometries([col(T(new THREE.CylinderGeometry(0.1, 0.15, 1.3, 5), 0, 0.65, 0), '#3a2a2e'), col(T(new THREE.IcosahedronGeometry(1.0, 1), 0, 1.9, 0), '#b99af5'), col(T(new THREE.IcosahedronGeometry(0.7, 1), 0.6, 2.4, 0.2), '#d3b6ff')]);
  const blades = []; for (let i = 0; i < 6; i++) { const g = T(new THREE.ConeGeometry(0.09, 0.62 + (i % 3) * 0.14, 3), 0, 0.33, 0); g.rotateZ((i % 2 ? 1 : -1) * (0.12 + (i % 3) * 0.1)); g.rotateY(i * 1.05); g.translate(Math.cos(i * 1.05) * 0.1, 0, Math.sin(i * 1.05) * 0.1); blades.push(col(g, i % 2 ? '#5fbf4e' : '#8bd45f')); }
  const tuft = mergeGeometries(blades);
  const bush = mergeGeometries([col(T(new THREE.IcosahedronGeometry(0.62, 0), 0, 0.42, 0), '#2f8f48'), col(T(new THREE.IcosahedronGeometry(0.46, 0), 0.5, 0.36, 0.2), '#3fae5a'), col(T(new THREE.IcosahedronGeometry(0.4, 0), -0.42, 0.3, -0.2), '#277a3f')]);
  const fl = (c) => mergeGeometries([col(T(new THREE.CylinderGeometry(0.025, 0.03, 0.5, 4), 0, 0.25, 0), '#3d8a40'), col(T(new THREE.IcosahedronGeometry(0.15, 0), 0, 0.56, 0), c), col(T(new THREE.IcosahedronGeometry(0.07, 0), 0, 0.64, 0), '#ffe27a')]);
  return { cypress: cyp, palm, blossom: blo, tuft, bush, flowerA: fl('#ff7fb0'), flowerB: fl('#fff1b0') };
}

/* ---------- rocha da ilha ---------- */
function makeRock(i, R) {
  const s = SEEDS[i], base = new THREE.IcosahedronGeometry(1, 10), pos = base.attributes.position, n = pos.count, cols = new Float32Array(n * 3), H = 6.2;
  const c1 = new THREE.Color('#3a2c52'), c2 = new THREE.Color('#6a5a8c'), c3 = new THREE.Color('#9a88bc'), moss = new THREE.Color('#4d9a48'), ground = new THREE.Color('#5d9a4a'), tmp = new THREE.Color();
  for (let k = 0; k < n; k++) {
    let dx = pos.getX(k), dy = pos.getY(k), dz = pos.getZ(k);
    const th = Math.atan2(dz, dx), r0 = rr(th, R, s), up = Math.max(dy, 0);
    const nz = fbm(dx * 2.2 + s, dy * 2.2, dz * 2.2 + s);
    const hf = 1 - 0.28 * up - (dy > 0.45 ? 0.06 : 0);
    let x = dx * r0 * hf, z = dz * r0 * hf, y = dy >= 0 ? dy * H : dy * 5.0;
    const ridge = (nz - 0.4) * 2.4 * Math.min(1, up * 3);
    y += ridge; const rad = 0.05 * R * (nz - 0.4) * Math.min(1, up * 2.5); x += dx * rad; z += dz * rad;
    let plateau = false;
    if (y > P) { y = P + 0.06 * nz; plateau = true; }
    pos.setXYZ(k, x, y, z);
    if (plateau) tmp.copy(ground).lerp(moss, clamp((nz - 0.3) * 1.8, 0, 0.8));
    else if (y < 0.3) tmp.copy(c1).lerp(c2, clamp(y / 0.6 + 0.4, 0, 1) * 0.3);
    else { tmp.copy(c2).lerp(c3, clamp(nz * 1.6 - 0.2, 0, 1)); if (y > P - 1.6 && nz > 0.38) tmp.lerp(moss, 0.7); }
    cols[k * 3] = tmp.r; cols[k * 3 + 1] = tmp.g; cols[k * 3 + 2] = tmp.b;
  }
  for (let k = 0; k < n; k++) {   // variação suave (antes: por face, dava aspecto de mosaico)
    const j = 0.9 + 0.2 * fbm(pos.getX(k) * 0.35 + s, pos.getY(k) * 0.6, pos.getZ(k) * 0.35 - s);
    cols[k * 3] *= j; cols[k * 3 + 1] *= j; cols[k * 3 + 2] *= j;
  }
  base.setAttribute('color', new THREE.BufferAttribute(cols, 3)); base.deleteAttribute('uv'); base.deleteAttribute('normal');
  const geos = [mergeVertices(base, 1e-4)], r = rng(s * 3.1);
  for (let k = 0; k < 7; k++) {   // pedras soltas na borda
    const th = r() * Math.PI * 2, rad = rr(th, R, s) * (1.04 + r() * 0.25); let g = new THREE.IcosahedronGeometry(1, 3); const p = g.attributes.position, sc = 0.9 + r() * 1.5, sy = 0.9 + r() * 1.7, cc = new THREE.Color().copy(c2).lerp(c1, r() * 0.7), ca = new Float32Array(p.count * 3);
    for (let q = 0; q < p.count; q++) { const nn = fbm(p.getX(q) * 2 + k, p.getY(q) * 2, p.getZ(q) * 2); p.setXYZ(q, p.getX(q) * sc * (0.8 + nn * 0.5), p.getY(q) * sy * (0.7 + nn * 0.6), p.getZ(q) * sc * (0.8 + nn * 0.5)); ca[q * 3] = cc.r; ca[q * 3 + 1] = cc.g; ca[q * 3 + 2] = cc.b; }
    g.setAttribute('color', new THREE.BufferAttribute(ca, 3)); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4); g.translate(Math.cos(th) * rad, sy * 0.25 - 0.4, Math.sin(th) * rad); geos.push(g);
  }
  const m = mergeGeometries(geos); m.computeVertexNormals();
  return new THREE.Mesh(m, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 0.9, metalness: 0 }));
}

/* ---------- arquiteturas ---------- */
function scatter(B, i, R, count, kinds, boxes, rmin) {
  const r = rng(SEEDS[i] * 7.7), s = SEEDS[i], out = []; let tries = 0;
  while (out.length < count && tries++ < 600) {
    const th = r() * Math.PI * 2, d = (rmin + r() * 0.16) * rr(th, R, s), x = Math.cos(th) * d, z = Math.sin(th) * d;
    if (boxes.some(b => Math.abs(x - b[0]) < b[2] && Math.abs(z - b[1]) < b[3])) continue;
    const ph = PORT_PHI[i]; if (Math.hypot(x - Math.sin(ph) * 7, z - Math.cos(ph) * 7) < 3.2) continue;
    out.push([x, z]); const kind = kinds[Math.floor(r() * kinds.length)], sc = 0.7 + r() * 0.55;
    B.inst[kind].push(new THREE.Matrix4().compose(new THREE.Vector3(x, P, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6, (r() - 0.5) * 0.1)), new THREE.Vector3(sc, sc * (0.9 + r() * 0.5), sc)));
  }
}
function cover(B, i, R, boxes) {
  const r = rng(SEEDS[i] * 13.3), s = SEEDS[i], ph = PORT_PHI[i], spec = [['tuft', 70, 0.2, 0.9], ['bush', 16, 0.35, 0.92], ['flowerA', 14, 0.3, 0.92], ['flowerB', 14, 0.3, 0.92]];
  spec.forEach(([kind, count, lo, hi]) => { let n = 0, tries = 0; while (n < count && tries++ < 900) {
    const th = r() * Math.PI * 2, d = (lo + r() * (hi - lo)) * rr(th, R, s) * 0.96, x = Math.cos(th) * d, z = Math.sin(th) * d;
    if (boxes.some(b => Math.abs(x - b[0]) < b[2] + 0.4 && Math.abs(z - b[1]) < b[3] + 0.4)) continue;
    if (Math.hypot(x - Math.sin(ph) * 7, z - Math.cos(ph) * 7) < 2.6) continue;
    const sc = kind === 'tuft' ? 0.8 + r() * 0.9 : kind === 'bush' ? 0.8 + r() * 0.7 : 0.9 + r() * 0.6;
    B.inst[kind].push(new THREE.Matrix4().compose(new THREE.Vector3(x, P - 0.02, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6.28, 0)), new THREE.Vector3(sc, sc * (0.9 + r() * 0.4), sc))); n++; } });
}
const BOXES = [
  [[-2.6, -3.2, 2.0, 2.0], [1.6, 0.8, 3.6, 2.2], [3.8, -1.9, 2.8, 2.2], [-3.2, 2.2, 2.4, 2.0]],
  [[0, 0, 5.2, 5.2], [4.3, 3.0, 2.2, 2.2], [-4.4, -2.6, 1.4, 1.4], [2.4, -5.0, 1.4, 1.4], [5.2, -1.6, 1.4, 1.4]],
  [[0, -2.2, 5.2, 3.2], [4.2, 4.3, 3.2, 3.2], [-3.6, 3.4, 1.6, 1.6], [-0.6, 4.4, 1.6, 1.6], [0.8, 0.9, 1.6, 1.6]],
  [[0, -0.5, 5.0, 4.0], [-5.0, 3.8, 2.2, 1.8], [5.0, 3.6, 2.2, 1.8]],
  [[0, 0, 4.6, 4.6], [3.6, 2.0, 1.6, 1.6], [4.0, -3.2, 2.2, 2.2], [-1.4, -1.6, 2.7, 2.7]],
  [[0, 0, 6.2, 4.8]]
];
function lampPost(B, x, z, color, y0) { y0 = y0 == null ? P : y0; B.cyl(0.05, 0.07, 1.3, x, y0, z, MAT.metal, 5); B.sph(0.12, x, y0 + 1.35, z, emi(color, 3)); B.glow(x, y0 + 1.35, z, new THREE.Color(color)); }

function archPerformance(B, R, ac) {
  const warm = '#ffb347', stone = MAT.warm;
  // farol
  B.cyl(1.35, 1.0, 3.4, -2.6, P, -3.2, stone, 14); B.cyl(1.0, 0.8, 3.2, -2.6, P + 3.4, -3.2, MAT.wall, 14); B.cyl(0.8, 0.65, 2.6, -2.6, P + 6.6, -3.2, stone, 14);
  B.cyl(1.05, 1.05, 0.2, -2.6, P + 9.2, -3.2, MAT.metal, 14); B.cyl(0.75, 0.75, 1.3, -2.6, P + 9.4, -3.2, emi(warm, 4), 12); B.cyl(0.05, 1.0, 0.9, -2.6, P + 10.7, -3.2, MAT.roof, 12);
  B.glow(-2.6, P + 10.0, -3.2, new THREE.Color(warm), true);
  // porto com arcadas
  const arc = [[3.4, 0.2, 0], [1.0, 2.8, 0.3], [-1.6, 3.2, 0.2]];
  B.box(5.6, 2.2, 2.4, 1.6, P, 0.8, stone, 0.12); B.box(4.0, 3.0, 2.6, 3.8, P, -1.9, MAT.wall, -0.2); B.box(3.2, 1.8, 2.2, -3.2, P, 2.2, stone, 0.3);
  for (let k = 0; k < 6; k++) { const x = -0.4 + k * 0.95; B.box(0.5, 0.9, 0.1, x + 0.3, P + 0.4, 2.0, emi(warm, 2.6), 0.12); B.glow(x + 0.3, P + 0.9, 2.1, new THREE.Color(warm)); }
  B.box(6.0, 0.25, 2.8, 1.6, P + 2.2, 0.8, MAT.roof, 0.12); B.box(4.4, 0.25, 3.0, 3.8, P + 3.0, -1.9, MAT.roof, -0.2); B.box(3.5, 0.25, 2.5, -3.2, P + 1.8, 2.2, MAT.roof, 0.3);
  for (let k = 0; k < 3; k++) { B.box(0.5, 0.8, 0.1, 3.0 + k * 1.0, P + 1.0, -0.62 - k * 0.1, emi(warm, 2.4), -0.2); }
  lampPost(B, 5.5, 3.0, warm); lampPost(B, -5.2, 0.8, warm); lampPost(B, 0.5, 5.1, warm);
}
function archBrand(B, R, ac) {
  const lil = '#b99af5';
  B.cyl(4.1, 4.4, 0.4, 0, P, 0, MAT.wall, 40); B.cyl(3.5, 3.5, 0.25, 0, P + 0.4, 0, MAT.paleStone, 40);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; B.cyl(0.14, 0.17, 3.6, Math.cos(a) * 3.1, P + 0.65, Math.sin(a) * 3.1, MAT.paleStone, 8); }
  B.tor(3.1, 0.14, 0, P + 4.3, 0, MAT.paleStone, Math.PI / 2); B.tor(3.1, 0.05, 0, P + 4.0, 0, emi(lil, 3.5), Math.PI / 2);
  B.sph(0.95, 0, P + 2.1, 0, emi(lil, 3.2)); B.glow(0, P + 2.1, 0, new THREE.Color(lil), true);
  // anel vertical (marca)
  B.tor(2.0, 0.18, 4.3, P + 2.8, 3.0, emi(lil, 3), 0, -0.5, 0); B.cyl(0.35, 0.5, 0.8, 4.3, P, 3.0, MAT.paleStone, 8);
  // monolitos
  [[-4.4, -2.6, 8.2, 1.1], [2.4, -5.0, 6.0, 0.9], [5.2, -1.6, 4.6, 0.8], [-1.0, -5.6, 3.6, 0.7]].forEach((m, k) => { B.add(new THREE.BoxGeometry(m[3], m[2], m[3] * 0.6), MAT.paleStone, m[0], P + m[2] / 2, m[1], 0, k * 0.5, 0.04, 1, 1, 1); B.box(0.08, m[2] * 0.92, 0.08, m[0] + 0.1, P + 0.15, m[1] + m[3] * 0.31, emi(lil, 2.4), k * 0.5); });
  lampPost(B, -3.4, 4.2, lil); lampPost(B, 3.6, 5.0, lil);
}
function archCharacters(B, R, ac) {
  const co = '#ff987f', cream = '#efe3d4';
  // andaime
  const wood = MAT.wood;
  for (let k = 0; k < 5; k++) { B.box(0.14, 7.0, 0.14, -4.6 + k * 2.3, P, -3.6, wood); B.box(0.14, 7.0, 0.14, -4.6 + k * 2.3, P, -0.8, wood); }
  for (let y = 0; y < 3; y++) { B.box(9.4, 0.12, 0.12, 0, P + 2.0 + y * 2.3, -3.6, wood); B.box(9.4, 0.12, 0.12, 0, P + 2.0 + y * 2.3, -0.8, wood); B.box(0.12, 0.12, 2.8, -4.6, P + 2.0 + y * 2.3, -2.2, wood); B.box(0.12, 0.12, 2.8, 4.6, P + 2.0 + y * 2.3, -2.2, wood); }
  B.box(9.4, 0.18, 2.8, 0, P + 4.3, -2.2, wood);
  // cabeça-escultura grande
  B.sph(1.7, 0.4, P + 6.2, -2.2, MAT.cream, 1, 1.2, 1); B.add(new THREE.CapsuleGeometry(0.34, 2.4, 4, 8), MAT.cream, -0.5, P + 8.5, -2.2, 0, 0, -0.18); B.add(new THREE.CapsuleGeometry(0.34, 2.4, 4, 8), MAT.cream, 1.2, P + 8.5, -2.2, 0, 0, 0.2);
  // tenda
  B.cyl(0.07, 0.07, 3.0, 2.8, P, 3.0, wood, 6); B.cyl(0.07, 0.07, 3.0, 5.6, P, 3.0, wood, 6); B.cyl(0.07, 0.07, 3.0, 2.8, P, 5.6, wood, 6); B.cyl(0.07, 0.07, 3.0, 5.6, P, 5.6, wood, 6);
  B.add(new THREE.ConeGeometry(2.6, 1.3, 4), emi(co, 1.0), 4.2, P + 3.65, 4.3, 0, Math.PI / 4, 0);
  // estátuas mascote
  [[-3.6, 3.4, 1.0], [-0.6, 4.4, 1.3], [0.8, 0.9, 0.9]].forEach((m, k) => {
    B.cyl(0.55, 0.7, 0.5 + m[2] * 0.2, m[0], P, m[1], MAT.paleStone, 10);
    B.add(new THREE.CapsuleGeometry(0.42 * m[2], 0.8 * m[2], 4, 10), MAT.cream, m[0], P + 1.25 + m[2] * 0.5, m[1]);
    B.add(new THREE.CapsuleGeometry(0.11 * m[2], 0.6 * m[2], 3, 6), MAT.cream, m[0] - 0.17 * m[2], P + 2.6 + m[2] * 0.5, m[1], 0, 0, 0.15); B.add(new THREE.CapsuleGeometry(0.11 * m[2], 0.6 * m[2], 3, 6), MAT.cream, m[0] + 0.17 * m[2], P + 2.6 + m[2] * 0.5, m[1], 0, 0, -0.15);
    B.glow(m[0], P + 0.7, m[1], new THREE.Color(co));
  });
  for (let k = 0; k < 9; k++) { const x = 2.8 + k * 0.34, z = 3.0 + Math.sin(k * 0.7) * 0.15; B.sph(0.09, x, P + 2.9 - Math.sin(k / 8 * Math.PI) * 0.0, z - 0.0, emi(co, 3.4)); B.glow(x, P + 2.9, z, new THREE.Color(co)); }
  lampPost(B, 6.4, 1.0, co); lampPost(B, -5.5, 2.4, co);
}
function archMedia(B, R, ac) {
  const gr = '#64dda0';
  B.box(8.6, 0.3, 6.0, 0, P, -0.2, MAT.metal);                                   // palco
  B.box(7.4, 4.8, 0.3, 0, P + 0.3, -3.1, emi('#2fe07f', 1.25)); B.glow(0, P + 3.0, -2.6, new THREE.Color(gr), true); // chroma key
  B.box(7.4, 0.04, 4.0, 0, P + 0.32, -1.0, emi('#2fe07f', 0.9));
  for (let k = 0; k < 2; k++) { const x = -4.1 + k * 8.2; B.box(0.2, 6.2, 0.2, x, P, -3.0, MAT.metal); B.box(0.2, 6.2, 0.2, x, P, 1.8, MAT.metal); B.box(0.15, 0.15, 4.9, x, P + 6.1, -0.6, MAT.metal); }
  B.box(8.4, 0.15, 0.15, 0, P + 6.1, -3.0, MAT.metal); B.box(8.4, 0.15, 0.15, 0, P + 6.1, 1.8, MAT.metal);
  for (let k = 0; k < 5; k++) { const x = -3.2 + k * 1.6; B.box(0.35, 0.28, 0.5, x, P + 5.8, 1.7, emi('#e9fff4', 3.4)); B.glow(x, P + 5.7, 1.8, new THREE.Color('#bfffe0')); }
  // grua
  B.cyl(0.35, 0.45, 1.0, 2.8, P + 0.3, 2.4, MAT.dark, 8); B.add(new THREE.BoxGeometry(0.22, 0.22, 6.2), MAT.metal, 1.6, P + 2.3, 0.2, 0.35, 0.5, 0); B.box(0.8, 0.5, 0.9, -0.4, P + 3.1, -1.3, MAT.dark, 0.5);
  // contêineres / estações
  B.box(2.8, 1.9, 1.5, -5.0, P, 3.8, MAT.dark, 0.2); B.box(2.6, 0.06, 0.1, -5.0, P + 1.6, 3.05, emi(gr, 2.6), 0.2); B.box(2.2, 1.6, 1.4, 5.0, P, 3.6, MAT.dark, -0.2); B.box(2.0, 0.06, 0.1, 5.0, P + 1.3, 2.9, emi(gr, 2.6), -0.2);
  lampPost(B, -6.0, 0.5, gr); lampPost(B, 6.2, 0.2, gr);
}
function archStrategy(B, R, ac) {
  const cy = '#7ddde6';
  B.cyl(4.0, 4.4, 0.35, 0, P, 0, MAT.paleStone, 36); B.cyl(3.3, 3.4, 0.35, 0, P + 0.35, 0, MAT.wall, 36);
  B.tor(2.6, 0.06, 0, P + 0.74, 0, emi(cy, 3.0), Math.PI / 2); B.tor(1.3, 0.05, 0, P + 0.74, 0, emi(cy, 3.0), Math.PI / 2);
  B.box(5.6, 0.04, 0.09, 0, P + 0.73, 0, emi(cy, 2.4)); B.box(0.09, 0.04, 5.6, 0, P + 0.73, 0, emi(cy, 2.4));
  // observatório
  B.cyl(2.1, 2.5, 6.6, -1.4, P + 0.7, -1.6, MAT.paleBlue, 24); B.cyl(2.45, 2.45, 0.28, -1.4, P + 3.5, -1.6, MAT.metal, 24); B.cyl(2.2, 2.2, 0.28, -1.4, P + 7.3, -1.6, MAT.metal, 24);
  B.add(new THREE.SphereGeometry(2.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), MAT.dome, -1.4, P + 7.55, -1.6);
  B.add(new THREE.BoxGeometry(0.7, 2.5, 0.3), emi(cy, 3.2), -1.4, P + 9.0, -0.0, -0.45, 0, 0); B.glow(-1.4, P + 8.9, 0.2, new THREE.Color(cy), true);
  for (let k = 0; k < 4; k++) { B.box(0.3, 0.55, 0.12, -1.4 + Math.cos(k * 1.57 + 0.7) * 2.14, P + 2.0 + k * 1.2, -1.6 + Math.sin(k * 1.57 + 0.7) * 2.14, emi(cy, 2.8), -(k * 1.57 + 0.7)); }
  // armilar
  B.tor(0.8, 0.05, 3.6, P + 1.6, 2.0, MAT.metal, 0, 0, 0); B.tor(0.8, 0.05, 3.6, P + 1.6, 2.0, MAT.metal, Math.PI / 2, 0, 0); B.tor(0.8, 0.05, 3.6, P + 1.6, 2.0, MAT.metal, 0.6, 1.0, 0); B.cyl(0.08, 0.12, 0.9, 3.6, P + 0.4, 2.0, MAT.metal, 6); B.sph(0.16, 3.6, P + 1.6, 2.0, emi(cy, 3.0));
  B.box(2.4, 1.4, 2.0, 4.0, P + 0.3, -3.2, MAT.paleBlue, 0.4); B.box(2.0, 0.07, 0.1, 3.9, P + 1.2, -2.25, emi(cy, 2.6), 0.4);
  lampPost(B, -4.3, 2.4, cy); lampPost(B, 1.0, 5.0, cy);
}
function archTech(B, R, ac, extra) {
  const bl = '#82abff', wt = extra.win;
  B.box(11.0, 0.4, 8.4, 0, P, 0, MAT.paleBlue);
  const T = [[-3.6, -1.6, 2.6, 7.2, 2.4], [-0.5, -2.6, 2.4, 5.4, 2.2], [3.1, -1.4, 2.6, 6.6, 2.4], [3.2, 2.0, 2.2, 4.0, 2.0], [-3.6, 2.3, 2.2, 3.2, 2.2]];
  T.forEach((t, k) => { B.add(new THREE.BoxGeometry(t[2], t[3], t[4]), extra.winMat, t[0], P + 0.4 + t[3] / 2, t[1], 0, k * 0.08, 0); B.box(t[2] + 0.12, 0.12, t[4] + 0.12, t[0], P + 0.4 + t[3], t[1], emi(bl, 2.8), k * 0.08); B.glow(t[0], P + 0.4 + t[3], t[1], new THREE.Color(bl)); });
  B.add(new THREE.BoxGeometry(1.5, 1.5, 1.5), emi('#8fd0ff', 1.7), -0.4, P + 3.8, 1.0, 0.4, 0.6, 0.3); B.glow(-0.4, P + 3.8, 1.0, new THREE.Color('#8fd0ff'), true);
  B.box(5.0, 0.28, 0.9, 0.4, P + 4.6, -2.0, MAT.metal); B.box(5.0, 0.05, 0.12, 0.4, P + 4.9, -2.0, emi(bl, 3.0));
  B.tor(4.3, 0.06, 0, P + 0.5, 0, emi(bl, 2.8), Math.PI / 2);
  lampPost(B, 5.0, 3.2, bl); lampPost(B, -5.0, 3.6, bl);
}
const ARCH = [archPerformance, archBrand, archCharacters, archMedia, archStrategy, archTech];

/* ---------- barco ---------- */
function makeBoat() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const hullG = new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hp = hullG.attributes.position;
  for (let i = 0; i < hp.count; i++) {   // casco: proa pontuda (+x), popa chata
    let x = hp.getX(i), y = hp.getY(i), z = hp.getZ(i);
    const t = clamp((x + 1) / 2, 0, 1); z *= x > 0 ? (1 - 0.9 * Math.pow(x, 1.4)) : (1 - 0.12 * Math.abs(x)); y += (x > 0 ? 0.28 * x * x : 0.06 * (-x));
    hp.setXYZ(i, x * 1.7, y * 0.62, z * 0.62);
  }
  hullG.computeVertexNormals();
  const hull = new THREE.Mesh(hullG, std('#6a3c22', { roughness: 0.7 })); hull.position.y = 0.42; body.add(hull);
  const deck = new THREE.Mesh(new THREE.CircleGeometry(1, 20), std('#b88a57', { roughness: 0.9 })); deck.rotation.x = -Math.PI / 2; deck.scale.set(1.65, 0.58, 1); deck.position.y = 0.43; body.add(deck);
  const trim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 6, 32, Math.PI * 2), std('#e8d8bd')); trim.rotation.x = Math.PI / 2; trim.scale.set(1.7, 0.62, 1); trim.position.y = 0.43; body.add(trim);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 3.4, 6), std('#4a3322')); mast.position.set(0.15, 2.15, 0); body.add(mast);
  const sailMat = new THREE.MeshStandardMaterial({ color: '#ff7417', emissive: '#ff5a00', emissiveIntensity: 0.28, roughness: 0.9, side: THREE.DoubleSide });
  function sail(w, h, bulge, dir) { const sg = new THREE.PlaneGeometry(1, h, 6, 8), p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const u = p.getX(i) + 0.5, v = p.getY(i) / h + 0.5; p.setXYZ(i, dir * u * w * (1 - v * 0.97), p.getY(i), bulge * Math.sin(Math.PI * u) * (1 - v * 0.6)); } sg.computeVertexNormals(); return sg; }
  const main = new THREE.Mesh(sail(1.7, 3.0, 0.24, -1), sailMat); main.position.set(0.15, 0.62 + 1.5, 0); body.add(main);
  const jib = new THREE.Mesh(sail(1.25, 2.4, -0.16, 1), sailMat); jib.position.set(0.15, 0.62 + 1.2, 0); body.add(jib);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 5), std('#4a3322')); boom.rotation.z = Math.PI / 2; boom.position.set(-0.7, 0.66, 0); body.add(boom);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), emi('#ffb347', 4)); lamp.position.set(-1.5, 0.75, 0); body.add(lamp);
  body.scale.setScalar(1.15);
  return { group: g, body };
}

/* ---------- água ---------- */
const WATER_V = 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
const WATER_F = `
precision highp float;
varying vec3 vW; uniform float uTime; uniform vec4 uIsl[6]; uniform vec3 uAcc[6]; uniform float uBoost[6]; uniform vec3 uCam; uniform vec3 uFog; uniform vec3 uMoon;
float h2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*f*(f*(f*6.-15.)+10.); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y); }
const mat2 RM = mat2(.8,.6,-.6,.8);
float fb(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*n2(p); p=RM*p*2.03+3.1; a*=.5; } return s; }
float rr(float th, float R, float s){ return R*(1.+.16*sin(3.*th+s)+.09*sin(5.*th+s*2.3)+.05*sin(8.*th)); }
void main(){
  vec2 p = vW.xz; float t = uTime;
  vec2 g = vec2(0.);
  vec2 k1 = vec2(.21,.08), k2 = vec2(-.13,.19), k3 = vec2(.36,-.27);
  g += k1*.5*cos(dot(k1,p)*1.7+t*.55) + k2*.42*cos(dot(k2,p)*2.1-t*.47) + k3*.14*cos(dot(k3,p)*3.1+t*.9);
  float dc0 = length(uCam - vW), fade = 1. - smoothstep(60., 260., dc0);
  vec2 k4 = vec2(.62,.31), k5 = vec2(-.44,.71), k6 = vec2(.93,-.58);
  g += (k4*.09*cos(dot(k4,p)*2.6+t*1.3) + k5*.07*cos(dot(k5,p)*2.9-t*1.15) + k6*.045*cos(dot(k6,p)*3.4+t*1.7)) * (.4 + .6*fade);
  vec2 q = p*.55 + vec2(t*.18, -t*.13);
  float e = .35, c0 = fb(q);
  vec2 gn = vec2(fb(q+vec2(e,0.))-c0, fb(q+vec2(0.,e))-c0)/e;
  g += gn * .16 * fade;
  vec3 n = normalize(vec3(-g.x*.45, 1., -g.y*.45));
  vec3 V = normalize(uCam - vW); float fr = pow(1.-max(dot(n,V),0.), 3.);
  vec3 deep = vec3(.034,.012,.088), mid = vec3(.100,.046,.225);
  vec3 col = mix(deep, mid, clamp(fr*.9 + fb(p*.035)*.26, 0., 1.));
  col += vec3(.05,.03,.10) * smoothstep(.55,.85, fb(p*.12 + vec2(-t*.04, t*.03))) * .5;
  vec3 R = reflect(-V, n); float sp = max(dot(R, uMoon), 0.);
  col += vec3(.78,.66,1.)*pow(sp, 70.)*.45 + vec3(.20,.11,.40)*pow(sp, 8.)*.5;
  col += vec3(.5,.4,.9)*pow(fb(p*.8+t*.1), 2.)*pow(sp,2.)*.35*fade;
  float fN = fb(p*1.6 + vec2(t*.35,-t*.25)), rN = fb(p*.45);
  for(int i=0;i<6;i++){
    vec2 d = p - uIsl[i].xy; float dist = length(d), th = atan(d.y, d.x), w = rr(th, uIsl[i].z, uIsl[i].w)*1.02, r = dist - w;
    float boost = 1. + uBoost[i]*1.6;
    float sh = smoothstep(11., 0., r);
    col += uAcc[i]*(sh*.10 + sh*sh*.22)*boost*step(-.4, r);
    col += vec3(.04,.30,.36)*smoothstep(4.5,0.,r)*.30*step(-.4,r);
    float f = (1.-smoothstep(0.,1.4,r)) * step(-.5, r) * (.5 + .5*fN);
    f *= .62 + .38*sin(t*1.2 + dist*1.3);
    col += vec3(.80,.88,1.)*f*.45;
    float rip = smoothstep(.95,1.,sin(r*2.4 - t*.8 + rN*4.)) * smoothstep(9.,1.,r) * step(0.,r);
    col += uAcc[i]*rip*.04*boost;
  }
  float dc = length(uCam - vW); col = mix(uFog, col, exp(-dc*.0042));
  gl_FragColor = vec4(col, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/* ---------- cena ---------- */
export function createScene(canvas, data, opts) {
  opts = opts || {};
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.32;
  const FOGC = new THREE.Color('#1c0c3c'); renderer.setClearColor(FOGC, 1);
  const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0x1c0c3c, 0.0042);
  const camera = new THREE.PerspectiveCamera(FOV, 1.6, 1, 900);
  const N = data.islands.length, accents = data.islands.map(d => new THREE.Color(d.accent));

  MAT.warm = std('#d8b98c'); MAT.wall = std('#cfc6dc'); MAT.paleStone = std('#d9d2e6'); MAT.paleBlue = std('#aebdd2'); MAT.cream = std('#efe3d4', { roughness: 0.7 });
  MAT.metal = std('#241c30', { metalness: 0.55, roughness: 0.45 }); MAT.dark = std('#17121f', { metalness: 0.3, roughness: 0.6 }); MAT.wood = std('#6b4a32', { roughness: 0.9 });
  MAT.roof = std('#5a2f33'); MAT.dome = std('#c9d3e4', { metalness: 0.35, roughness: 0.35 });
  const gt = glowTex(), tg = treeGeos();
  const winMat = new THREE.MeshStandardMaterial({ color: '#13203a', roughness: 0.4, metalness: 0.4, emissive: '#ffffff', emissiveMap: winTex('#82abff', 6, 14, 0.55), emissiveIntensity: 1.7 });

  /* luzes */
  scene.add(new THREE.HemisphereLight(0xc9b8ff, 0x5a3f8c, 1.9));
  const moon = new THREE.DirectionalLight(0xffd9ae, 3.4); moon.position.set(-40, 70, -30); scene.add(moon);
  const rim = new THREE.DirectionalLight(0x6fe8d6, 1.0); rim.position.set(50, 20, 60); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffb1d0, 0.9); fill.position.set(10, 30, 80); scene.add(fill);
  const accentLight = new THREE.PointLight(0xffffff, 0, 60, 1.2); scene.add(accentLight);

  /* oceano */
  const uIsl = [], uAcc = [], uBoost = [];
  for (let i = 0; i < 6; i++) { uIsl.push(new THREE.Vector4(0, 0, 10, SEEDS[i % N])); uAcc.push(accents[i % N].clone()); uBoost.push(0); }
  const waterMat = new THREE.ShaderMaterial({ vertexShader: WATER_V, fragmentShader: WATER_F, uniforms: { uTime: { value: 0 }, uIsl: { value: uIsl }, uAcc: { value: uAcc }, uBoost: { value: uBoost }, uCam: { value: camera.position }, uFog: { value: FOGC }, uMoon: { value: moon.position.clone().normalize() } } });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2), waterMat); scene.add(water);

  /* vento: balanço do mato, arbustos e flores */
  const windU = { value: 0 };
  const swayMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
  swayMat.onBeforeCompile = (sh) => { sh.uniforms.uWind = windU; sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n float ph = instanceMatrix[3].x * .7 + instanceMatrix[3].z * .9; float sw = sin(uWind * 1.7 + ph) * .1 + sin(uWind * 2.9 + ph * 1.7) * .04; transformed.x += sw * position.y; transformed.z += sw * .6 * position.y;'); };

  /* ilhas */
  const R0 = 10, islands = [], ports = [];
  data.islands.forEach((d, i) => {
    const grp = new THREE.Group(), B = new Builder(), R = R0;
    const rock = makeRock(i, R); grp.add(rock);
    // cais
    const phi = PORT_PHI[i], th = Math.atan2(Math.cos(phi), Math.sin(phi)), wr = rr(th, R, SEEDS[i]), u = [Math.sin(phi), Math.cos(phi)], t = [Math.cos(phi), -Math.sin(phi)];
    const qx = u[0] * (wr + 1.0), qz = u[1] * (wr + 1.0);
    B.add(new THREE.BoxGeometry(9.0, 0.22, 1.5), MAT.wood, qx, 0.95, qz, 0, Math.atan2(-t[1], t[0]), 0);
    for (let k = -3; k <= 3; k++) { B.cyl(0.1, 0.1, 1.9, qx + t[0] * k * 1.35 + u[0] * 0.55, -0.9, qz + t[1] * k * 1.35 + u[1] * 0.55, MAT.wood, 6); }
    for (let k = -1; k <= 1; k += 2) lampPost(B, qx + t[0] * k * 3.8, qz + t[1] * k * 3.8, '#ffb347', 1.05);
    // rampa até o platô
    const rx0 = u[0] * (wr * 0.76), rz0 = u[1] * (wr * 0.76), len = Math.hypot(qx - rx0, qz - rz0), ang = Math.atan2(-(qz - rz0), qx - rx0);
    B.add(new THREE.BoxGeometry(Math.hypot(len, P - 0.95) + 0.4, 0.28, 1.5), MAT.wood, (qx + rx0) / 2, (P + 0.95) / 2 + 0.1, (qz + rz0) / 2, 0, ang, -Math.atan2(P - 0.95, len));
    const archX = { win: winTex, winMat };
    ARCH[i](B, R, accents[i], archX);
    // vegetação
    const kinds = [['cypress', 'cypress', 'palm'], ['blossom', 'blossom', 'cypress'], ['palm', 'cypress'], ['palm', 'cypress'], ['cypress', 'cypress'], ['cypress']][i];
    scatter(B, i, R, [9, 9, 8, 8, 8, 6][i], kinds, BOXES[i], [0.56, 0.5, 0.55, 0.56, 0.54, 0.56][i]);
    cover(B, i, R, BOXES[i]);
    B.finish(grp, gt);
    [['cypress', tg.cypress], ['palm', tg.palm], ['blossom', tg.blossom], ['tuft', tg.tuft], ['bush', tg.bush], ['flowerA', tg.flowerA], ['flowerB', tg.flowerB]].forEach(([k, geo]) => {
      const arr = B.inst[k]; if (!arr.length) return;
      const im = new THREE.InstancedMesh(geo, (['tuft', 'bush', 'flowerA', 'flowerB'].includes(k) ? swayMat : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true })), arr.length);
      arr.forEach((m, q) => im.setMatrixAt(q, m)); im.instanceMatrix.needsUpdate = true; grp.add(im);
    });
    // anel de luz da ilha (hover/foco)
    const isl = { grp, R, phi, u, t, qx, qz, wr, seed: SEEDS[i], extras: {} };
    if (i === 0) { // feixe do farol
      const beam = new THREE.Mesh(new THREE.ConeGeometry(3.4, 26, 24, 1, true).translate(0, -12, 0).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      const piv = new THREE.Group(); piv.position.set(-2.6, P + 10.0, -3.2); piv.add(beam); beam.position.x = 0; grp.add(piv); isl.extras.beam = piv;
    }
    scene.add(grp); islands.push(isl);
  });

  /* vagalumes / brasas: laço passivo ambiente */
  const FF = 140, ffPos = new Float32Array(FF * 3), ffPh = new Float32Array(FF * 2), ffCol = new Float32Array(FF * 3), rf = rng(9.1);
  for (let i = 0; i < FF; i++) { ffPos[i * 3] = (rf() - 0.5) * 120; ffPos[i * 3 + 1] = rf() * 14; ffPos[i * 3 + 2] = (rf() - 0.5) * 120; ffPh[i * 2] = rf() * 6.28; ffPh[i * 2 + 1] = 0.25 + rf() * 0.5; const c = accents[Math.floor(rf() * N)]; ffCol[i * 3] = c.r; ffCol[i * 3 + 1] = c.g; ffCol[i * 3 + 2] = c.b; }
  const ffG = new THREE.BufferGeometry(); ffG.setAttribute('position', new THREE.BufferAttribute(ffPos, 3)); ffG.setAttribute('aPh', new THREE.BufferAttribute(ffPh, 2)); ffG.setAttribute('color', new THREE.BufferAttribute(ffCol, 3));
  const ffMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
    vertexShader: 'attribute vec2 aPh; attribute vec3 color; uniform float uTime; uniform float uPx; varying vec3 vC; varying float vA; void main(){ vec3 p = position; float t = uTime*aPh.y; p.y = mod(p.y + t*1.2, 14.0); p.x += sin(t*1.7+aPh.x)*1.6; p.z += cos(t*1.3+aPh.x)*1.6; vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uPx*(26.0/-mv.z)*(0.6+0.4*sin(uTime*2.0+aPh.x)); vC = color; vA = smoothstep(0.0,2.0,p.y)*smoothstep(14.0,10.0,p.y); }',
    fragmentShader: 'varying vec3 vC; varying float vA; void main(){ float r = length(gl_PointCoord-.5)*2.; float a = smoothstep(1.,0.,r); gl_FragColor = vec4(vC*1.3, a*a*vA*.8); }' });
  const fireflies = new THREE.Points(ffG, ffMat); fireflies.frustumCulled = false; fireflies.position.y = 0.5; scene.add(fireflies);

  /* barco + rastro */
  const boat = makeBoat(); scene.add(boat.group);
  const WAKE_N = 72, wakeGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), age = new Float32Array(WAKE_N).fill(1);
  wakeGeo.setAttribute('aAge', new THREE.InstancedBufferAttribute(age, 1));
  const wakeMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, vertexShader: 'attribute float aAge; varying float vA; varying vec2 vU; void main(){ vA=aAge; vU=uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position,1.0);} ', fragmentShader: 'varying float vA; varying vec2 vU; void main(){ float r=length((vU-.5)*2.); float a=smoothstep(1.,.15,r)*.5*pow(max(1.-vA,0.),1.5); gl_FragColor=vec4(.86,.92,1.,a); }' });
  const wake = new THREE.InstancedMesh(wakeGeo, wakeMat, WAKE_N); wake.frustumCulled = false; scene.add(wake);
  const wakeData = new Array(WAKE_N).fill(null), zeroM = new THREE.Matrix4().makeScale(0, 0, 0); let wakeIdx = 0, lastWake = 0;
  for (let i = 0; i < WAKE_N; i++) wake.setMatrixAt(i, zeroM);
  const boatState = { x: 0, z: 0, ry: 0, bank: 0 };

  /* ---------- API ---------- */
  let mobile = false, W = 800, H = 500, layoutIdx = null, hover = -1, focused = -1, time = 0, accentK = 0;
  const api = { THREE, islands, boatState };
  api.layout = function (mob) {
    mobile = mob; const L = LAYOUT.desk;
    islands.forEach((is, i) => { is.grp.position.set(L[i][0], 0, L[i][1]); uIsl[i].set(L[i][0], L[i][1], is.R, is.seed); });
  };
  /* ponto de atracação e proa de cada ilha (barco paralelo ao cais, proa para a direita da tela) */
  api.dock = function (i) { const is = islands[i], c = is.grp.position; return { x: c.x + is.u[0] * (is.wr + 1.0 + 2.2), z: c.z + is.u[1] * (is.wr + 1.0 + 2.2), tx: is.t[0], tz: is.t[1] }; };
  api.placeBoat = function (x, z, ry, bank) { boatState.x = x; boatState.z = z; boatState.ry = ry; boatState.bank = bank || 0; };
  api.dockBoat = function (i, side) { const d = api.dock(i), ry = Math.atan2(-d.tz * side, d.tx * side); api.placeBoat(d.x, d.z, ry, 0); return ry; };
  api.dockHeading = function (i, side) { const d = api.dock(i); return Math.atan2(-d.tz * side, d.tx * side); };
  function fitD(st, aspect, pts, margin) {   // menor distância em que todos os pontos cabem no quadro
    const cam = new THREE.PerspectiveCamera(FOV, aspect, 1, 2000), v = new THREE.Vector3(); let lo = 20, hi = 600;
    for (let it = 0; it < 22; it++) {
      const mid = (lo + hi) / 2, ce = Math.cos(st.el);
      cam.position.set(st.x + mid * ce * Math.sin(st.az), st.y + mid * Math.sin(st.el), st.z + mid * ce * Math.cos(st.az)); cam.lookAt(st.x, st.y, st.z); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      let ok = true; for (const p of pts) { v.set(p[0], p[1], p[2]).project(cam); if (Math.abs(v.x) > margin[0] || v.y > margin[1] || v.y < -margin[2]) { ok = false; break; } }
      if (ok) hi = mid; else lo = mid;
    }
    return hi;
  }
  api.camFor = function (i, aspect, vfrac) {
    aspect = aspect || (W / H); vfrac = vfrac || 1;
    if (i < 0) {
      const L = LAYOUT.desk, el = 41 * Math.PI / 180, pts = [];
      L.forEach(p => { for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; pts.push([p[0] + Math.cos(a) * 11, 0, p[1] + Math.sin(a) * 11]); } pts.push([p[0], 11, p[1]]); });
      const st = { x: 0, y: 2, z: 2, az: 0, el, off: 0, offy: 0 };
      st.d = fitD(st, aspect, pts, [0.94, 0.80, 0.93]) * 1.0; return st;
    }
    const is = islands[i], c = is.grp.position, el = (mobile ? 27 : 24) * Math.PI / 180, pts = [];
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; pts.push([c.x + Math.cos(a) * 11, 0, c.z + Math.sin(a) * 11]); }
    pts.push([c.x, 12, c.z]); const d0 = api.dock(i); pts.push([d0.x + is.t[0] * 3, 0, d0.z + is.t[1] * 3]); pts.push([d0.x - is.t[0] * 3, 0, d0.z - is.t[1] * 3]);
    // painel em faixa horizontal embaixo (desktop): ilha centralizada na parte de cima do quadro
    const vf = mobile ? vfrac : 0.66, st = { x: c.x + is.u[0] * 1.2, y: 3.3, z: c.z + is.u[1] * 1.2, az: is.phi * 0.9, el, off: 0, offy: (1 - vf) / 2 };
    st.d = fitD(st, aspect, pts, mobile ? [0.95, vf * 0.9, vf * 0.9] : [0.86, vf * 0.86, vf * 0.86]); return st;
  };
  api.mixCam = function (a, b, t, lift, boatPos, follow) {
    const s = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t), d: lerp(a.d, b.d, t), az: lerp(a.az, b.az, t), el: lerp(a.el, b.el, t), off: lerp(a.off, b.off, t), offy: lerp(a.offy || 0, b.offy || 0, t) };
    const sn = Math.sin(Math.PI * t); s.d += (lift || 0) * sn; s.el += (lift ? 0.22 * sn : 0);
    if (boatPos && follow) { s.x += (boatPos.x - s.x) * follow * sn; s.z += (boatPos.z - s.z) * follow * sn; }
    return s;
  };
  api.setCam = function (s) {
    const ce = Math.cos(s.el);
    camera.position.set(s.x + s.d * ce * Math.sin(s.az), s.y + s.d * Math.sin(s.el), s.z + s.d * ce * Math.cos(s.az));
    camera.lookAt(s.x, s.y, s.z); camera.updateMatrixWorld();
    if (s.off || s.offy) camera.setViewOffset(W, H, s.off * W, (s.offy || 0) * H, W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(); api.cam = s;
  };
  api.resize = function (w, h, dpr) {
    W = Math.max(2, Math.round(w)); H = Math.max(2, Math.round(h)); renderer.setPixelRatio(dpr || 1); renderer.setSize(W, H, false); ffMat.uniforms.uPx.value = (dpr || 1) * H / 700;
    camera.aspect = W / H; camera.updateProjectionMatrix();
  };
  api.project = function (i) {
    const is = islands[i], c = is.grp.position, v = new THREE.Vector3(c.x, 1.5, c.z).project(camera), e = new THREE.Vector3(c.x, 1.5, c.z).add(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(is.R * 1.2)).project(camera);
    const t = new THREE.Vector3(c.x, 8, c.z).project(camera);
    return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H, r: Math.abs((e.x - v.x) / 2 * W), top: (1 - t.y) / 2 * H };
  };
  api.setHover = function (i) { hover = i; };
  api.setFocus = function (i) { focused = i; };
  api.emitWake = function (x, z, tx, tz, now) {
    if (now - lastWake < 14) return; lastWake = now; const m = Math.hypot(tx, tz) || 1;
    wakeData[wakeIdx % WAKE_N] = { x: x - tx / m * 1.9, z: z - tz / m * 1.9, a: Math.atan2(-tz, tx), t: now }; wakeIdx++;
  };
  api.wakeActive = function () { let n = 0; const now = performance.now(); for (let i = 0; i < WAKE_N; i++) if (wakeData[i] && now - wakeData[i].t < 1500) n++; return n; };
  api.clearWake = function () { for (let i = 0; i < WAKE_N; i++) { wakeData[i] = null; wake.setMatrixAt(i, zeroM); } wake.instanceMatrix.needsUpdate = true; };
  /* trajetória: saída pela proa (reta ou volta ampla), rota livre entre as ilhas por busca A* numa grade de água navegável,
     encurtada, reamostrada e arredondada, e aproximação alinhada ao cais. O resultado é uma Catmull-Rom suave por comprimento de arco. */
  api.makePath = function (a, b, hA, hB) {
    const V = (x, y) => new THREE.Vector2(x, y), A = api.dock(a), Bd = api.dock(b), cA = islands[a].grp.position, cB = islands[b].grp.position;
    const fA = V(Math.cos(hA), -Math.sin(hA)), fB = V(Math.cos(hB), -Math.sin(hB)), uA = V(islands[a].u[0], islands[a].u[1]), uB = V(islands[b].u[0], islands[b].u[1]);
    const P2 = (o, f, kf, u, ku) => V(o.x + f.x * kf + u.x * ku, o.z + f.y * kf + u.y * ku);
    const S0 = P2(A, fA, 3.4, uA, 0.6), e1 = P2(Bd, fB, -12, uB, 3.4), e0 = P2(Bd, fB, -6, uB, 1.4);
    // grade de navegação
    const CELL = 2.6, X0 = -80, Z0 = -95, NX = Math.ceil(160 / CELL), NZ = Math.ceil(190 / CELL);
    const free = (x, z) => { for (let k = 0; k < islands.length; k++) { const c = islands[k].grp.position, ox = x - c.x, oz = z - c.z, od = Math.hypot(ox, oz); if (od > 30) continue;
      let m = 5.6; if (k === a || k === b) { const d0 = Math.hypot(x - (k === a ? A.x : Bd.x), z - (k === a ? A.z : Bd.z)); m = 3.2 + 2.4 * clamp(d0 / 14, 0, 1); }
      if (od < rr(Math.atan2(oz, ox), islands[k].R, islands[k].seed) + m) return false; } return true; };
    const cx = (x) => clamp(Math.round((x - X0) / CELL), 0, NX - 1), cz = (z) => clamp(Math.round((z - Z0) / CELL), 0, NZ - 1), px = (i) => X0 + i * CELL, pz = (j) => Z0 + j * CELL;
    const nearestFree = (x, z) => { let bi = cx(x), bj = cz(z); if (free(px(bi), pz(bj))) return [bi, bj]; for (let r = 1; r < 14; r++) for (let di = -r; di <= r; di++) for (let dj = -r; dj <= r; dj++) { if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue; const i = bi + di, j = bj + dj; if (i >= 0 && j >= 0 && i < NX && j < NZ && free(px(i), pz(j))) return [i, j]; } return [bi, bj]; };
    const st = nearestFree(S0.x, S0.y), gl = nearestFree(e1.x, e1.y), key = (i, j) => j * NX + i, g = new Map(), came = new Map(), open = [[0, st[0], st[1]]], closed = new Set(), freeCache = new Map();
    const isFree = (i, j) => { const kk = key(i, j); let v = freeCache.get(kk); if (v === undefined) { v = free(px(i), pz(j)); freeCache.set(kk, v); } return v; };
    g.set(key(st[0], st[1]), 0); let found = false;
    while (open.length) {
      let bi = 0; for (let q = 1; q < open.length; q++) if (open[q][0] < open[bi][0]) bi = q; const [, i, j] = open.splice(bi, 1)[0], kk = key(i, j);
      if (closed.has(kk)) continue; closed.add(kk); if (i === gl[0] && j === gl[1]) { found = true; break; }
      for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NX || nj >= NZ || !isFree(ni, nj)) continue;
        if (di && dj && (!isFree(i + di, j) || !isFree(i, j + dj))) continue; const nk = key(ni, nj), ng = g.get(kk) + (di && dj ? 1.4142 : 1); if (g.has(nk) && g.get(nk) <= ng) continue; g.set(nk, ng); came.set(nk, kk);
        open.push([ng + Math.hypot(ni - gl[0], nj - gl[1]), ni, nj]); }
    }
    let route = [S0.clone()];
    if (found) { const seq = []; let k = key(gl[0], gl[1]); while (k !== undefined) { seq.push(V(px(k % NX), pz(Math.floor(k / NX)))); k = came.get(k); } seq.reverse();
      // encurtamento por linha de visada
      const clear = (p, q) => { const L = p.distanceTo(q), n = Math.ceil(L / 1.2); for (let t = 0; t <= n; t++) if (!free(lerp(p.x, q.x, t / n), lerp(p.y, q.y, t / n))) return false; return true; };
      let cur = S0.clone(), idx = 0; const out = [];
      while (idx < seq.length) { let far = idx; for (let q = seq.length - 1; q > idx; q--) if (clear(cur, seq[q])) { far = q; break; } out.push(seq[far]); cur = seq[far]; idx = far + 1; }
      route = route.concat(out); }
    route.push(e1.clone());
    route.push(e1.clone());
    // polilinha de referência: cais A -> proa -> rota livre -> alinhamento -> cais B
    const ref = [V(A.x, A.z)].concat(route, [e0, P2(Bd, fB, -2.0, uB, 0), V(Bd.x, Bd.z)]);
    const cum = [0]; for (let i = 1; i < ref.length; i++) cum.push(cum[i - 1] + ref[i].distanceTo(ref[i - 1]));
    const atS = (sv) => { sv = clamp(sv, 0, cum[cum.length - 1]); let i = 1; while (i < cum.length - 1 && cum[i] < sv) i++; return ref[i - 1].clone().lerp(ref[i], (sv - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1])); };
    // perseguição de pura com raio de giro limitado: o barco "pilota" a polilinha
    const STEP = 0.5, MAXT = STEP / 3.8, LA = 7, total = cum[cum.length - 1];
    let pos = V(A.x, A.z), h = hA, prog = 0; const pts = [pos.clone()];
    for (let it = 0; it < 900; it++) {
      // avanço de progresso: ponto mais próximo à frente
      let best = prog, bd = 1e9; for (let sv = prog; sv <= Math.min(total, prog + 6); sv += 0.5) { const q = atS(sv), d = q.distanceTo(pos); if (d < bd) { bd = d; best = sv; } } prog = best;
      const left = total - prog; if (left < 0.7 && pos.distanceTo(ref[ref.length - 1]) < 1.2) break;
      const tp = atS(prog + Math.min(LA, Math.max(1.2, left)));
      const want = Math.atan2(-(tp.y - pos.y), tp.x - pos.x); let dh = want - h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); h += clamp(dh, -MAXT, MAXT);
      pos = V(pos.x + Math.cos(h) * STEP, pos.y - Math.sin(h) * STEP); pts.push(pos.clone());
    }
    pts.push(V(Bd.x, Bd.z));
    const res = [pts[0]]; let acc = 0; for (let i = 1; i < pts.length - 1; i++) { acc += pts[i].distanceTo(pts[i - 1]); if (acc >= 2.5) { res.push(pts[i]); acc = 0; } } res.push(pts[pts.length - 1]);
    const ctrl = res;
    const curve = new THREE.CatmullRomCurve3(ctrl.map(p => new THREE.Vector3(p.x, 0, p.y)), false, 'centripetal', 0.5);
    return { at(t) { t = clamp(t, 0, 1); const p = curve.getPointAt(t), tg = curve.getTangentAt(t); return { x: p.x, z: p.z, tx: tg.x, tz: tg.z }; }, len: curve.getLength() };
  };
  api.render = function (ms) {
    const t = ms / 1000; time = t; waterMat.uniforms.uTime.value = t; windU.value = t; ffMat.uniforms.uTime.value = t;
    for (let i = 0; i < N; i++) { const target = (hover === i || focused === i) ? 1 : 0; uBoost[i] += (target - uBoost[i]) * 0.12; }
    const tk = focused >= 0 ? 1 : 0; accentK += (tk - accentK) * 0.08;
    if (focused >= 0) { const is = islands[focused], c = is.grp.position; accentLight.color.copy(accents[focused]); accentLight.position.set(c.x + is.u[0] * 4, 9, c.z + is.u[1] * 4); }
    accentLight.intensity = accentK * 70;
    if (islands[0].extras.beam) islands[0].extras.beam.rotation.y = t * 0.9;
    // barco: balanço
    const bob = Math.sin(t * 1.7) * 0.06, roll = Math.sin(t * 1.3) * 0.035 + boatState.bank, pitch = Math.sin(t * 1.1 + 1) * 0.02;
    boat.group.position.set(boatState.x, bob, boatState.z); boat.group.rotation.set(0, boatState.ry, 0); boat.body.rotation.set(roll, 0, pitch);
    // rastro
    const dummy = new THREE.Object3D(), now = performance.now();
    for (let i = 0; i < WAKE_N; i++) {
      const d = wakeData[i]; if (!d) continue; const a = (now - d.t) / 1500;
      if (a >= 1) { wakeData[i] = null; wake.setMatrixAt(i, zeroM); age[i] = 1; continue; }
      dummy.position.set(d.x, 0.07, d.z); dummy.rotation.set(0, d.a, 0); dummy.scale.set(1.3 + a * 3.4, 1, 0.55 + a * 1.7); dummy.updateMatrix(); wake.setMatrixAt(i, dummy.matrix); age[i] = a;
    }
    wake.instanceMatrix.needsUpdate = true; wakeGeo.attributes.aAge.needsUpdate = true;
    renderer.render(scene, camera);
  };
  api.dispose = function () { renderer.dispose(); };
  api.canvas = canvas; api.info = renderer.info;
  api.layout(false);
  return api;
}
