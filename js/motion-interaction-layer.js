/* ============================================================================
   TECHACCESS PAKISTAN — Motion & interaction layer
   ----------------------------------------------------------------------------
   Every behaviour here is progressive: the page is complete and readable with
   this file removed. Nothing animates if the visitor asks for reduced motion.

   Modules
     theme         persisted dark/light switch
     navChrome     sticky bar, mega menu, mobile drawer
     reveal        IntersectionObserver entrance choreography
     splitText     word-by-word headline reveals
     counters      number roll-ups
     lattice       hero canvas — the network that reacts to the pointer
     process       scroll-scrubbed delivery-model section
     tabs          capability switcher
     filter        solutions index filtering
     magnetic      buttons that lean toward the cursor
     cursor        precision ring cursor
     progress      top scroll rail
     curtain       page-to-page transition
     forms         client-side validation
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ------------------------------------------------------------------ theme */
  var Theme = {
    KEY: "ta-theme",
    init: function () {
      document.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-theme-toggle]");
        if (!btn) return;
        var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        Theme.set(next);
      });
    },
    set: function (mode) {
      document.documentElement.setAttribute("data-theme", mode);
      try { localStorage.setItem(Theme.KEY, mode); } catch (err) { /* private mode */ }
    }
  };

  /* ------------------------------------------------------------- navChrome */
  var NavChrome = {
    init: function () {
      var nav = $("#site-nav");
      if (!nav) return;
      var lastY = window.scrollY;
      var openPanel = null;
      var closeTimer = null;

      /* Sticky styling + hide-on-scroll-down (restores the moment you go up) */
      var onScroll = function () {
        var y = window.scrollY;
        nav.classList.toggle("is-stuck", y > 12);
        var goingDown = y > lastY && y > 300;
        if (!nav.classList.contains("is-open") && !openPanel) {
          nav.classList.toggle("is-hidden", goingDown);
        }
        lastY = y;
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      /* --- Mega menu: hover on fine pointers, click everywhere --- */
      var setPanel = function (id) {
        if (openPanel && openPanel !== id) closePanel(openPanel);
        var panel = id && document.getElementById(id);
        if (!panel) return;
        panel.classList.add("is-open");
        var trig = $('[data-mega-trigger="' + id + '"]');
        if (trig) trig.setAttribute("aria-expanded", "true");
        openPanel = id;
        nav.classList.remove("is-hidden");
      };
      var closePanel = function (id) {
        var panel = id && document.getElementById(id);
        if (panel) panel.classList.remove("is-open");
        var trig = $('[data-mega-trigger="' + id + '"]');
        if (trig) trig.setAttribute("aria-expanded", "false");
        if (openPanel === id) openPanel = null;
      };
      var closeAll = function () { $$(".mega-panel").forEach(function (p) { closePanel(p.id); }); };

      $$("[data-mega-trigger]").forEach(function (trig) {
        var id = trig.getAttribute("data-mega-trigger");
        var panel = document.getElementById(id);

        trig.addEventListener("click", function (e) {
          e.preventDefault();
          if (openPanel === id) closePanel(id); else setPanel(id);
        });

        if (finePointer.matches) {
          var enter = function () { clearTimeout(closeTimer); setPanel(id); };
          var leave = function () { closeTimer = setTimeout(function () { closePanel(id); }, 180); };
          trig.addEventListener("mouseenter", enter);
          trig.addEventListener("mouseleave", leave);
          if (panel) {
            panel.addEventListener("mouseenter", enter);
            panel.addEventListener("mouseleave", leave);
          }
        }
      });

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") { closeAll(); Drawer.close(); }
      });
      document.addEventListener("click", function (e) {
        if (!openPanel) return;
        if (e.target.closest(".mega-panel") || e.target.closest("[data-mega-trigger]")) return;
        closeAll();
      });

      Drawer.init(nav);
    }
  };

  /* Mobile drawer + its accordions */
  var Drawer = {
    init: function (nav) {
      var drawer = $("#site-drawer");
      var toggle = $("[data-drawer-toggle]");
      if (!drawer || !toggle) return;
      Drawer.el = drawer; Drawer.btn = toggle; Drawer.nav = nav;

      toggle.addEventListener("click", function () {
        drawer.classList.contains("is-open") ? Drawer.close() : Drawer.open();
      });

      $$("[data-acc-toggle]", drawer).forEach(function (head) {
        head.addEventListener("click", function () {
          var open = head.getAttribute("aria-expanded") === "true";
          head.setAttribute("aria-expanded", open ? "false" : "true");
        });
      });

      $$("a", drawer).forEach(function (a) {
        a.addEventListener("click", function () { Drawer.close(); });
      });
    },
    open: function () {
      if (!Drawer.el) return;
      Drawer.el.classList.add("is-open");
      Drawer.btn.setAttribute("aria-expanded", "true");
      Drawer.nav.classList.add("is-open");
      Drawer.nav.classList.remove("is-hidden");
      document.body.classList.add("is-locked");
    },
    close: function () {
      if (!Drawer.el) return;
      Drawer.el.classList.remove("is-open");
      Drawer.btn.setAttribute("aria-expanded", "false");
      Drawer.nav.classList.remove("is-open");
      document.body.classList.remove("is-locked");
    }
  };

  /* ----------------------------------------------------------------- reveal */
  var Reveal = {
    init: function () {
      var items = $$("[data-reveal]");
      if (!items.length) return;
      if (reduced.matches || !("IntersectionObserver" in window)) {
        items.forEach(function (i) { i.classList.add("is-in"); });
        return;
      }

      /* Stagger siblings inside any [data-stagger] container. */
      $$("[data-stagger]").forEach(function (group) {
        var step = parseFloat(group.getAttribute("data-stagger")) || 0.07;
        $$("[data-reveal]", group).forEach(function (child, i) {
          child.style.setProperty("--reveal-delay", (i * step).toFixed(3) + "s");
        });
      });

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

      items.forEach(function (i) { io.observe(i); });
    }
  };

  /* -------------------------------------------------------------- splitText
     Wraps every word so headlines rise in sequence. Two modes:
       data-split          lines delimited by <br>, each masked by overflow
       data-split="soft"   natural wrapping, no mask — for long paragraphs

     It walks the DOM rather than slicing innerHTML, so inline markup such as
     <em> or <span class="dim"> survives intact around the generated words. */
  function splitNode(node, counter) {
    if (node.nodeType === 3) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (token) {
        if (!token) return;
        if (/^\s+$/.test(token)) { frag.appendChild(document.createTextNode(" ")); return; }
        var word = document.createElement("span");
        word.className = "reveal-word";
        word.textContent = token;
        word.style.setProperty("--wd", (counter.i * 0.042).toFixed(3) + "s");
        counter.i++;
        frag.appendChild(word);
      });
      return frag;
    }
    if (node.nodeType === 1) {
      var clone = node.cloneNode(false);
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        clone.appendChild(splitNode(child, counter));
      });
      return clone;
    }
    return document.createTextNode("");
  }

  var SplitText = {
    init: function () {
      var targets = $$("[data-split]");
      if (!targets.length) return;

      targets.forEach(function (node) {
        if (reduced.matches) { node.classList.add("is-in"); return; }

        var soft = node.getAttribute("data-split") === "soft";
        var counter = { i: 0 };

        var source = document.createElement("div");
        source.innerHTML = node.innerHTML;
        node.innerHTML = "";

        /* Group the original nodes into lines, breaking on <br>. */
        var lines = [[]];
        Array.prototype.slice.call(source.childNodes).forEach(function (child) {
          if (child.nodeType === 1 && child.tagName === "BR") { lines.push([]); return; }
          lines[lines.length - 1].push(child);
        });

        lines.forEach(function (parts) {
          if (!parts.length) return;
          var lineEl = document.createElement("span");
          lineEl.className = soft ? "reveal-soft" : "reveal-line";
          parts.forEach(function (p) { lineEl.appendChild(splitNode(p, counter)); });
          node.appendChild(lineEl);
        });

        if (!("IntersectionObserver" in window)) { node.classList.add("is-in"); return; }
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          });
        }, { threshold: 0.15 });
        io.observe(node);
      });
    }
  };

  /* --------------------------------------------------------------- counters */
  /* The markup carries the finished number, not a zero. If this file never
     runs — blocked, cached badly, an error higher up the module — the page
     still reads "25+ years" rather than "0+ years", which is the worst thing
     a visitor could see on a company that has been trading since 2000. The
     count-up is therefore an enhancement: it resets the node to zero only at
     the point it has committed to animating it. */
  var Counters = {
    init: function () {
      var nodes = $$("[data-count]");
      if (!nodes.length) return;
      if (reduced.matches || !("IntersectionObserver" in window)) return;

      nodes.forEach(function (n) { n.textContent = "0"; });

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          Counters.run(e.target);
          io.unobserve(e.target);
        });
      }, { threshold: 0.5 });
      nodes.forEach(function (n) { io.observe(n); });
    },
    run: function (node) {
      var target = parseFloat(node.getAttribute("data-count"));
      var dur = parseInt(node.getAttribute("data-count-dur"), 10) || 1600;

      /* An animation frame never arrives while the page is hidden, so a
         count-up that starts in a background tab would sit on zero until the
         visitor came back. Nobody is watching it, so just land on the number. */
      if (document.hidden) {
        node.textContent = target.toLocaleString("en-US");
        return;
      }

      var start = performance.now();
      var ease = function (t) { return 1 - Math.pow(1 - t, 4); };

      var step = function (now) {
        var t = clamp((now - start) / dur, 0, 1);
        var value = Math.round(target * ease(t));
        node.textContent = value.toLocaleString("en-US");
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  };

  /* ---------------------------------------------------------------- lattice
     The hero canvas. A grid of nodes wired to their neighbours; the pointer
     pushes them apart and lights the links nearby, and red packets travel the
     wires at random. It is literally a picture of systems integration. */
  var Lattice = {
    init: function () {
      var canvas = $("[data-lattice]");
      if (!canvas) return;
      if (reduced.matches) { canvas.style.display = "none"; return; }

      var ctx = canvas.getContext("2d", { alpha: true });
      if (!ctx) return;

      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = 0, H = 0, nodes = [], links = [], packets = [];
      var pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
      var running = true, rafId = null;

      function build() {
        var rect = canvas.getBoundingClientRect();
        W = rect.width; H = rect.height;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        var gap = W < 700 ? 78 : W < 1200 ? 92 : 104;
        var cols = Math.ceil(W / gap) + 2;
        var rows = Math.ceil(H / gap) + 2;

        nodes = [];
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            /* Jitter breaks the machine-perfect grid just enough to feel built. */
            var jx = (Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
            var jy = (Math.sin(c * 39.3468 + r * 11.135) * 24634.6345) % 1;
            var x = (c - 1) * gap + jx * gap * 0.34;
            var y = (r - 1) * gap + jy * gap * 0.34;
            nodes.push({ ox: x, oy: y, x: x, y: y, vx: 0, vy: 0, r: r, c: c, cols: cols,
              pulse: Math.random() * Math.PI * 2 });
          }
        }

        /* Wire right + down only, so each link is stored once. */
        links = [];
        nodes.forEach(function (n, i) {
          if (n.c < cols - 1) links.push([i, i + 1]);
          if (n.r < rows - 1) links.push([i, i + cols]);
        });

        packets = [];
        var count = Math.min(36, Math.round(links.length / 16));
        for (var p = 0; p < count; p++) packets.push(newPacket());
      }

      function newPacket() {
        return {
          link: Math.floor(Math.random() * links.length),
          t: Math.random(),
          speed: 0.0016 + Math.random() * 0.0042,
          life: 0
        };
      }

      function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);

        pointer.x = lerp(pointer.x, pointer.tx, 0.09);
        pointer.y = lerp(pointer.y, pointer.ty, 0.09);

        /* Two slow "hot zones" drift across the lattice on their own, so the
           hero glows even before anyone moves the mouse. */
        var now = performance.now() / 1000;
        var hz = [
          { x: W * (0.68 + Math.sin(now * 0.11) * 0.22), y: H * (0.32 + Math.cos(now * 0.14) * 0.2), r: 380 },
          { x: W * (0.25 + Math.cos(now * 0.09) * 0.2), y: H * (0.62 + Math.sin(now * 0.12) * 0.18), r: 300 }
        ];
        function heat(x, y) {
          var h = 0;
          for (var q = 0; q < hz.length; q++) {
            var ex = x - hz[q].x, ey = y - hz[q].y;
            h = Math.max(h, 1 - Math.sqrt(ex * ex + ey * ey) / hz[q].r);
          }
          return h > 0 ? h * h : 0;
        }

        /* Soft red blooms under the hot zones. */
        for (var z = 0; z < hz.length; z++) {
          var bg = ctx.createRadialGradient(hz[z].x, hz[z].y, 0, hz[z].x, hz[z].y, hz[z].r);
          bg.addColorStop(0, "rgba(225,29,46," + (z ? 0.16 : 0.22) + ")");
          bg.addColorStop(0.5, "rgba(225,29,46,0.06)");
          bg.addColorStop(1, "rgba(225,29,46,0)");
          ctx.fillStyle = bg;
          ctx.fillRect(hz[z].x - hz[z].r, hz[z].y - hz[z].r, hz[z].r * 2, hz[z].r * 2);
        }

        var R = 190, R2 = R * R;

        /* Displace nodes away from the pointer, spring them home. */
        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          var dx = n.x - pointer.x, dy = n.y - pointer.y;
          var d2 = dx * dx + dy * dy;
          if (pointer.active && d2 < R2) {
            var d = Math.sqrt(d2) || 1;
            var force = (1 - d / R) * 16;
            n.vx += (dx / d) * force * 0.08;
            n.vy += (dy / d) * force * 0.08;
          }
          n.vx += (n.ox - n.x) * 0.045;
          n.vy += (n.oy - n.y) * 0.045;
          n.vx *= 0.86; n.vy *= 0.86;
          n.x += n.vx; n.y += n.vy;
          n.pulse += 0.012;
        }

        /* Links — brightness falls off with distance from the pointer. */
        ctx.lineWidth = 1;
        for (var l = 0; l < links.length; l++) {
          var a = nodes[links[l][0]], b = nodes[links[l][1]];
          var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
          var pdx = mx - pointer.x, pdy = my - pointer.y;
          var pd = Math.sqrt(pdx * pdx + pdy * pdy);
          var near = Math.max(pointer.active ? clamp(1 - pd / 300, 0, 1) : 0, heat(mx, my) * 0.75);

          var base = 0.085;
          ctx.strokeStyle = near > 0.02
            ? "rgba(225," + Math.round(29 + near * 40) + "," + Math.round(46 + near * 40) + "," + (base + near * 0.6).toFixed(3) + ")"
            : "rgba(255,255,255," + base + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }

        /* Nodes */
        for (var j = 0; j < nodes.length; j++) {
          var nd = nodes[j];
          var ndx = nd.x - pointer.x, ndy = nd.y - pointer.y;
          var ndist = Math.sqrt(ndx * ndx + ndy * ndy);
          var glow = Math.max(pointer.active ? clamp(1 - ndist / 240, 0, 1) : 0, heat(nd.x, nd.y) * 0.85);
          var breathe = 0.5 + Math.sin(nd.pulse) * 0.5;
          var size = 1 + glow * 2.1;

          if (glow > 0.04) {
            if (glow > 0.3) {
              var ng = ctx.createRadialGradient(nd.x, nd.y, 0, nd.x, nd.y, 10 * glow);
              ng.addColorStop(0, "rgba(255,59,78," + (0.5 * glow).toFixed(3) + ")");
              ng.addColorStop(1, "rgba(255,59,78,0)");
              ctx.fillStyle = ng;
              ctx.beginPath(); ctx.arc(nd.x, nd.y, 10 * glow, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = "rgba(255,59,78," + (0.3 + glow * 0.7).toFixed(3) + ")";
          } else {
            ctx.fillStyle = "rgba(255,255,255," + (0.16 + breathe * 0.16).toFixed(3) + ")";
          }
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, size, 0, Math.PI * 2);
          ctx.fill();
        }

        /* Red packets travelling the wires */
        for (var p = 0; p < packets.length; p++) {
          var pk = packets[p];
          var lk = links[pk.link];
          if (!lk) { packets[p] = newPacket(); continue; }
          var na = nodes[lk[0]], nb = nodes[lk[1]];
          pk.t += pk.speed;
          if (pk.t >= 1) { packets[p] = newPacket(); continue; }

          var px = lerp(na.x, nb.x, pk.t);
          var py = lerp(na.y, nb.y, pk.t);
          var fade = Math.sin(pk.t * Math.PI);

          /* Light the wire behind the packet. */
          var tg = ctx.createLinearGradient(na.x, na.y, px, py);
          tg.addColorStop(0, "rgba(225,29,46,0)");
          tg.addColorStop(1, "rgba(255,59,78," + (0.75 * fade).toFixed(3) + ")");
          ctx.strokeStyle = tg;
          ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(px, py); ctx.stroke();
          ctx.lineWidth = 1;

          var grad = ctx.createRadialGradient(px, py, 0, px, py, 22);
          grad.addColorStop(0, "rgba(255,59,78," + (0.95 * fade).toFixed(3) + ")");
          grad.addColorStop(0.4, "rgba(225,29,46," + (0.35 * fade).toFixed(3) + ")");
          grad.addColorStop(1, "rgba(255,59,78,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(px, py, 22, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "rgba(255,225,228," + fade.toFixed(3) + ")";
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        rafId = requestAnimationFrame(frame);
      }

      /* Pointer tracking on the hero, not the whole document. */
      var host = canvas.closest(".hero") || canvas.parentElement;
      host.addEventListener("pointermove", function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer.tx = e.clientX - rect.left;
        pointer.ty = e.clientY - rect.top;
        pointer.active = true;
      });
      host.addEventListener("pointerleave", function () {
        pointer.active = false;
        pointer.tx = -9999; pointer.ty = -9999;
      });

      var resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 180);
      });

      /* Stop burning frames once the hero scrolls away. */
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && !running) { running = true; frame(); }
            else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(rafId); }
          });
        }, { threshold: 0.01 }).observe(canvas);
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { running = false; cancelAnimationFrame(rafId); }
        else if (!running) { running = true; frame(); }
      });

      build();
      frame();
    }
  };

  /* ---------------------------------------------------------------- process
     Pins the section and scrubs through the four delivery stages as the page
     scrolls, with a progress fill per stage on the rail beneath. */
  var Process = {
    init: function () {
      var root = $("[data-process]");
      if (!root) return;
      var stages = $$("[data-stage]", root);
      var ticks = $$("[data-tick]", root);
      if (!stages.length) return;

      var setActive = function (idx, local) {
        stages.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
        ticks.forEach(function (t, i) {
          t.classList.toggle("is-active", i === idx);
          t.style.setProperty("--fill", i < idx ? 1 : i === idx ? local.toFixed(3) : 0);
        });
        var ghost = $("[data-ghost]", root);
        if (ghost) ghost.textContent = String(idx + 1).padStart(2, "0");
      };

      /* Only claim the pinned treatment when this module is going to drive it.
         The stylesheet keys the absolute positioning off this attribute, so
         leaving it unset guarantees the stages stay a readable stacked list
         rather than four blocks rendered on top of each other. */
      var canPin = !reduced.matches && window.innerWidth >= 900;
      root.setAttribute("data-process-mode", canPin ? "pinned" : "stacked");

      if (!canPin) {
        stages.forEach(function (s) { s.classList.add("is-active"); });
        ticks.forEach(function (t) {
          t.classList.add("is-active");
          t.style.setProperty("--fill", 1);
        });
        return;
      }

      var onScroll = function () {
        var rect = root.getBoundingClientRect();
        var total = root.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        var progress = clamp(-rect.top / total, 0, 0.9999);
        var scaled = progress * stages.length;
        var idx = Math.floor(scaled);
        setActive(clamp(idx, 0, stages.length - 1), scaled - idx);
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      setActive(0, 0);
      onScroll();
    }
  };

  /* ------------------------------------------------------------------- tabs */
  var Tabs = {
    init: function () {
      $$("[data-tabs]").forEach(function (root) {
        var btns = $$("[role=tab]", root);
        var panes = $$("[role=tabpanel]", root);
        if (!btns.length) return;

        var select = function (i) {
          btns.forEach(function (b, k) {
            b.setAttribute("aria-selected", k === i ? "true" : "false");
            b.setAttribute("tabindex", k === i ? "0" : "-1");
          });
          panes.forEach(function (p, k) { p.classList.toggle("is-active", k === i); });
        };

        btns.forEach(function (b, i) {
          b.addEventListener("click", function () { select(i); });
          if (finePointer.matches) {
            b.addEventListener("mouseenter", function () { select(i); });
          }
          b.addEventListener("keydown", function (e) {
            var dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1
                    : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
            if (!dir) return;
            e.preventDefault();
            var next = (i + dir + btns.length) % btns.length;
            select(next);
            btns[next].focus();
          });
        });

        select(0);
      });
    }
  };

  /* ----------------------------------------------------------------- filter */
  var Filter = {
    init: function () {
      var root = $("[data-filter-root]");
      if (!root) return;
      var chips = $$("[data-filter]", root);
      var cards = $$("[data-group]", root);
      var count = $("[data-filter-count]", root);

      var apply = function (key) {
        var shown = 0;
        cards.forEach(function (card) {
          var match = key === "all" || card.getAttribute("data-group") === key;
          card.classList.toggle("is-hidden", !match);
          if (match) shown++;
        });
        chips.forEach(function (c) {
          c.setAttribute("aria-pressed", c.getAttribute("data-filter") === key ? "true" : "false");
        });
        if (count) count.textContent = String(shown).padStart(2, "0");
      };

      chips.forEach(function (chip) {
        chip.addEventListener("click", function () { apply(chip.getAttribute("data-filter")); });
      });
      apply("all");
    }
  };

  /* --------------------------------------------------------------- magnetic */
  var Magnetic = {
    init: function () {
      if (!finePointer.matches || reduced.matches) return;
      $$("[data-magnetic]").forEach(function (node) {
        var strength = parseFloat(node.getAttribute("data-magnetic")) || 0.28;

        node.addEventListener("pointermove", function (e) {
          var r = node.getBoundingClientRect();
          var x = e.clientX - (r.left + r.width / 2);
          var y = e.clientY - (r.top + r.height / 2);
          node.style.transform = "translate(" + (x * strength).toFixed(2) + "px," + (y * strength).toFixed(2) + "px)";
        });
        node.addEventListener("pointerleave", function () { node.style.transform = ""; });
      });
    }
  };

  /* ----------------------------------------------------------------- cursor */
  var Cursor = {
    init: function () {
      if (!finePointer.matches || reduced.matches) return;
      var ring = document.createElement("div");
      ring.className = "cursor";
      ring.setAttribute("aria-hidden", "true");
      document.body.appendChild(ring);

      var x = 0, y = 0, tx = 0, ty = 0, started = false, rafId = null;

      /* Hiding the ring is the half that matters. `pointerleave` does not
         bubble, so listening for it on `document` meant it never fired once:
         the moment the mouse left the window the ring simply froze wherever it
         happened to be and stayed there as a red circle parked in the middle
         of the page. Watch the element the pointer actually leaves, and cover
         the cases that produce no leave event at all — alt-tabbing away, and
         the window being hidden. */
      var show = function () {
        if (!started) return;
        ring.classList.add("is-active");
        if (rafId === null) loop();
      };
      var hide = function () {
        ring.classList.remove("is-active");
        ring.classList.remove("is-hot");
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      };

      function loop() {
        x = lerp(x, tx, 0.2);
        y = lerp(y, ty, 0.2);
        ring.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        rafId = requestAnimationFrame(loop);
      }

      document.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        tx = e.clientX; ty = e.clientY;
        if (!started) { x = tx; y = ty; started = true; }
        show();
        /* Guard the target: closest() only exists on elements, and a pointer
           event can carry the document itself as its target. */
        var t = e.target;
        var hot = t && t.closest &&
          t.closest("a, button, [role=tab], .sol-card, .case-card, .ind-panel");
        ring.classList.toggle("is-hot", !!hot);
      });

      /* Leaving through the edge of the window. */
      document.documentElement.addEventListener("pointerleave", hide);
      /* Leaving into browser chrome or another window: relatedTarget is null. */
      document.addEventListener("pointerout", function (e) {
        if (!e.relatedTarget) hide();
      });
      window.addEventListener("blur", hide);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) hide();
      });
    }
  };

  /* --------------------------------------------------------------- progress */
  var Progress = {
    init: function () {
      var rail = document.createElement("div");
      rail.className = "progress-rail";
      rail.setAttribute("aria-hidden", "true");
      var bar = document.createElement("div");
      bar.className = "progress-rail__bar";
      rail.appendChild(bar);
      document.body.appendChild(rail);

      var update = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
        bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
      };
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      update();
    }
  };

  /* ---------------------------------------------------------------- curtain
     A red wipe between pages. Same-origin, same-tab, plain left-clicks only —
     modified clicks and downloads fall through to the browser untouched. */
  var Curtain = {
    init: function () {
      var curtain = document.createElement("div");
      curtain.className = "curtain is-in";
      curtain.setAttribute("aria-hidden", "true");
      document.body.appendChild(curtain);

      /* Retract on the next painted frame. The timeout is not redundant:
         requestAnimationFrame does not fire in a background tab, so a page
         opened in one would sit under a full-bleed red panel until it was
         focused. Whichever fires first wins; both are idempotent. */
      var lift = function () {
        curtain.classList.remove("is-in");
        curtain.classList.add("is-out");
      };
      requestAnimationFrame(function () { requestAnimationFrame(lift); });
      setTimeout(lift, 120);

      if (reduced.matches) return;

      document.addEventListener("click", function (e) {
        var a = e.target.closest("a");
        if (!a) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (a.target === "_blank" || a.hasAttribute("download")) return;

        var href = a.getAttribute("href") || "";
        if (!href || href.charAt(0) === "#" || /^(mailto:|tel:|javascript:)/i.test(href)) return;

        var url;
        try { url = new URL(a.href, location.href); } catch (err) { return; }
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.hash) return;

        e.preventDefault();
        curtain.classList.remove("is-out");
        curtain.classList.add("is-in");
        setTimeout(function () { location.href = a.href; }, 420);
      });

      /* Coming back via the bfcache must not leave the curtain down. */
      window.addEventListener("pageshow", function (e) {
        if (!e.persisted) return;
        curtain.classList.remove("is-in");
        curtain.classList.add("is-out");
      });
    }
  };

  /* ------------------------------------------------------------------ forms */
  var Forms = {
    init: function () {
      $$("[data-validate]").forEach(function (form) {
        var note = $("[data-form-note]", form);

        var showError = function (field, msg) {
          var slot = $(".field__err", field.closest(".field") || form);
          if (slot) slot.textContent = msg || "";
          field.setAttribute("aria-invalid", msg ? "true" : "false");
        };

        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var ok = true;

          $$("[required]", form).forEach(function (field) {
            var v = (field.value || "").trim();
            if (!v) { showError(field, "This field is required."); ok = false; return; }
            if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
              showError(field, "Enter a valid business email address."); ok = false; return;
            }
            showError(field, "");
          });

          if (!ok) {
            var firstBad = $('[aria-invalid="true"]', form);
            if (firstBad) firstBad.focus();
            return;
          }

          /* No backend is wired up yet — see README for the hand-off options. */
          if (note) {
            note.classList.add("is-shown");
            note.focus();
          }
          form.reset();
        });

        $$("input, textarea", form).forEach(function (field) {
          field.addEventListener("input", function () {
            if (field.getAttribute("aria-invalid") === "true") showError(field, "");
          });
        });
      });
    }
  };

  /* -------------------------------------------------------------- year stamp */
  function stampYear() {
    $$("[data-year]").forEach(function (n) { n.textContent = new Date().getFullYear(); });
  }

  /* ------------------------------------------------------------------- boot */
  function boot() {
    Theme.init();
    NavChrome.init();
    Reveal.init();
    SplitText.init();
    Counters.init();
    Lattice.init();
    Process.init();
    Tabs.init();
    Filter.init();
    Magnetic.init();
    Cursor.init();
    Progress.init();
    Curtain.init();
    Forms.init();
    stampYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
