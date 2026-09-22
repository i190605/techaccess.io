/* ============================================================================
   TECHACCESS PAKISTAN — Sector Topologies
   ----------------------------------------------------------------------------
   The five sectors we serve, each rendered as the shape its infrastructure
   actually takes. Selecting a sector morphs one point cloud into the next.

   The shapes are the argument, not decoration:

     Telecommunication  a wide spanning mesh          — national coverage
     Financial Services mirrored concentric rings     — every node has a twin
     Government         a strict tier hierarchy       — layered governance
     Education          distributed campus clusters   — many sites, loose links
     Healthcare         a dense hub inside a shell    — protected core

   One geometry, five sets of target positions, lerped between. The edge list
   swaps at the midpoint of the transition while the lines are faded out, so
   the topology reconfigures without a visible pop.

   Degrades the same way the rest of the site does: no WebGL, reduced motion or
   a viewport too narrow and the plain card grid below is what shows. The list
   beside the canvas is real HTML throughout, so the copy is always readable.
   ========================================================================== */
(function () {
  "use strict";

  var host = document.querySelector("[data-topo]");
  if (!host) return;

  var canvas = host.querySelector(".topo-canvas");
  var stage = host.querySelector(".topo-stage");
  if (!canvas || !stage) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function fallback(reason) {
    host.setAttribute("data-topo-mode", "fallback");
    if (reason) host.setAttribute("data-topo-reason", reason);
  }

  if (!window.THREE) return fallback("three-missing");
  try {
    var probe = document.createElement("canvas");
    if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))) {
      return fallback("no-webgl");
    }
  } catch (err) { return fallback("no-webgl"); }

  var T = window.THREE;
  var staticMode = reduced.matches;

  /* ------------------------------------------------------------------ data */
  var SECTORS = [
    { key: "telecom",    name: "Telecommunication", topo: "Spanning mesh" },
    { key: "financial",  name: "Financial Services", topo: "Mirrored core" },
    { key: "government", name: "Government",         topo: "Tiered hierarchy" },
    { key: "education",  name: "Education",          topo: "Campus clusters" },
    { key: "healthcare", name: "Healthcare",         topo: "Protected hub" }
  ];

  var N = 260;                 /* nodes, constant across every topology */
  var MAX_EDGES = 420;

  /* Deterministic pseudo-random, so the shapes are identical every load. */
  function rnd(i, salt) {
    var x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  /* ------------------------------------------------------------ topologies
     Each builder fills `pos` (N*3) and returns an edge list of index pairs. */

  function buildSpanningMesh(pos) {
    /* A wide, gently domed plane. Long links, even coverage. */
    var cols = 20, rows = Math.ceil(N / cols), e = [];
    for (var i = 0; i < N; i++) {
      var c = i % cols, r = Math.floor(i / cols);
      var x = (c / (cols - 1) - 0.5) * 9.2 + (rnd(i, 1) - 0.5) * 0.28;
      var z = (r / (rows - 1) - 0.5) * 5.4 + (rnd(i, 2) - 0.5) * 0.28;
      var y = -(x * x * 0.035 + z * z * 0.05) + 0.9 + (rnd(i, 3) - 0.5) * 0.18;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      if (c < cols - 1) e.push(i, i + 1);
      if (r < rows - 1 && i + cols < N) e.push(i, i + cols);
    }
    return e;
  }

  function buildMirroredCore(pos) {
    /* Two concentric rings, each node paired with its mirror: primary and DR. */
    var e = [], half = Math.floor(N / 2);
    for (var i = 0; i < N; i++) {
      var k = i % half;
      var side = i < half ? 1 : -1;
      var ring = k % 2 === 0 ? 2.0 : 3.3;
      var a = (k / half) * Math.PI * 2 * 3;
      pos[i * 3] = Math.cos(a) * ring;
      pos[i * 3 + 1] = side * (0.9 + (k % 2) * 0.5);
      pos[i * 3 + 2] = Math.sin(a) * ring;
      if (k < half - 1) e.push(i, i + 1);
      if (side === 1 && i + half < N && k % 3 === 0) e.push(i, i + half);
    }
    return e;
  }

  function buildTierHierarchy(pos) {
    /* 1 root, then widening tiers. Every node links to its parent. */
    var tiers = [1, 4, 14, 40, 90, N - 149], e = [], idx = 0, prevStart = 0, prevCount = 0;
    for (var t = 0; t < tiers.length; t++) {
      var count = tiers[t], start = idx;
      for (var j = 0; j < count && idx < N; j++, idx++) {
        var a = count === 1 ? 0 : (j / count) * Math.PI * 2;
        var rad = t * 0.95;
        pos[idx * 3] = Math.cos(a) * rad + (rnd(idx, 4) - 0.5) * 0.2;
        pos[idx * 3 + 1] = 2.6 - t * 1.05;
        pos[idx * 3 + 2] = Math.sin(a) * rad * 0.6 + (rnd(idx, 5) - 0.5) * 0.2;
        if (t > 0 && prevCount > 0) {
          e.push(idx, prevStart + Math.floor(j * prevCount / count));
        }
      }
      prevStart = start; prevCount = count;
    }
    return e;
  }

  function buildCampusClusters(pos) {
    /* Five dense clusters on a ring, loosely tied to each other. */
    var groups = 5, per = Math.floor(N / groups), e = [], heads = [];
    for (var g = 0; g < groups; g++) {
      var ga = (g / groups) * Math.PI * 2;
      var cx = Math.cos(ga) * 3.4, cz = Math.sin(ga) * 3.4;
      var head = g * per;
      heads.push(head);
      for (var j = 0; j < per; j++) {
        var i = g * per + j;
        if (i >= N) break;
        var a = rnd(i, 6) * Math.PI * 2, r = Math.pow(rnd(i, 7), 0.6) * 1.25;
        pos[i * 3] = cx + Math.cos(a) * r;
        pos[i * 3 + 1] = 0.6 + (rnd(i, 8) - 0.5) * 1.5;
        pos[i * 3 + 2] = cz + Math.sin(a) * r;
        if (j > 0 && j % 2 === 0) e.push(i, head);
      }
    }
    for (var h = 0; h < heads.length; h++) e.push(heads[h], heads[(h + 1) % heads.length]);
    for (var rest = groups * per; rest < N; rest++) {
      pos[rest * 3] = 0; pos[rest * 3 + 1] = 0.6; pos[rest * 3 + 2] = 0;
    }
    return e;
  }

  function buildProtectedHub(pos) {
    /* A dense core wrapped in a sparse shell; spokes bind the two. */
    var coreCount = Math.floor(N * 0.42), e = [];
    for (var i = 0; i < N; i++) {
      var inCore = i < coreCount;
      var r = inCore ? Math.pow(rnd(i, 9), 0.5) * 1.35 : 3.15 + rnd(i, 10) * 0.25;
      var theta = rnd(i, 11) * Math.PI * 2;
      var phi = Math.acos(2 * rnd(i, 12) - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.7 + 0.7;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      if (inCore && i % 3 === 0) e.push(i, (i * 7) % coreCount);
      if (!inCore && i % 2 === 0) e.push(i, i % coreCount);
    }
    return e;
  }

  var BUILDERS = [
    buildSpanningMesh, buildMirroredCore, buildTierHierarchy,
    buildCampusClusters, buildProtectedHub
  ];

  /* Precompute every layout once. */
  var LAYOUTS = BUILDERS.map(function (fn) {
    var p = new Float32Array(N * 3);
    var edges = fn(p);
    if (edges.length > MAX_EDGES * 2) edges = edges.slice(0, MAX_EDGES * 2);
    return { pos: p, edges: edges };
  });

  /* ---------------------------------------------------------------- scene */
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(46, 1, 0.1, 100);
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  var palette = { node: new T.Color(0xffffff), edge: new T.Color(0x8a8a9c), hot: new T.Color(0xe11d2e) };

  function readPalette() {
    var light = document.documentElement.getAttribute("data-theme") === "light";
    var cs = getComputedStyle(document.documentElement);
    var red = (cs.getPropertyValue("--red") || "#e11d2e").trim();
    try { palette.hot.set(red); } catch (e) { palette.hot.set(0xe11d2e); }
    palette.node.set(light ? 0x15151c : 0xffffff);
    palette.edge.set(light ? 0x9a9aac : 0x6d6d80);
    if (nodeMat) nodeMat.needsUpdate = true;
  }

  /* Round sprite so nodes read as points of light rather than squares. */
  function dotTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d");
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.45, "rgba(255,255,255,0.85)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.beginPath(); g.arc(32, 32, 32, 0, Math.PI * 2); g.fill();
    return new T.CanvasTexture(c);
  }

  var current = new Float32Array(N * 3);
  var from = new Float32Array(N * 3);
  var to = new Float32Array(N * 3);
  var colors = new Float32Array(N * 3);
  current.set(LAYOUTS[0].pos); from.set(LAYOUTS[0].pos); to.set(LAYOUTS[0].pos);

  var nodeGeo = new T.BufferGeometry();
  nodeGeo.setAttribute("position", new T.BufferAttribute(current, 3));
  nodeGeo.setAttribute("color", new T.BufferAttribute(colors, 3));

  var nodeMat = new T.PointsMaterial({
    size: 0.085, sizeAttenuation: true, map: dotTexture(),
    transparent: true, depthWrite: false, vertexColors: true, opacity: 0.95
  });
  var points = new T.Points(nodeGeo, nodeMat);
  scene.add(points);

  var edgePos = new Float32Array(MAX_EDGES * 2 * 3);
  var edgeGeo = new T.BufferGeometry();
  edgeGeo.setAttribute("position", new T.BufferAttribute(edgePos, 3));
  var edgeMat = new T.LineBasicMaterial({ transparent: true, opacity: 0.28 });
  var lines = new T.LineSegments(edgeGeo, edgeMat);
  scene.add(lines);

  readPalette();
  new MutationObserver(readPalette).observe(document.documentElement, {
    attributes: true, attributeFilter: ["data-theme"]
  });

  /* ---------------------------------------------------------------- state */
  var active = 0;              /* sector currently shown */
  var edgeSet = LAYOUTS[0].edges;
  var pendingEdges = null;
  var morph = 1;               /* 0 = at `from`, 1 = settled on `to` */
  var W = 0, H = 0, spin = 0;
  var pX = 0, pY = 0, tX = 0, tY = 0;
  var running = false, rafId = null, onScreen = false;
  var clock = new T.Clock();

  function writeEdges() {
    var n = Math.min(edgeSet.length / 2, MAX_EDGES);
    for (var k = 0; k < n; k++) {
      var a = edgeSet[k * 2] * 3, b = edgeSet[k * 2 + 1] * 3;
      edgePos[k * 6] = current[a];
      edgePos[k * 6 + 1] = current[a + 1];
      edgePos[k * 6 + 2] = current[a + 2];
      edgePos[k * 6 + 3] = current[b];
      edgePos[k * 6 + 4] = current[b + 1];
      edgePos[k * 6 + 5] = current[b + 2];
    }
    edgeGeo.setDrawRange(0, n * 2);
    edgeGeo.attributes.position.needsUpdate = true;
  }

  /* ------------------------------------------------------------- selection */
  var items = Array.prototype.slice.call(host.querySelectorAll("[data-topo-item]"));
  var elTopo = host.querySelector("[data-topo-name]");

  function select(i, instant) {
    if (i === active && morph >= 1) return;
    active = i;

    from.set(current);
    to.set(LAYOUTS[i].pos);
    pendingEdges = LAYOUTS[i].edges;
    morph = instant || staticMode ? 1 : 0;

    if (morph >= 1) {
      current.set(to);
      edgeSet = pendingEdges;
      pendingEdges = null;
      nodeGeo.attributes.position.needsUpdate = true;
      writeEdges();
    }

    items.forEach(function (el, k) {
      var on = k === i;
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.setAttribute("tabindex", on ? "0" : "-1");
    });
    host.querySelectorAll("[data-topo-panel]").forEach(function (p, k) {
      p.classList.toggle("is-active", k === i);
    });
    if (elTopo) elTopo.textContent = SECTORS[i].topo;

    if (staticMode) renderOnce();
  }

  items.forEach(function (el, i) {
    el.addEventListener("click", function () { select(i); });
    el.addEventListener("mouseenter", function () { if (!staticMode) select(i); });
    el.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1
            : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = (i + d + items.length) % items.length;
      select(next);
      items[next].focus();
    });
  });

  stage.addEventListener("pointermove", function (e) {
    var r = stage.getBoundingClientRect();
    tX = (e.clientX - r.left) / r.width - 0.5;
    tY = (e.clientY - r.top) / r.height - 0.5;
  });
  stage.addEventListener("pointerleave", function () { tX = tY = 0; });

  /* ------------------------------------------------------------------ loop */
  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.min(r.width, 4000); H = Math.min(r.height, 3000);
    if (W < 2 || H < 2) return false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    return true;
  }

  var easeInOut = function (t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  function step(dt, snap) {
    var t = snap ? 0 : clock.getElapsedTime();

    if (morph < 1) {
      morph = Math.min(1, morph + dt / 0.9);
      var m = easeInOut(morph);
      for (var i = 0; i < N * 3; i++) current[i] = from[i] + (to[i] - from[i]) * m;
      nodeGeo.attributes.position.needsUpdate = true;
      /* Swap the wiring while the lines are at their faintest. */
      if (pendingEdges && morph > 0.5) { edgeSet = pendingEdges; pendingEdges = null; }
      edgeMat.opacity = 0.28 * (1 - Math.sin(morph * Math.PI) * 0.85);
    } else {
      edgeMat.opacity = 0.28;
    }

    /* Colour: the nearer a node is to the structure's centre, the hotter. */
    for (var n = 0; n < N; n++) {
      var x = current[n * 3], y = current[n * 3 + 1], z = current[n * 3 + 2];
      var d = Math.sqrt(x * x + y * y + z * z);
      var heat = Math.max(0, 1 - d / 3.6);
      heat = heat * heat;
      colors[n * 3]     = palette.node.r + (palette.hot.r - palette.node.r) * heat;
      colors[n * 3 + 1] = palette.node.g + (palette.hot.g - palette.node.g) * heat;
      colors[n * 3 + 2] = palette.node.b + (palette.hot.b - palette.node.b) * heat;
    }
    nodeGeo.attributes.color.needsUpdate = true;
    edgeMat.color.copy(palette.edge);

    writeEdges();

    pX += (tX - pX) * 0.06;
    pY += (tY - pY) * 0.06;
    if (!snap) spin += dt * 0.09;

    var a = spin + pX * 0.7;
    var rad = 9.4;
    camera.position.set(Math.sin(a) * rad, 2.6 - pY * 2.2, Math.cos(a) * rad);
    camera.lookAt(0, 0.6, 0);

    renderer.render(scene, camera);
  }

  function frame() {
    if (!running) return;
    step(Math.min(clock.getDelta(), 0.05), false);
    rafId = requestAnimationFrame(frame);
  }
  function renderOnce() { if (resize()) step(0, true); }

  function start() {
    if (staticMode) { renderOnce(); return; }
    if (running) return;
    if (!resize()) return;
    clock.getDelta();
    running = true;
    frame();
  }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  /* Visibility.
     IntersectionObserver alone is not trustworthy enough here: inside some
     embedded/preview browser frames it never reports the section as visible,
     and the scene then silently never starts. So the geometric check is the
     source of truth, the observer and the scroll listener are both just cheap
     ways of being told to re-run it, and an initial check covers the case
     where the section is already on screen at load. */
  function isVisible() {
    var r = host.getBoundingClientRect();
    return r.bottom > -240 && r.top < (window.innerHeight || 0) + 240;
  }

  function syncVisibility() {
    var v = isVisible();
    if (v === onScreen) return;
    onScreen = v;
    v ? start() : stop();
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(syncVisibility, { threshold: 0, rootMargin: "240px" }).observe(host);
  }
  window.addEventListener("scroll", syncVisibility, { passive: true });
  window.addEventListener("resize", syncVisibility);

  function remeasure() {
    resize();
    if (onScreen && !running) start();
    if (running && (W < 2 || H < 2)) stop();
  }
  if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(stage);
  else window.addEventListener("resize", remeasure);

  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : (onScreen && start());
  });

  host.setAttribute("data-topo-mode", "live");
  host.setAttribute("data-topo-motion", staticMode ? "static" : "orbit");
  select(0, true);

  /* The attributes above decide the layout, so measure on the next frame. */
  requestAnimationFrame(function () {
    onScreen = isVisible();
    if (onScreen) start(); else renderOnce();
  });
})();
