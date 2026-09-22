/* ============================================================================
   TECHACCESS PAKISTAN — The Core
   ----------------------------------------------------------------------------
   The sixteen practices, rendered as sixteen blades on a single spine.

   The idea borrowed from the reference work (igloo.inc) is not the ice — it is
   that each item gets its own volume in space and the camera travels between
   them rather than the page cutting between cards. Translated to an
   infrastructure company, the volume is a rack blade and the structure is a
   core: sixteen practices mounted on one backbone, which is the argument the
   section is making in words anyway.

   Mechanics
     - Scroll drives a continuous focus value across the sixteen blades.
     - The camera orbits in lockstep with the helix, so the focused blade is
       always framed at three-quarters rather than swinging past.
     - The focused blade extends off the spine, its edges and status strip
       ignite, and a key light rides with it.
     - The readout beside it is real HTML, so the copy stays selectable,
       translatable, and legible to a screen reader.

   Degradation, in order of preference
     - No WebGL, reduced motion, or a viewport too narrow: the canvas never
       initialises and the plain sixteen-card grid is shown instead.
     - The grid is always in the DOM. This is an enhancement layered over it,
       never a replacement for it.
   ========================================================================== */
(function () {
  "use strict";

  var host = document.querySelector("[data-core]");
  if (!host) return;

  var canvas = host.querySelector(".core-canvas");
  var stage = host.querySelector(".core-stage");
  if (!canvas || !stage) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Fall back to the card grid and stop. Called for every unsupported path so
     there is exactly one way the section degrades. */
  function fallback(reason) {
    host.setAttribute("data-core-mode", "fallback");
    if (reason) host.setAttribute("data-core-reason", reason);
  }

  /* Reduced motion does not mean "show nothing". It means do not animate
     unprompted. In static mode the scene is built and rendered once, the
     scroll scrub is off, and the picture only changes when the visitor clicks
     a practice on the rail. They still get the design; nothing moves at them. */
  var staticMode = reduced.matches;

  if (!window.THREE) return fallback("three-missing");

  /* Cheap WebGL probe before we construct anything expensive. */
  try {
    var probe = document.createElement("canvas");
    if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))) {
      return fallback("no-webgl");
    }
  } catch (err) {
    return fallback("no-webgl");
  }

  var T = window.THREE;

  /* ------------------------------------------------------------------ data */
  var CATEGORY = {
    advisory: "Advisory",
    cloud: "Cloud",
    security: "Security",
    apps: "Applications",
    infra: "Infrastructure",
    data: "Data",
    managed: "Managed"
  };

  var PRACTICES = (window.TA && window.TA.data && window.TA.data.SOLUTIONS) || [];
  if (PRACTICES.length !== 16) return fallback("data-mismatch");

  var N = PRACTICES.length;

  /* --------------------------------------------------------------- readout */
  var elIndex = host.querySelector("[data-core-index]");
  var elCat = host.querySelector("[data-core-cat]");
  var elTitle = host.querySelector("[data-core-title]");
  var elDesc = host.querySelector("[data-core-desc]");
  var elLink = host.querySelector("[data-core-link]");

  /* Build the rail from the same data the scene uses, so the ticks can never
     drift out of sync with the blades. Each is a real button carrying the
     practice name, which keeps the control keyboard-reachable and labelled.
     (Full crawlable text lives in the card grid below, which is static HTML.) */
  var rail = host.querySelector(".core-rail");
  if (rail) {
    var frag = document.createDocumentFragment();
    PRACTICES.forEach(function (p, i) {
      var li = document.createElement("li");
      li.style.display = "contents";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "core-tick";
      btn.setAttribute("data-core-tick", "");
      btn.setAttribute("aria-current", i === 0 ? "true" : "false");
      btn.setAttribute("aria-label", (i + 1) + ". " + p.t);
      var n = document.createElement("span");
      n.className = "core-tick__n";
      n.textContent = String(i + 1).padStart(2, "0");
      btn.appendChild(n);
      li.appendChild(btn);
      frag.appendChild(li);
    });
    rail.appendChild(frag);
  }

  var ticks = Array.prototype.slice.call(host.querySelectorAll("[data-core-tick]"));

  /* ---------------------------------------------------------------- scene */
  var scene = new T.Scene();
  scene.fog = new T.FogExp2(0x05050a, 0.020);

  var camera = new T.PerspectiveCamera(42, 1, 0.1, 120);

  var renderer = new T.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);

  var RED = new T.Color(0xe11d2e);
  var RED_HOT = new T.Color(0xff5566);
  var COLD = new T.Color(0x5e5e78);

  /* ---------------------------------------------------------------- layout
     A helix: each blade steps up and turns by a fixed angle. Two and a half
     turns across sixteen reads as a structure rather than a barber pole. */
  var RADIUS = 2.55;
  var RISE = 0.66;
  var TURN = ((Math.PI * 2) / N) * 2.5;

  function bladeAngle(i) { return i * TURN; }
  function bladeY(i) { return (i - (N - 1) / 2) * RISE; }

  /* ---------------------------------------------------------------- lights */
  scene.add(new T.HemisphereLight(0x4a5270, 0x05050a, 0.80));

  var fill = new T.DirectionalLight(0x9fb0d0, 0.5);
  fill.position.set(-4, 6, 5);
  scene.add(fill);

  /* The key light rides with the focused blade — it is what makes the
     ignition read as lighting rather than a colour swap. */
  var key = new T.PointLight(0xff2a3d, 0, 9, 2);
  scene.add(key);

  var rim = new T.PointLight(0x4466ff, 0.35, 18, 2);
  rim.position.set(0, 4, -6);
  scene.add(rim);

  /* ----------------------------------------------------------------- spine */
  var spineH = N * RISE + 2.4;
  var spine = new T.Mesh(
    new T.CylinderGeometry(0.085, 0.085, spineH, 12, 1, true),
    new T.MeshStandardMaterial({
      color: 0x1b1b24, metalness: 0.7, roughness: 0.4,
      emissive: 0x4a121c, emissiveIntensity: 0.9, side: T.DoubleSide
    })
  );
  scene.add(spine);

  /* Collars mark each mount point on the spine even before you reach it. */
  var collarGeo = new T.TorusGeometry(0.14, 0.022, 6, 20);
  var collarMat = new T.MeshStandardMaterial({
    color: 0x33333f, metalness: 0.8, roughness: 0.35
  });

  /* ---------------------------------------------------------------- blades */
  var bladeGeo = new T.BoxGeometry(2.55, 0.11, 1.28);
  var edgeGeo = new T.EdgesGeometry(bladeGeo);
  var stripGeo = new T.PlaneGeometry(2.1, 0.035);

  var blades = [];

  for (var i = 0; i < N; i++) {
    var group = new T.Group();
    var a = bladeAngle(i);
    var y = bladeY(i);

    group.position.set(0, y, 0);
    group.rotation.y = -a;

    /* Body, offset along +X so the group's Y rotation swings it around the
       spine. Pushing the blade out later is just a change to this offset. */
    var body = new T.Mesh(bladeGeo, new T.MeshStandardMaterial({
      color: 0x101017, metalness: 0.45, roughness: 0.5,
      emissive: 0x000000, emissiveIntensity: 1
    }));
    body.position.x = RADIUS;
    group.add(body);

    var edges = new T.LineSegments(edgeGeo, new T.LineBasicMaterial({
      color: COLD.clone(), transparent: true, opacity: 0.5
    }));
    edges.position.x = RADIUS;
    group.add(edges);

    /* Status strip on the top face — the detail that says "rack", not "slab". */
    var strip = new T.Mesh(stripGeo, new T.MeshBasicMaterial({
      color: RED.clone(), transparent: true, opacity: 0.12
    }));
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(RADIUS + 0.1, 0.058, 0.42);
    group.add(strip);

    /* Arm back to the spine: sixteen practices, one backbone. */
    var arm = new T.Mesh(
      new T.BoxGeometry(RADIUS - 0.16, 0.035, 0.035),
      new T.MeshStandardMaterial({ color: 0x24242e, metalness: 0.7, roughness: 0.45 })
    );
    arm.position.x = (RADIUS - 0.16) / 2 + 0.08;
    group.add(arm);

    var collar = new T.Mesh(collarGeo, collarMat);
    collar.rotation.x = Math.PI / 2;
    group.add(collar);

    scene.add(group);

    blades.push({
      group: group, body: body, edges: edges, strip: strip, arm: arm,
      angle: a, y: y, heat: 0
    });
  }

  /* ------------------------------------------------------------------ glow
     A single additive sprite that rides the focused blade. Cheaper than a
     bloom pass and, at this scale, close to indistinguishable. */
  function glowTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var g = c.getContext("2d");
    var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,90,110,0.85)");
    grad.addColorStop(0.35, "rgba(225,29,46,0.30)");
    grad.addColorStop(1, "rgba(225,29,46,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  }

  var glow = new T.Sprite(new T.SpriteMaterial({
    map: glowTexture(), blending: T.AdditiveBlending,
    transparent: true, depthWrite: false, opacity: 0
  }));
  glow.scale.set(4.2, 4.2, 1);
  scene.add(glow);

  /* ------------------------------------------------------------- artifacts
     Each practice gets its own object, drawn as a glowing red wireframe that
     hovers above its blade on a projected pedestal. It rises and ignites as
     its blade comes into focus and sinks away as you scroll past, so exactly
     one reads at a time. Built from primitives only: no models to download. */
  var ART_LINE = 0xff4a5c, ART_FILL = 0xe11d2e;
  var artGlowTex = glowTexture();

  function artKit() {
    var g = new T.Group();
    var line = new T.LineBasicMaterial({
      color: ART_LINE, transparent: true, opacity: 0,
      blending: T.AdditiveBlending, depthWrite: false
    });
    var fill = new T.MeshBasicMaterial({
      color: ART_FILL, transparent: true, opacity: 0,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    });
    return { g: g, line: line, fill: fill, parts: {} };
  }
  /* Add a solid as faint fill + bright edges. */
  function solid(k, geo, x, y, z, rx, ry, rz, parent) {
    var h = new T.Group();
    h.add(new T.Mesh(geo, k.fill));
    h.add(new T.LineSegments(new T.EdgesGeometry(geo, 25), k.line));
    h.position.set(x || 0, y || 0, z || 0);
    h.rotation.set(rx || 0, ry || 0, rz || 0);
    (parent || k.g).add(h);
    return h;
  }
  /* Add an open polyline. */
  function poly(k, pts, parent) {
    var v = pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2] || 0); });
    var l = new T.Line(new T.BufferGeometry().setFromPoints(v), k.line);
    (parent || k.g).add(l);
    return l;
  }
  function arcPts(r, a0, a1, n, y) {
    var out = [];
    for (var s = 0; s <= n; s++) {
      var a = a0 + (a1 - a0) * s / n;
      out.push(y === undefined ? [Math.cos(a) * r, Math.sin(a) * r, 0] : [Math.cos(a) * r, y, Math.sin(a) * r]);
    }
    return out;
  }
  function extrude(shape, depth) {
    var geo = new T.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: false, curveSegments: 18 });
    geo.center();
    return geo;
  }

  var BUILD = [
    /* 01 Consulting & Implementation — a roadmap: rising milestones and a trend */
    function (k) {
      [[-0.42, 0.28], [-0.14, 0.5], [0.14, 0.72]].forEach(function (b) {
        solid(k, new T.BoxGeometry(0.18, b[1], 0.18), b[0], b[1] / 2 - 0.42, 0);
      });
      poly(k, [[-0.55, -0.05], [-0.14, 0.2], [0.14, 0.42], [0.42, 0.52]]);
      solid(k, new T.ConeGeometry(0.07, 0.18, 4), 0.46, 0.54, 0, 0, 0, -1.2);
      k.parts.flag = solid(k, new T.BoxGeometry(0.22, 0.13, 0.01), 0.55, 0.3, 0);
      solid(k, new T.CylinderGeometry(0.012, 0.012, 0.64, 4), 0.44, 0.04, 0);
      k.anim = function (t) { k.parts.flag.rotation.y = Math.sin(t * 2.2) * 0.4; };
    },
    /* 02 Cloud — a low-poly cloud over a small uplink */
    function (k) {
      solid(k, new T.IcosahedronGeometry(0.26, 1), -0.3, -0.02, 0);
      solid(k, new T.IcosahedronGeometry(0.36, 1), 0.02, 0.14, 0);
      solid(k, new T.IcosahedronGeometry(0.27, 1), 0.33, 0.0, 0);
      k.fillMul = 0.35;
      [-0.25, 0, 0.25].forEach(function (x) { poly(k, [[x, -0.28], [x, -0.52]]); });
      k.parts.up = solid(k, new T.OctahedronGeometry(0.05), 0, -0.5, 0);
      k.anim = function (t) { k.parts.up.position.y = -0.5 + ((t * 0.5) % 1) * 0.25; };
    },
    /* 03 Security — shield with a lock */
    function (k) {
      var s = new T.Shape();
      s.moveTo(0, 0.5); s.lineTo(0.42, 0.34); s.lineTo(0.4, -0.02);
      s.quadraticCurveTo(0.34, -0.36, 0, -0.52);
      s.quadraticCurveTo(-0.34, -0.36, -0.4, -0.02);
      s.lineTo(-0.42, 0.34); s.lineTo(0, 0.5);
      solid(k, extrude(s, 0.1), 0, 0, 0);
      solid(k, new T.BoxGeometry(0.26, 0.2, 0.18), 0, -0.06, 0.1);
      solid(k, new T.TorusGeometry(0.085, 0.022, 6, 14, Math.PI), 0, 0.04, 0.1);
    },
    /* 04 ERP — two meshing gears */
    function (k) {
      function gear(r, teeth) {
        var s = new T.Shape();
        for (var q = 0; q < teeth * 2; q++) {
          var a0 = q / (teeth * 2) * Math.PI * 2, a1 = (q + 1) / (teeth * 2) * Math.PI * 2;
          var rr = q % 2 ? r : r * 1.22;
          if (q === 0) s.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr); else s.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr);
          s.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr);
        }
        var hole = new T.Path(); hole.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true);
        s.holes.push(hole);
        return extrude(s, 0.09);
      }
      k.parts.a = solid(k, gear(0.3, 9), -0.2, 0.1, 0);
      k.parts.b = solid(k, gear(0.19, 6), 0.33, -0.26, 0);
      k.anim = function (t) { k.parts.a.rotation.z = t * 0.6; k.parts.b.rotation.z = -t * 0.6 * 1.5 + 0.3; };
    },
    /* 05 Data Center — a rack cabinet with units and status lights */
    function (k) {
      solid(k, new T.BoxGeometry(0.56, 1.0, 0.5), 0, 0, 0);
      var leds = [];
      for (var u = 0; u < 7; u++) {
        var y = -0.4 + u * 0.13;
        poly(k, [[-0.24, y, 0.26], [0.24, y, 0.26]]);
        leds.push(solid(k, new T.BoxGeometry(0.035, 0.035, 0.02), 0.18, y + 0.06, 0.26));
      }
      k.anim = function (t) {
        leds.forEach(function (l, i) { l.visible = Math.sin(t * 3 + i * 1.7) > -0.3; });
      };
    },
    /* 06 Virtualization — nested machines turning independently */
    function (k) {
      k.parts.o = solid(k, new T.BoxGeometry(0.9, 0.9, 0.9), 0, 0, 0);
      k.parts.m = solid(k, new T.BoxGeometry(0.56, 0.56, 0.56), 0, 0, 0);
      k.parts.i = solid(k, new T.BoxGeometry(0.26, 0.26, 0.26), 0, 0, 0);
      k.anim = function (t) {
        k.parts.m.rotation.set(t * 0.5, t * 0.3, 0);
        k.parts.i.rotation.set(-t * 0.8, 0, t * 0.6);
      };
    },
    /* 07 Network Services — a switch core with meshed nodes */
    function (k) {
      solid(k, new T.OctahedronGeometry(0.16), 0, 0, 0);
      var pts = [];
      for (var n = 0; n < 6; n++) {
        var a = n / 6 * Math.PI * 2;
        var p = [Math.cos(a) * 0.5, Math.sin(a * 2) * 0.12, Math.sin(a) * 0.5];
        pts.push(p);
        solid(k, new T.IcosahedronGeometry(0.07, 0), p[0], p[1], p[2]);
        poly(k, [[0, 0, 0], p]);
      }
      poly(k, pts.concat([pts[0]]));
      k.parts.pk = solid(k, new T.OctahedronGeometry(0.035), 0, 0, 0);
      k.anim = function (t) {
        var f = (t * 0.8) % 1, idx = Math.floor(t * 0.8) % 6, p = pts[idx];
        k.parts.pk.position.set(p[0] * f, p[1] * f, p[2] * f);
      };
    },
    /* 08 Servers & Storage — a stacked storage array */
    function (k) {
      var d = [];
      [-0.3, 0, 0.3].forEach(function (y) { d.push(solid(k, new T.CylinderGeometry(0.4, 0.4, 0.2, 28), 0, y, 0)); });
      k.anim = function (t) { d.forEach(function (c, i) { c.rotation.y = t * (0.3 + i * 0.15); }); };
    },
    /* 09 Professional Services — a certification medal */
    function (k) {
      k.parts.m = new T.Group(); k.g.add(k.parts.m);
      solid(k, new T.TorusGeometry(0.3, 0.035, 8, 36), 0, 0.14, 0, 0, 0, 0, k.parts.m);
      solid(k, new T.CylinderGeometry(0.2, 0.2, 0.05, 8), 0, 0.14, 0, Math.PI / 2, 0, 0, k.parts.m);
      var st = new T.Shape();
      for (var q = 0; q < 10; q++) {
        var a = Math.PI / 2 + q / 10 * Math.PI * 2, r = q % 2 ? 0.05 : 0.12;
        q ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      solid(k, extrude(st, 0.03), 0, 0.14, 0.04, 0, 0, 0, k.parts.m);
      solid(k, new T.BoxGeometry(0.12, 0.42, 0.02), -0.12, -0.34, 0, 0, 0, 0.3);
      solid(k, new T.BoxGeometry(0.12, 0.42, 0.02), 0.12, -0.34, 0, 0, 0, -0.3);
    },
    /* 10 Cyber Security SOC / SIEM — a radar sweep with contacts */
    function (k) {
      var dish = new T.Group(); dish.rotation.x = -0.55; k.g.add(dish);
      [0.18, 0.34, 0.5].forEach(function (r) { poly(k, arcPts(r, 0, Math.PI * 2, 48, 0), dish); });
      poly(k, [[-0.5, 0, 0], [0.5, 0, 0]], dish);
      poly(k, [[0, 0, -0.5], [0, 0, 0.5]], dish);
      k.parts.sw = new T.Group(); dish.add(k.parts.sw);
      solid(k, new T.CircleGeometry(0.5, 12, 0, 0.55), 0, 0, 0, -Math.PI / 2, 0, 0, k.parts.sw);
      var blips = [[0.22, 0.2], [-0.3, 0.12], [0.1, -0.38]].map(function (b) {
        return solid(k, new T.OctahedronGeometry(0.035), b[0], 0.02, b[1], 0, 0, 0, dish);
      });
      k.anim = function (t) {
        k.parts.sw.rotation.y = -t * 1.6;
        blips.forEach(function (b, i) { b.scale.setScalar(0.6 + Math.max(0, Math.sin(t * 1.6 + i * 2.1)) * 0.9); });
      };
    },
    /* 11 Big Data & Analytics — a live 3D bar field */
    function (k) {
      var bars = [];
      for (var x = 0; x < 4; x++) for (var z = 0; z < 4; z++) {
        var b = solid(k, new T.BoxGeometry(0.14, 1, 0.14), -0.3 + x * 0.2, -0.45, -0.3 + z * 0.2);
        b.children.forEach(function (c) { c.position.y = 0.5; });
        bars.push({ b: b, s: x * 0.7 + z * 1.3 });
      }
      k.anim = function (t) {
        bars.forEach(function (o) { o.b.scale.y = 0.15 + (Math.sin(t * 1.4 + o.s) * 0.5 + 0.5) * 0.75; });
      };
    },
    /* 12 Remotely Managed Services — a NOC screen with a live pulse and signal */
    function (k) {
      solid(k, new T.BoxGeometry(0.9, 0.56, 0.05), 0, -0.05, 0);
      solid(k, new T.BoxGeometry(0.06, 0.18, 0.06), 0, -0.42, 0);
      solid(k, new T.BoxGeometry(0.36, 0.03, 0.2), 0, -0.52, 0);
      poly(k, [[-0.36, -0.08, 0.03], [-0.16, -0.08, 0.03], [-0.1, 0.08, 0.03], [-0.03, -0.2, 0.03], [0.04, 0.06, 0.03], [0.1, -0.08, 0.03], [0.36, -0.08, 0.03]]);
      k.parts.arcs = [0.12, 0.22, 0.32].map(function (r) {
        var g = new T.Group(); g.position.set(0, 0.28, 0); k.g.add(g);
        poly(k, arcPts(r, Math.PI * 0.25, Math.PI * 0.75, 16), g);
        return g;
      });
      k.anim = function (t) {
        k.parts.arcs.forEach(function (g, i) { g.visible = ((t * 2.2) % 4) > i; });
      };
    },
    /* 13 Business Continuity — a failover loop that never stops */
    function (k) {
      k.parts.r = new T.Group(); k.g.add(k.parts.r);
      [0, Math.PI].forEach(function (a0) {
        var h = new T.Group(); h.rotation.z = a0; k.parts.r.add(h);
        solid(k, new T.TorusGeometry(0.38, 0.035, 6, 32, Math.PI * 0.78), 0, 0, 0, 0, 0, 0, h);
        var e = Math.PI * 0.78;
        solid(k, new T.ConeGeometry(0.09, 0.2, 4), Math.cos(e) * 0.38, Math.sin(e) * 0.38, 0, 0, 0, e, h);
      });
      solid(k, new T.OctahedronGeometry(0.12), 0, 0, 0);
      k.anim = function (t) { k.parts.r.rotation.z = -t * 0.9; };
    },
    /* 14 Middleware — two systems bridged, messages flowing between */
    function (k) {
      solid(k, new T.BoxGeometry(0.3, 0.44, 0.3), -0.5, 0, 0);
      solid(k, new T.BoxGeometry(0.3, 0.44, 0.3), 0.5, 0, 0);
      solid(k, new T.OctahedronGeometry(0.15), 0, 0, 0);
      [-0.1, 0.1].forEach(function (y) {
        poly(k, [[-0.35, y, 0], [-0.13, y, 0]]);
        poly(k, [[0.13, y, 0], [0.35, y, 0]]);
      });
      var msgs = [0, 1].map(function (i) { return solid(k, new T.BoxGeometry(0.06, 0.06, 0.06), 0, i ? -0.1 : 0.1, 0); });
      k.anim = function (t) {
        var f = (t * 0.6) % 1;
        msgs[0].position.x = -0.35 + f * 0.7;
        msgs[1].position.x = 0.35 - f * 0.7;
      };
    },
    /* 15 Bring Your Own Device — laptop and phone under one policy */
    function (k) {
      solid(k, new T.BoxGeometry(0.72, 0.04, 0.46), -0.08, -0.3, 0);
      solid(k, new T.BoxGeometry(0.72, 0.46, 0.03), -0.08, -0.06, -0.24, -0.25, 0, 0);
      solid(k, new T.BoxGeometry(0.22, 0.4, 0.035), 0.44, -0.12, 0.18, 0, -0.35, 0);
      k.parts.p = new T.Group(); k.parts.p.position.set(0.06, 0.34, 0); k.g.add(k.parts.p);
      poly(k, arcPts(0.5, Math.PI * 0.15, Math.PI * 0.85, 24).map(function (p) { return [p[0], p[1] - 0.44, 0]; }), k.parts.p);
      solid(k, new T.OctahedronGeometry(0.05), 0, 0.06, 0, 0, 0, 0, k.parts.p);
      k.anim = function (t) { k.parts.p.position.y = 0.34 + Math.sin(t * 2) * 0.03; };
    },
    /* 16 Identity & Access Management — a key */
    function (k) {
      k.parts.key = new T.Group(); k.g.add(k.parts.key);
      solid(k, new T.TorusGeometry(0.17, 0.045, 8, 28), -0.36, 0, 0, 0, 0, 0, k.parts.key);
      solid(k, new T.BoxGeometry(0.62, 0.07, 0.07), 0.1, 0, 0, 0, 0, 0, k.parts.key);
      solid(k, new T.BoxGeometry(0.07, 0.16, 0.07), 0.3, -0.1, 0, 0, 0, 0, k.parts.key);
      solid(k, new T.BoxGeometry(0.07, 0.11, 0.07), 0.4, -0.08, 0, 0, 0, 0, k.parts.key);
      k.anim = function (t) { k.parts.key.rotation.x = Math.sin(t * 1.2) * 0.5; };
    }
  ];

  var ART_Y = 0.95;
  blades.forEach(function (b, i) {
    var k = artKit();
    BUILD[i](k);
    k.g.scale.setScalar(0.95);

    /* Holder rides the blade's outer end; rotation is local so the object
       spins in place above its own step. */
    var holder = new T.Group();
    holder.position.set(RADIUS + 0.2, ART_Y, 0);
    holder.add(k.g);

    /* Projected pedestal on the blade top and the beam up to the object. */
    var padMat = new T.MeshBasicMaterial({
      color: ART_FILL, transparent: true, opacity: 0,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    });
    var pad = new T.Mesh(new T.RingGeometry(0.42, 0.46, 40), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.06 - ART_Y;
    holder.add(pad);
    var pad2 = new T.Mesh(new T.RingGeometry(0.2, 0.215, 32), padMat);
    pad2.rotation.x = -Math.PI / 2;
    pad2.position.y = 0.061 - ART_Y;
    holder.add(pad2);

    var beamMat = new T.MeshBasicMaterial({
      color: ART_FILL, transparent: true, opacity: 0,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    });
    var beam = new T.Mesh(new T.CylinderGeometry(0.44, 0.2, ART_Y - 0.35, 32, 1, true), beamMat);
    beam.position.y = (0.06 - ART_Y) / 2 - 0.12;
    holder.add(beam);

    var halo = new T.Sprite(new T.SpriteMaterial({
      map: artGlowTex, blending: T.AdditiveBlending,
      transparent: true, depthWrite: false, opacity: 0
    }));
    halo.scale.set(2.2, 2.2, 1);
    holder.add(halo);

    holder.visible = false;
    b.group.add(holder);
    b.art = { holder: holder, k: k, pad: padMat, beam: beamMat, halo: halo, vis: 0, seed: i * 1.37 };
  });

  var artTmp = new T.Vector3(), artLook = new T.Vector3();
  function updateArtifact(b, t, dt, snap) {
    var a = b.art;
    var target = Math.max(0, Math.min(1, (b.heat - 0.35) / 0.6));
    target = target * target * (3 - 2 * target);
    a.vis = snap ? target : a.vis + (target - a.vis) * Math.min(1, dt * 7);
    var v = a.vis;
    a.holder.visible = v > 0.01;
    if (!a.holder.visible) return;

    var push = b.heat * 0.62;
    a.holder.position.x = RADIUS + 0.2 + push;
    a.holder.position.y = ART_Y - (1 - v) * 0.45 + (snap ? 0 : Math.sin(t * 1.3 + a.seed) * 0.05);

    a.k.g.scale.setScalar(0.95 * (0.55 + 0.45 * v));
    /* Face the camera, then sway, so flat objects (shield, screen, key)
       never turn edge-on to the viewer. */
    a.k.g.getWorldPosition(artTmp);
    artLook.set(camera.position.x, artTmp.y + 0.4, camera.position.z);
    a.k.g.lookAt(artLook);
    a.k.g.rotateY(snap ? 0.35 : Math.sin(t * 0.7 + a.seed) * 0.55);
    if (a.k.anim) a.k.anim(snap ? 1.2 : t);

    a.k.line.opacity = v;
    a.k.fill.opacity = v * 0.14 * (a.k.fillMul || 1);
    a.pad.opacity = v * (0.55 + (snap ? 0 : Math.sin(t * 3) * 0.2));
    a.beam.opacity = v * 0.06;
    a.halo.material.opacity = v * 0.35;
  }

  /* ------------------------------------------------------------------ dust */
  var DUST = 520;
  var dustPos = new Float32Array(DUST * 3);
  var dustSeed = new Float32Array(DUST);
  for (var d = 0; d < DUST; d++) {
    var da = Math.random() * Math.PI * 2;
    var dr = 1.5 + Math.random() * 7;
    dustPos[d * 3] = Math.cos(da) * dr;
    dustPos[d * 3 + 1] = (Math.random() - 0.5) * (spineH + 6);
    dustPos[d * 3 + 2] = Math.sin(da) * dr;
    dustSeed[d] = Math.random() * Math.PI * 2;
  }
  var dustGeo = new T.BufferGeometry();
  dustGeo.setAttribute("position", new T.BufferAttribute(dustPos, 3));
  var dust = new T.Points(dustGeo, new T.PointsMaterial({
    color: 0x8a90a8, size: 0.03, transparent: true, opacity: 0.55,
    blending: T.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  scene.add(dust);

  /* ------------------------------------------------------------------ state */
  var focus = 0;          /* continuous position across the blades */
  var shownIndex = -1;    /* last index written into the readout */
  var pointerX = 0, pointerY = 0, pX = 0, pY = 0;
  var W = 0, H = 0;
  var running = false, rafId = null, onScreen = false;
  var clock = new T.Clock();

  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.min(r.width, 4000);
    H = Math.min(r.height, 3000);
    if (W < 2 || H < 2) return false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    return true;
  }

  /* --------------------------------------------------------------- readout */
  function writeReadout(i) {
    if (i === shownIndex) return;
    shownIndex = i;
    var p = PRACTICES[i];

    if (elIndex) elIndex.textContent = String(i + 1).padStart(2, "0");
    if (elCat) elCat.textContent = CATEGORY[p.g] || "Practice";
    if (elTitle) elTitle.textContent = p.t;
    if (elDesc) elDesc.textContent = p.d;
    if (elLink) elLink.setAttribute("href", "#solutions");

    /* Retrigger the entrance without a reflow-heavy class dance. */
    var card = host.querySelector("[data-core-readout]");
    if (card) {
      card.classList.remove("is-swap");
      void card.offsetWidth;
      card.classList.add("is-swap");
    }

    ticks.forEach(function (t, k) {
      t.setAttribute("aria-current", k === i ? "true" : "false");
    });
  }

  /* ----------------------------------------------------------------- scroll */
  /* The travel belongs to the pinned wrapper, not the whole section. The
     section also contains the sixteen-card index above the stage; measuring
     that too would mean the scrub was already most of the way through the
     practices by the time the stage first pinned, and the early ones would
     never be seen. */
  var scroller = host.querySelector(".core-scroll") || host;

  function scrollRange() {
    var rect = scroller.getBoundingClientRect();
    var top = rect.top + window.scrollY;
    var span = scroller.offsetHeight - window.innerHeight;
    return { top: top, span: span > 0 ? span : 1 };
  }

  function readScroll() {
    if (staticMode) return;
    var r = scrollRange();
    var p = (window.scrollY - r.top) / r.span;
    focus = Math.max(0, Math.min(1, p)) * (N - 1);
  }

  ticks.forEach(function (tick, i) {
    tick.addEventListener("click", function () {
      if (staticMode) {
        focus = i;
        writeReadout(i);
        renderOnce();
        return;
      }
      var r = scrollRange();
      window.scrollTo({
        top: Math.round(r.top + (i / (N - 1)) * r.span),
        behavior: "smooth"
      });
    });
  });

  stage.addEventListener("pointermove", function (e) {
    var r = stage.getBoundingClientRect();
    pointerX = (e.clientX - r.left) / r.width - 0.5;
    pointerY = (e.clientY - r.top) / r.height - 0.5;
  });
  stage.addEventListener("pointerleave", function () { pointerX = pointerY = 0; });

  /* ------------------------------------------------------------------ frame */
  var tmpColor = new T.Color();

  /* One pass of the scene. `snap` jumps every eased value straight to its
     destination and freezes the ambient motion, which is what static mode
     needs and what makes a single render look settled rather than half-way
     through an animation. */
  function step(dt, snap) {
    var t = snap ? 0 : clock.getElapsedTime();

    readScroll();
    var active = Math.round(focus);
    writeReadout(active);

    pX += (pointerX - pX) * 0.06;
    pY += (pointerY - pY) * 0.06;

    /* Blades: heat falls off with distance from the focus. */
    for (var i = 0; i < N; i++) {
      var b = blades[i];
      var dist = Math.abs(i - focus);
      var target = Math.max(0, 1 - dist * 0.85);
      b.heat = snap ? target : b.heat + (target - b.heat) * Math.min(1, dt * 9);

      var h = b.heat;
      var push = h * 0.62;
      b.body.position.x = RADIUS + push;
      b.edges.position.x = RADIUS + push;
      b.strip.position.x = RADIUS + 0.1 + push;

      /* A slow idle drift keeps the unfocused blades from looking frozen. */
      b.group.rotation.z = Math.sin(t * 0.5 + i) * 0.012 * (1 - h);

      tmpColor.copy(COLD).lerp(RED_HOT, h);
      b.edges.material.color.copy(tmpColor);
      b.edges.material.opacity = 0.55 + h * 0.45;

      b.strip.material.opacity = 0.10 + h * 0.9;
      b.body.material.emissive.copy(RED).multiplyScalar(h * 0.20);

      updateArtifact(b, t, dt, snap);
    }

    /* Camera orbits with the helix so the focused blade stays framed. */
    var fa = focus * TURN;
    var fy = (focus - (N - 1) / 2) * RISE;
    var camA = fa + 0.42 + pX * 0.35;
    var portrait = W / H < 0.85;
    var camR = portrait ? 9.6 + (0.85 - W / H) * 11 : 9.6;

    camera.position.set(
      Math.cos(camA) * camR,
      fy + 2.05 - pY * 0.9,
      Math.sin(camA) * camR
    );
    camera.lookAt(Math.cos(fa) * 0.9, fy + 0.1, Math.sin(fa) * 0.9);
    /* The readout owns the left of the frame, so slide the camera along its
       own X to push the structure right. Done after lookAt so the aim is
       untouched and only the framing moves. The shift scales down on narrower
       viewports, where a fixed offset would push the core off screen. */
    camera.translateX(W > 1280 ? -1.75 : W > 1060 ? -1.15 : portrait ? 0.35 : -0.35);
    /* On a tall phone frame, lift the structure into the upper half so the
       readout at the bottom never covers the focused step. */
    if (portrait) camera.translateY(-0.75);

    /* Key light and glow ride the focused blade. */
    var lx = Math.cos(fa) * (RADIUS + 0.9);
    var lz = Math.sin(fa) * (RADIUS + 0.9);
    key.position.set(lx, fy + 0.35, lz);
    key.intensity = 2.4;

    glow.position.set(Math.cos(fa) * (RADIUS + 0.3), fy, Math.sin(fa) * (RADIUS + 0.3));
    glow.material.opacity = 0.30;

    /* Dust drifts upward and wraps, so the volume never reads as static. */
    if (!snap) {
    var arr = dustGeo.attributes.position.array;
    for (var k = 0; k < DUST; k++) {
      arr[k * 3 + 1] += dt * (0.12 + (k % 7) * 0.012);
      if (arr[k * 3 + 1] > (spineH + 6) / 2) arr[k * 3 + 1] = -(spineH + 6) / 2;
      arr[k * 3] += Math.sin(t * 0.3 + dustSeed[k]) * dt * 0.03;
    }
    dustGeo.attributes.position.needsUpdate = true;
    }

    spine.rotation.y = t * 0.05;
    renderer.render(scene, camera);
  }

  function frame() {
    if (!running) return;
    step(Math.min(clock.getDelta(), 0.05), false);
    rafId = requestAnimationFrame(frame);
  }

  function renderOnce() {
    if (!resize()) return;
    step(0, true);
  }

  function start() {
    if (running) return;
    if (!resize()) return;
    clock.getDelta();
    running = true;
    frame();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  /* Render only while the section is on screen and the stage has a real box
     (it is display:none under the breakpoint). */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        onScreen = e.isIntersecting;
        onScreen ? start() : stop();
      });
    }, { threshold: 0.01 }).observe(host);
  } else {
    onScreen = true;
    start();
  }

  function remeasure() {
    resize();
    if (onScreen && !running) start();
    if (running && (W < 2 || H < 2)) stop();
  }

  if ("ResizeObserver" in window) {
    new ResizeObserver(remeasure).observe(stage);
  } else {
    window.addEventListener("resize", remeasure);
  }

  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : (onScreen && start());
  });

  host.setAttribute("data-core-mode", "live");
  host.setAttribute("data-core-motion", staticMode ? "static" : "scroll");

  if (staticMode) {
    var cue = host.querySelector("[data-core-cue]");
    if (cue) cue.textContent = "Select a practice below";
  }

  writeReadout(0);
})();
