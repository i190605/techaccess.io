/* ============================================================================
   TECHACCESS PAKISTAN — Hero digital iris
   ----------------------------------------------------------------------------
   A single full-screen fragment shader standing in for a background video: a
   macro eye whose iris is woven from light. Fibres radiate from the pupil and
   drift outward, sparks ride along them, and a ring of binary digits streams
   off the rim into the dark. The pupil breathes and follows the pointer; the
   whole frame drifts in and out like a slow dolly.

   Angular noise is made periodic so there is no seam where the angle wraps.
   Cost: one quad, one draw call, reduced resolution on phones, paused off
   screen. Reduced motion: one still frame. No WebGL: the CSS poster stays.
   ========================================================================== */
(function () {
  "use strict";
  var host = document.querySelector("[data-hv]");
  if (!host) return;
  var canvas = host.querySelector(".hv__bg");
  if (!canvas || !window.THREE) return;
  try {
    var probe = document.createElement("canvas");
    if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))) return;
  } catch (e) { return; }

  var T = window.THREE;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var narrowMQ = window.matchMedia("(max-width: 760px)");
  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch (e) { return; }

  var scene = new T.Scene();
  var camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var uniforms = {
    uTime: { value: 0 },
    uRes: { value: new T.Vector2(1, 1) },
    uMouse: { value: new T.Vector2(0, 0) },
    uCentre: { value: new T.Vector2(0.4, 0) },
    uSize: { value: 0.7 }
  };

  var frag = [
    "precision highp float;",
    "uniform float uTime;",
    "uniform vec2 uRes;",
    "uniform vec2 uMouse;",
    "uniform vec2 uCentre;",
    "uniform float uSize;",
    "",
    "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "",
    "/* value noise whose x axis repeats every `per` units, so a noise field",
    "   laid around the circle meets itself cleanly where the angle wraps */",
    "float pnoise(vec2 p, float per) {",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  float x0 = mod(i.x, per), x1 = mod(i.x + 1.0, per);",
    "  float a = hash(vec2(x0, i.y)), b = hash(vec2(x1, i.y));",
    "  float c = hash(vec2(x0, i.y + 1.0)), d = hash(vec2(x1, i.y + 1.0));",
    "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);",
    "}",
    "float pfbm(vec2 p, float per) {",
    "  float v = 0.0, a = 0.5;",
    "  for (int i = 0; i < 3; i++) { v += a * pnoise(p, per); p *= 2.0; per *= 2.0; a *= 0.5; }",
    "  return v;",
    "}",
    "",
    "void main() {",
    "  vec2 uv = gl_FragCoord.xy / uRes;",
    "  float asp = uRes.x / uRes.y;",
    "  vec2 p = (uv - 0.5) * vec2(asp, 1.0);",
    "  float t = uTime;",
    "",
    "  /* where the eye sits and how big: right of centre on wide screens,",
    "     top-centre on phones so the copy can sit underneath */",
    "  vec2 centre = uCentre;",
    "  float size = uSize;",
    "  float dolly = 1.0 + 0.035 * sin(t * 0.11);",
    "  vec2 q = (p - centre) / (size * dolly);",
    "",
    "  /* the pupil looks toward the pointer: warp the interior toward it */",
    "  vec2 look = uMouse * vec2(0.09, 0.07);",
    "  vec2 qq = q - look * (1.0 - smoothstep(0.0, 0.75, length(q)));",
    "  float r = length(qq);",
    "  float ang = atan(qq.y, qq.x) / 6.2831853 + 0.5;          /* 0..1 around */",
    "  float spin = t * 0.004;",
    "",
    "  float R0 = 0.165 + 0.012 * sin(t * 0.55) + 0.006 * sin(t * 1.7);",
    "  float R1 = 0.62;",
    "  float tt = clamp((r - R0) / (R1 - R0), 0.0, 1.0);",
    "",
    "  vec3 col = vec3(0.010, 0.008, 0.011);",
    "",
    "  /* stroma: two layers of radial fibres flowing slowly outward */",
    "  float f1 = pfbm(vec2((ang + spin) * 64.0, r * 3.0 - t * 0.09), 64.0);",
    "  float f2 = pfbm(vec2((ang - spin) * 160.0, r * 7.0 - t * 0.16), 160.0);",
    "  float f3 = pfbm(vec2((ang + spin * 2.0) * 420.0, r * 14.0 - t * 0.22), 420.0);",
    "  float fib = smoothstep(0.36, 0.85, f1) * 0.7 + smoothstep(0.45, 0.9, f2) * 0.65 + smoothstep(0.5, 0.95, f3) * 0.55;",
    "  /* crypts: darker pockets in the weave */",
    "  float crypt = smoothstep(0.62, 0.78, pfbm(vec2(ang * 24.0, r * 5.0 + 3.0), 24.0));",
    "  float iris = smoothstep(R0 - 0.005, R0 + 0.025, r) * (1.0 - smoothstep(R1 - 0.1, R1 + 0.04, r));",
    "  vec3 hot = vec3(1.0, 0.86, 0.80);",
    "  vec3 red = vec3(1.0, 0.20, 0.27);",
    "  vec3 deep = vec3(0.42, 0.02, 0.07);",
    "  vec3 ic = mix(hot, red, smoothstep(0.0, 0.32, tt));",
    "  ic = mix(ic, deep, smoothstep(0.35, 1.0, tt));",
    "  col += ic * fib * iris * (1.2 - tt * 0.5) * (1.0 - crypt * 0.55);",
    "  col += mix(red, deep, tt) * iris * (0.10 + 0.22 * f1);",
    "",
    "  /* collarette: a bright ring just outside the pupil */",
    "  col += vec3(1.0, 0.42, 0.46) * exp(-pow((r - R0 - 0.035) / 0.022, 2.0)) * 0.55;",
    "",
    "  /* sparks riding the fibres outward */",
    "  vec2 g = vec2((ang + spin) * 240.0, r * 30.0 - t * 0.7);",
    "  vec2 gi = floor(g);",
    "  vec2 gf = fract(g) - 0.5;",
    "  float h = hash(gi);",
    "  float spark = step(0.84, h) * smoothstep(0.24, 0.0, length(gf * vec2(1.0, 1.7)));",
    "  float tw = 0.5 + 0.5 * sin(t * 3.0 + h * 50.0);",
    "  vec3 sc = mix(vec3(1.0, 0.45, 0.5), vec3(1.0, 0.92, 0.86), hash(gi + 7.0));",
    "  col += sc * spark * tw * smoothstep(R0, R0 + 0.05, r) * (1.0 - smoothstep(R1 + 0.05, R1 + 0.35, r)) * 1.5;",
    "",
    "  /* limbal ring: darker rim that defines the iris edge */",
    "  col *= 1.0 - 0.55 * exp(-pow((r - R1) / 0.045, 2.0));",
    "",
    "  /* data threads leaving the rim */",
    "  float th = pfbm(vec2(ang * 96.0, r * 1.6 - t * 0.12), 96.0);",
    "  float thread = smoothstep(0.62, 0.95, th) * smoothstep(R1, R1 + 0.08, r) * (1.0 - smoothstep(0.9, 1.4, r));",
    "  col += vec3(0.95, 0.14, 0.22) * thread * 0.55;",
    "",
    "  /* binary digits streaming outward from the rim */",
    "  float N = 150.0;",
    "  vec2 dc = vec2(ang * N, r * 17.0 - t * 0.45);",
    "  vec2 di = floor(dc);",
    "  vec2 df = fract(dc) - 0.5;",
    "  float dh = hash(di + 11.0);",
    "  float one = step(abs(df.x), 0.06) * step(abs(df.y), 0.26);",
    "  float zero = smoothstep(0.14, 0.0, abs(length(df / vec2(0.17, 0.26)) - 1.0));",
    "  float glyph = mix(one, zero, step(0.5, hash(di + 3.0)));",
    "  float band = smoothstep(R1 + 0.01, R1 + 0.08, r) * (1.0 - smoothstep(0.82, 1.12, r));",
    "  float blink = step(0.35, fract(hash(di + 5.0) + t * 0.35));",
    "  col += vec3(1.0, 0.32, 0.4) * glyph * step(0.45, dh) * band * blink * 0.9;",
    "",
    "  /* soft red bloom around the whole eye */",
    "  col += vec3(0.45, 0.03, 0.07) * exp(-r * 2.4) * 0.3 * smoothstep(R0, R0 + 0.1, r);",
    "",
    "  /* pupil: near-black with a faint red depth and a catchlight */",
    "  float pupil = 1.0 - smoothstep(R0 - 0.008, R0 + 0.008, r);",
    "  vec3 pc = vec3(0.004, 0.002, 0.003) + vec3(0.2, 0.02, 0.04) * smoothstep(R0 * 0.55, R0, r) * 0.35;",
    "  col = mix(col, pc, pupil);",
    "  col += vec3(1.0, 0.95, 0.95) * smoothstep(0.03, 0.0, length(qq - vec2(-0.055, 0.06))) * 0.28;",
    "",
    "  /* stray particles drifting across the dark */",
    "  vec2 bp = p * 9.0 + vec2(t * 0.05, -t * 0.03);",
    "  vec2 bi = floor(bp);",
    "  vec2 bf = fract(bp) - 0.5;",
    "  float bh = hash(bi + 23.0);",
    "  col += vec3(1.0, 0.3, 0.38) * step(0.9, bh) * smoothstep(0.12, 0.0, length(bf)) * 0.25 * (0.5 + 0.5 * sin(t + bh * 30.0));",
    "",
    "  /* filmic tone, vignette, grain */",
    "  col = 1.0 - exp(-col * 1.4);",
    "  float vig = smoothstep(1.3, 0.3, length((uv - 0.5) * vec2(asp * 0.8, 1.0)));",
    "  col *= mix(0.5, 1.0, vig);",
    "  col += (hash(gl_FragCoord.xy + fract(t * 0.7) * 113.0) - 0.5) * 0.03;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");

  var mat = new T.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: frag,
    depthWrite: false,
    depthTest: false
  });
  scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), mat));

  function scaleFor(w) {
    var dpr = window.devicePixelRatio || 1;
    return w <= 760 ? Math.min(dpr, 1.5) * 0.7 : Math.min(dpr, 1.25);
  }
  function resize() {
    var r = host.getBoundingClientRect();
    var w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
    var s = scaleFor(w);
    renderer.setPixelRatio(s);
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * s, h * s);
    /* place the eye from layout, in CSS pixels: right of the copy on wide
       screens; on phones, centred in the band reserved above the copy */
    var cx, cy, rad;
    if (narrowMQ.matches) {
      var nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 64;
      cx = w * 0.5; cy = nav + w * 0.36; rad = w * 0.34;
    } else {
      cx = w * 0.73; cy = h * 0.5; rad = Math.min(h * 0.46, w * 0.3);
    }
    uniforms.uCentre.value.set((cx / w - 0.5) * (w / h), 0.5 - cy / h);
    uniforms.uSize.value = (rad / h) / 0.62;
  }

  var tm = new T.Vector2(0, 0);
  window.addEventListener("pointermove", function (e) {
    var r = host.getBoundingClientRect();
    if (e.clientY > r.bottom) return;
    tm.set(Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width - 0.5)) * 2,
           Math.max(-1, Math.min(1, -((e.clientY - r.top) / r.height - 0.5))) * 2);
  }, { passive: true });

  var running = false, visible = true, last = performance.now();
  function draw(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    uniforms.uTime.value += dt;
    uniforms.uMouse.value.lerp(tm, Math.min(1, dt * 2.2));
    renderer.render(scene, camera);
  }
  function loop(now) {
    if (!running) return;
    draw(now);
    requestAnimationFrame(loop);
  }
  function play() {
    if (running || reduced || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  function pause() { running = false; }

  resize();
  uniforms.uTime.value = 12.0;
  renderer.render(scene, camera);
  host.classList.add("is-live");

  new ResizeObserver(function () { resize(); if (!running) renderer.render(scene, camera); }).observe(host);
  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible) play(); else pause();
  }, { threshold: 0.01 }).observe(host);
  document.addEventListener("visibilitychange", function () { if (document.hidden) pause(); else play(); });
  play();
})();
