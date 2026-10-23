/*
 * PatternWaves — motor WebGL sem dependências.
 * Implementação própria da Island com a mesma API de props do PatternWaves
 * (React Bits). O código-fonte original não foi enviado no pacote; para trocar
 * pelo original basta substituir PatternWaves.jsx mantendo as props.
 */

export const DEFAULTS = {
  preset: 'silk',
  color: '#7800ff',
  backgroundColor: '#120f17',
  fade: 'edges',            // 'none' | 'edges' | 'center' | 'top' | 'bottom'
  interactive: true,
  cursorSize: 50,
  cursorStrength: 0.6,
  pattern: 'dot',           // 'dot' | 'square' | 'ascii'
  wave: 'silk',             // 'silk' | 'ripple' | 'grain'
  spacing: 9,
  markSize: 0.95,
  depth: 0.95,
  light: 0,
  shine: 0.8,
  contrast: 1.2,
  speed: 0.35,
  scale: 1,
  direction: 20,
  opacity: 1,
  fadeSize: 0.5,
  characters: '.:-=+*#%@',
  intro: true,
  paused: false,
  dpr: 1.75,
};

const PRESETS = {
  silk: {},
  ripple: { wave: 'ripple', speed: 0.5, depth: 0.85 },
  grain: { wave: 'grain', spacing: 7, markSize: 0.8 },
};

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2  uRes;
uniform float uTime;
uniform float uSpacing;
uniform float uMark;
uniform float uDepth;
uniform float uLight;
uniform float uShine;
uniform float uContrast;
uniform float uScale;
uniform float uDir;
uniform vec3  uColor;
uniform vec3  uBg;
uniform float uOpacity;
uniform float uFadeMode;
uniform float uFadeSize;
uniform vec2  uMouse;
uniform float uCursorSize;
uniform float uCursorStrength;
uniform float uIntro;
uniform float uPattern;
uniform float uWave;
uniform float uCharCount;
uniform sampler2D uAtlas;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float field(vec2 c){
  vec2 d = vec2(cos(uDir), sin(uDir));
  vec2 n = vec2(-d.y, d.x);
  float base = min(uRes.x, uRes.y);
  vec2 q = c / base * (3.2 / max(uScale, 0.05));
  float t = uTime;
  if (uWave > 1.5) {
    // grain
    float g = sin(dot(q, d) * 5.0 - t * 1.3) * 0.5 + 0.5;
    return clamp(g * 0.6 + hash(floor(c / uSpacing)) * 0.4, 0.0, 1.0);
  }
  if (uWave > 0.5) {
    // ripple
    float r = length(q - vec2(1.6, 0.9));
    return 0.5 + 0.5 * sin(r * 7.0 - t * 1.6 + sin(dot(q, n) * 2.0 + t * 0.4) * 0.8);
  }
  // silk: dobras de tecido fluindo ao longo da direção
  q += 0.32 * vec2(sin(q.y * 2.1 + t * 0.7), cos(q.x * 1.7 - t * 0.6));
  float a = dot(q, d);
  float b = dot(q, n);
  float h = sin(a * 4.2 + sin(b * 2.6 + t * 0.8) * 1.7 - t * 1.1);
  h += 0.45 * sin(a * 9.0 - b * 3.0 + t * 0.9 + h * 1.2);
  return clamp(0.5 + 0.34 * h, 0.0, 1.0);
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(p / uSpacing);
  vec2 center = (cell + 0.5) * uSpacing;
  vec2 local = (p - center) / uSpacing;

  float h = field(center);

  // cursor: onda que cresce ao redor do ponteiro
  float md = length(center - uMouse);
  float cs = max(uCursorSize, 1.0);
  float k = (1.0 - smoothstep(0.0, cs * 2.2, md)) * uCursorStrength;
  h = clamp(h + k * 1.35 * (0.6 + 0.4 * sin(md * 0.09 - uTime * 6.0)), 0.0, 1.0);

  h = clamp((h - 0.5) * uContrast + 0.5, 0.0, 1.0);

  // intro: varredura diagonal com ruído por célula
  float prog = uIntro * 1.7 - ((center.x / uRes.x) * 0.65 + (1.0 - center.y / uRes.y) * 0.2 + hash(cell) * 0.35);
  float intro = smoothstep(0.0, 0.35, prog);

  float rad = 0.5 * uMark * mix(1.0 - uDepth, 1.0, h) * intro;

  float shape = 0.0;
  vec3 normal = vec3(0.0, 0.0, 1.0);
  float aa = 1.2 / uSpacing;
  if (uPattern > 1.5) {
    float idx = floor(clamp(h, 0.0, 0.999) * uCharCount);
    vec2 guv = vec2((idx + (local.x * uMark + 0.5)) / uCharCount, 0.5 - local.y * uMark);
    shape = texture2D(uAtlas, guv).a * intro;
  } else if (uPattern > 0.5) {
    float s = max(abs(local.x), abs(local.y));
    shape = 1.0 - smoothstep(rad - aa, rad + aa, s);
    normal = normalize(vec3(local * 1.4, 0.8));
  } else {
    float r = length(local);
    shape = 1.0 - smoothstep(rad - aa, rad + aa, r);
    vec2 nn = local / max(rad, 0.001);
    normal = normalize(vec3(nn, sqrt(max(0.0, 1.0 - dot(nn, nn)))));
  }

  // luz direcional e brilho especular (a luz segue a direção das ondas)
  vec3 ld = normalize(vec3(-cos(uDir) * 0.6, sin(uDir) * 0.6, 0.8));
  float diff = dot(normal, ld) * 0.5 + 0.5;
  vec3 col = uColor * mix(0.38, 1.0, h);
  col *= mix(1.0, 0.55 + 0.9 * diff, uLight);
  vec3 hv = normalize(ld + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(normal, hv), 0.0), 18.0) * smoothstep(0.35, 1.0, h);
  col += vec3(1.0, 0.96, 1.0) * spec * uShine * 0.55;
  col += uColor * pow(h, 3.0) * uShine * 0.25;

  // fade nas bordas
  vec2 nuv = p / uRes;
  float edge = min(min(nuv.x, 1.0 - nuv.x), min(nuv.y, 1.0 - nuv.y));
  float fs = max(uFadeSize, 0.001) * 0.5;
  float fade = 1.0;
  if (uFadeMode > 3.5) fade = smoothstep(0.0, fs * 2.0, nuv.y);          // bottom visível
  else if (uFadeMode > 2.5) fade = smoothstep(0.0, fs * 2.0, 1.0 - nuv.y); // top visível
  else if (uFadeMode > 1.5) fade = smoothstep(0.0, fs * 1.6, length(nuv - 0.5) * 1.4);  // center some
  else if (uFadeMode > 0.5) fade = smoothstep(0.0, fs, edge);              // edges somem

  float a = shape * fade * uOpacity;
  gl_FragColor = vec4(mix(uBg, col, a), 1.0);
}
`;

function hexToRgb(hex) {
  let h = String(hex || '#000').trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const FADE_MODES = { none: 0, edges: 1, center: 2, top: 3, bottom: 4 };
const PATTERNS = { dot: 0, square: 1, ascii: 2 };
const WAVES = { silk: 0, ripple: 1, grain: 2 };

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('PatternWaves shader: ' + log);
  }
  return s;
}

/**
 * Cria o efeito dentro de `container`. Retorna { update, destroy }.
 * Retorna null se WebGL não estiver disponível (o fundo CSS permanece).
 */
export function createPatternWaves(container, initial) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return null;

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.error(error);
    return null;
  }
  gl.useProgram(program);
  container.appendChild(canvas);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  [
    'uRes', 'uTime', 'uSpacing', 'uMark', 'uDepth', 'uLight', 'uShine', 'uContrast', 'uScale', 'uDir',
    'uColor', 'uBg', 'uOpacity', 'uFadeMode', 'uFadeSize', 'uMouse', 'uCursorSize', 'uCursorStrength',
    'uIntro', 'uPattern', 'uWave', 'uCharCount', 'uAtlas',
  ].forEach((n) => { U[n] = gl.getUniformLocation(program, n); });

  const atlas = gl.createTexture();
  let atlasChars = null;
  let charCount = 1;
  function buildAtlas(chars) {
    const list = Array.from(chars && chars.length ? chars : '.');
    const size = 48;
    const c = document.createElement('canvas');
    c.width = size * list.length;
    c.height = size;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(size * 0.9)}px ui-monospace, Menlo, Consolas, monospace`;
    list.forEach((ch, i) => ctx.fillText(ch, i * size + size / 2, size / 2 + 2));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    charCount = list.length;
    atlasChars = chars;
  }

  let o = { ...DEFAULTS };
  let dpr = 1;
  let width = 1;
  let height = 1;
  let time = 0;
  let introStart = null;
  let introValue = 1;
  let last = 0;
  let raf = 0;
  let visible = true;
  let destroyed = false;
  const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: 0, target: 0 };

  function apply(props) {
    const preset = PRESETS[(props && props.preset) || o.preset] || {};
    const next = { ...DEFAULTS, ...preset };
    Object.keys(props || {}).forEach((k) => { if (props[k] !== undefined) next[k] = props[k]; });
    const hadIntro = o.intro;
    o = next;
    if (o.pattern === 'ascii' && atlasChars !== o.characters) buildAtlas(o.characters);
    if (!introStart && o.intro && !hadIntro) introStart = null;
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, o.dpr || 1.75);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  }

  function draw(now) {
    if (destroyed) return;
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (!o.paused) time += dt * o.speed;

    if (o.intro) {
      if (introStart === null) introStart = now;
      const t = Math.min(1, (now - introStart) / 2600);
      introValue = 1 - Math.pow(1 - t, 3);
    } else {
      introValue = 1;
    }

    mouse.active += (mouse.target - mouse.active) * Math.min(1, dt * 6);
    mouse.x += (mouse.tx - mouse.x) * Math.min(1, dt * 14);
    mouse.y += (mouse.ty - mouse.y) * Math.min(1, dt * 14);

    resize();
    const c = hexToRgb(o.color);
    const b = hexToRgb(o.backgroundColor);
    gl.uniform2f(U.uRes, width, height);
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uSpacing, Math.max(2, o.spacing * dpr));
    gl.uniform1f(U.uMark, o.markSize);
    gl.uniform1f(U.uDepth, o.depth);
    gl.uniform1f(U.uLight, o.light);
    gl.uniform1f(U.uShine, o.shine);
    gl.uniform1f(U.uContrast, o.contrast);
    gl.uniform1f(U.uScale, o.scale);
    gl.uniform1f(U.uDir, (o.direction * Math.PI) / 180);
    gl.uniform3f(U.uColor, c[0], c[1], c[2]);
    gl.uniform3f(U.uBg, b[0], b[1], b[2]);
    gl.uniform1f(U.uOpacity, o.opacity);
    gl.uniform1f(U.uFadeMode, FADE_MODES[o.fade] !== undefined ? FADE_MODES[o.fade] : 1);
    gl.uniform1f(U.uFadeSize, o.fadeSize);
    gl.uniform2f(U.uMouse, mouse.x * dpr, mouse.y * dpr);
    gl.uniform1f(U.uCursorSize, o.cursorSize * dpr);
    gl.uniform1f(U.uCursorStrength, o.interactive ? o.cursorStrength * mouse.active : 0);
    gl.uniform1f(U.uIntro, introValue);
    gl.uniform1f(U.uPattern, PATTERNS[o.pattern] !== undefined ? PATTERNS[o.pattern] : 0);
    gl.uniform1f(U.uWave, WAVES[o.wave] !== undefined ? WAVES[o.wave] : 0);
    gl.uniform1f(U.uCharCount, charCount);
    gl.uniform1i(U.uAtlas, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    schedule();
  }

  function schedule() {
    if (destroyed || raf || !visible || document.hidden) return;
    // Pausado e intro concluída: um único quadro estático basta.
    if (o.paused && introValue >= 1 && mouse.active < 0.01 && mouse.target === 0 && frameDrawn) return;
    raf = requestAnimationFrame((t) => { frameDrawn = true; draw(t); });
  }
  let frameDrawn = false;

  function onMove(e) {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    if (!inside) { mouse.target = 0; return; }
    if (mouse.active < 0.02) { mouse.x = x; mouse.y = y; }
    mouse.tx = x;
    mouse.ty = y;
    mouse.target = 1;
  }
  function onLeave() { mouse.target = 0; }
  function onVisibility() { last = 0; schedule(); }

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);
  document.addEventListener('visibilitychange', onVisibility);

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        visible = entries.some((en) => en.isIntersecting);
        if (visible) { last = 0; schedule(); } else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      })
    : null;
  if (io) io.observe(container);
  const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { frameDrawn = false; schedule(); }) : null;
  if (ro) ro.observe(container);

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); if (raf) cancelAnimationFrame(raf); raf = 0; });

  apply(initial);
  schedule();

  return {
    update(props) { apply(props); frameDrawn = false; schedule(); },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      canvas.remove();
    },
  };
}
