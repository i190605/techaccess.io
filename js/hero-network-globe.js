/* ============================================================================
   TECHACCESS PAKISTAN — Hero network globe
   ----------------------------------------------------------------------------
   A dot-matrix Earth built from a 1-degree land mask (Natural Earth 1:110m,
   public domain), turned so Pakistan faces the viewer. Pakistan itself is
   drawn in red at higher density; the four offices pulse; a domestic ring
   links them; and arcs run out to the headquarters of the global partners
   listed on this page. Each arc carries a travelling signal.

   Interaction: drag to spin (it springs back to Pakistan), pointer tilt.
   Performance: renders only while on screen, lower density on phones, a
   single draw call per layer. Reduced motion: one still frame.
   Fallback: no WebGL -> a CSS sphere, the page is otherwise unchanged.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------ rotating headline word */
  var rot = document.querySelector("[data-hx-rot]");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (rot && !reduced) {
    var words = [].slice.call(rot.children), wi = 0;
    setInterval(function () {
      if (document.hidden) return;
      var cur = words[wi];
      wi = (wi + 1) % words.length;
      var nxt = words[wi];
      cur.classList.remove("is-on");
      cur.classList.add("is-out");
      nxt.classList.remove("is-out");
      nxt.classList.add("is-on");
      setTimeout(function () { cur.classList.remove("is-out"); }, 800);
    }, 2800);
  }

  /* ------------------------------------------------------------------ globe */
  var host = document.querySelector("[data-hx-globe]");
  if (!host) return;
  var canvas = host.querySelector(".hx__canvas");
  var labelLayer = host.querySelector(".hx__labels");
  function fallback() { host.setAttribute("data-mode", "fallback"); }
  if (!window.THREE || !canvas) return fallback();
  try {
    var probe = document.createElement("canvas");
    if (!(probe.getContext("webgl") || probe.getContext("experimental-webgl"))) return fallback();
  } catch (e) { return fallback(); }

  var T = window.THREE, D = Math.PI / 180;
  var small = window.innerWidth < 700;

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { return fallback(); }
  host.setAttribute("data-mode", "live");
  renderer.setClearColor(0x000000, 0);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 4.9);

  var tilt = new T.Group();   /* x rotation: latitude */
  var spin = new T.Group();   /* y rotation: longitude */
  tilt.add(spin);
  scene.add(tilt);

  var RED = new T.Color(0xe11d2e), RED_HI = new T.Color(0xff3b4e);

  function ll(lat, lon, r) {
    var phi = (90 - lat) * D, th = (lon + 180) * D;
    return new T.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  }

  /* --- land mask --- */
  var MASK = atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg/wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA/v8/AOD//z8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+///D/////5//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPAH/j/+//////8PAAAAgB0AAHgAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAOD//wP8//////8BAACAfx4AAAAAAAAAAP4AAAAAAAAAAAAAAAAAAAAAAAA4+I73//n///////8AAAAAfwAAAAAAAAAAAAAfAAAAAAAAAAAAAAAAAAAAAOAQACDwP4D///////8BAAAAPAQAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAAAAADzAgPP5H8D//////38AAAAAAAAAAAAA4AEAAAD+DwAAAAAAAAAAAAAAAAAAAIC/g7PfBwAA/v////8AAAAAAAAAAADgBwAAwP//PwAA4B8AAAAAAAAAAAAAAAAMAAB8AgAA+P////8AAAAAAAAAAABwAAAA/P//AwAAAAAAAAAAAAAAAAAAAP8Ahvc5OwAA8P///38AAAAAAAAAAAAcAADg////34cHAAcAAAAAAAAAAAAAgN9/xzf8RwAA4P///z8AAAAAAAAAAAAPAB7g//////8fgD8AAAAAAQAAAAAAAO//B3f8/wsA4P///z8AAAAAAAAAAAAPAG////////8f2f8HAAAAAAD4HwAAAAD4H/D4/38A4P///xMAAAAAAPAHAAAAgN//////////////DwAAAAD+///h/4//H+/Bg/8BwP7//w8AAAAAwP8fAAAAj9///////////////88/A+D///////8DB8TPB/4AAP///wAAAAAA8P//AwDjf77/////////////////DwD////////////vh/kPwP//BwAAAAAA/P//H/P//5//////////////////34H8////////////Afw/gP//AQAQAAAA/v8fH////+///////////////////vD///////////9fAPwYgP8PAOA/AAAA/+N/8P//////////////////////QID4///////////Pw/0DAP8HAMAfAACA//F//v////////////////////8/AAP4///////////BBPAHAP4HAAAAAADg//z///////////////////////9/AID///////////8AQ4ABAPwBAAAAAAD8P/7///////////////////////9fAMD//////////z8AwA8AAPgBAAAAAAD+H/7/////////////////////Of8BAID///z//////z8AwD8AAMABAAAAAAD+P/z///////////////////9/wH8AAAD8MwD//////x8AwH8MAAAAAAAAAAD+P2D///////////////////95cAAAAACAAwD8/////38AwP8eAAAAAAAAgAGcH/D//////////////////wEAOAAAAADADgDA/////38AgP8/AAAAAAAAwANAH/T//////////////////wAAfgAAAAAwAAAA//////8PgP8/AAAAAAAAwAFwD/7/////////////////PwAAfwAAAAAGAAAA//////8/wP//AAAAAAAAwAOwA/7/////////////////DwCAPwAAAIAAAAAA/v//////8///BwAAAAAAOAcgcP//////////////////HwAAHwAAAAAAAACA+P//////4///DwAAAAAAOA74/////////////////////wUADwAAAAAAAAAA8P//////4///DwAAAAAAGD///////////////////////wUAAwAAAAAAAAAA8P//////7///FwAAAAAAAB///////////////////////wUAAgAAAAAAAAAA0P//////////DAAAAAAAgOH//////////////////////w0AAAAAAAAAAAAAYP////////8xLAAAAAAAAPz//////////////////////wwAAAAAAAAAAAAAAP7//////38HfgAAAAAAgP///////////////////////wQAAAAAAAAAAAAAAP3///////8HUAAAAAAAAP7/////////////////////fwQAAAAAAAAAAAAAAP////////+XAAAAAAAAAPz///93/D/+////////////PwwAAAAAAAAAAAAAAP////////9/AAAAAAAAAPj//f9j/g/+////////////HwAAAAAAAAAAAAAAAP////////8MAAAAAAAAAPj/+P8B/Mf/////////////DwQAAAAAAAAAAAAAAP///////z8AAAAAAAAAcPzH8/8A8I//////////////Bx4AAAAAAAAAAAAAAP///////x8AAAAAAAAA+H+Aw/8AwA/+//////////9/AA8AAAAAAAAAAAAAAP///////x8AAAAAAAAA+D8Aj//w4R/8//////////8/AAAAAAAAAAAAAAAAAP///////wMAAAAAAAAA+B8wuE/+/z/+/////////98fAAMAAAAAAAAAAAAAAP///////wMAAAAAAAAA+A8wEMf//x/+/////////0cOAAMAAAAAAAAAAAAAAP7//////wEAAAAAAAAA+A8AAM7//x/8/////////wMOAAEAAAAAAAAAAAAAAP7//////wAAAAAAAAAA+AcABob//z/8/////////zccwAEAAAAAAAAAAAAAAPz//////wAAAAAAAAAAQOB/AAQ2/////////////x8c8AEAAAAAAAAAAAAAAPj//////wAAAAAAAAAAQPx/AAAA/////////////w8Y/gEAAAAAAAAAAAAAAPD/////fwAAAAAAAAAA4P8/AAAA/////////////w+EGwAAAAAAAAAAAAAAAMD/////HwAAAAAAAAAA8P9/AACA/////////////x/AAwAAAAAAAAAAAAAAAID/////DwAAAAAAAAAA+P//BwaA/////////////x/AAAAAAAAAAAAAAAAAAID9////BwAAAAAAAAAA/P//D3+E/////////////z9AAAAAAAAAAAAAAAAAAAD5////BwAAAAAAAAAA/P//f////////////////x8AAAAAAAAAAAAAAAAAAADy/x8GBgAAAAAAAAAA/P/////v/8///////////z8AAAAAAAAAAAAAAAAAAAD0/w8ABgAAAAAAAAAA/v////+//4///////////z8AAAAAAAAAAAAAAAAAAADu/wcADgAAAAAAAACA//////8f/x/+/////////x8AAAAAAAAAAAAAAAAAAACI/wcALAAAAAAAAADA//////8//z/g/////////w8AAAAAAAAAAAAAAAAAAACQ/wcACAAAAAAAAADg//////9//r+A/////////wcAAAAAAAAAAAAAAAAAAAAQ/wMAAAAAAAAAAADg//////9//n8cgP///////ycAAAAAAAAAAAAAAAAAAAAA/gMAAAAAAAAAAADw////////+P9/AP///////xEAAAAAAAAAAAAAAAAAAAAA/AMAHQAAAAAAAADw////////+P//APz/f///fxAAAAAAAAAAAAAAAAAAAAAA+AcAYAAAAAAAAAD4////////+f9/APz/B///BgAAAAAAAAAAAAAAAAAAAAAA/AccgAEAAAAAAADw////////8f9/AOD/B/5/AAAAAAAAAAAAAAAAAQAAAAAA+A8eADgAAAAAAADw////////4f8/AOD/Afw/BgAAAAAAAAAAAAAAAAAAAAAA8J8PAPwCAAAAAADw////////4/8fAOD/APw/AgAAAAAAAAAAAAAAAAAAAAAAgP8PAAAAAAAAAADw////////x/8HAOB/APx/ADAAAAAAAAAAAAAAAAAAAAAAAP4PAAAAAAAAAAD4////////h/8BAOA/APz/ADAAAAAAAAAAAAAAAAAAAAAAAID/AAAAAAAAAAD4////////j/8AAMAPAMD/ATAAAAAAAAAAAAAAAAAAAAAAAAD/AQAAAAAAAAD4////////nx8AAMAPAMD/ATAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAD4////////vwcAAIAPAMD/AcAAAAAAAAAAAAAAAAAAAAAAAADgAQAAAAAAAAD4////////fwAAAIAPAMD8AQABAAAAAAAAAAAAAAAAAAAAAADAAAgAAAAAAADw////////f2AAAAAPAID4AUACAAAAAAAAAAAAAAAAAAAAAADAAe9TAAAAAADg/////////34AAAAPAEBwAAgAAAAAAAAAAAAAAAAAAAAAAAAAE+9/AAAAAADA/////////38AAAAXAEAgAAQCAAAAAAAAAAAAAAAAAAAAAAAAz///AAAAAACA/////////z8AAAASAMAAAIACAAAAAAAAAAAAAAAAAAAAAAAAyP//AQAAAACA/////////z8AAAAwAIAAAEAHAAAAAAAAAAAAAAAAAAAAAAAAgP//AwAAAAAA/v///////x8AAAAwAAADAAMBAAAAAAAAAAAAAAAAAAAAAAAAwP//fwAAAAAA/A/+/////x8AAAAAAAAHAAcAAAAAAAAAAAAAAAAAAAAAAAAAgP///wAAAAAAEAD8/////w8AAAAAADAGwAcAAAAAAAAAAAAAAAAAAAAAAAAAgP///wEAAAAAAADA/////wcAAAAAAGAG4AEAAAAAAAAAAAAAAAAAAAAAAAAA4P///wEAAAAAAADA/////wMAAAAAAMAM+AMAAAAAAAAAAAAAAAAAAAAAAAAA4P///wMAAAAAAADg/////wEAAAAAAIAL/gMQAAAAAAAAAAAAAAAAAAAAAAAA8P///wMAAAAAAADg////fwAAAAAAAIAH/vMQAAAAAAAAAAAAAAAAAAAAAAAA8P///wcAAAAAAADg////PwAAAAAAAAAP/gMAAQAAAAAAAAAAAAAAAAAAAAAA+P///38AAAAAAADg////PwAAAAAAAAAO/DmAAwAAAAAAAAAAAAAAAAAAAAAA+P///38BAAAAAADA////HwAAAAAAAAA+/DkA8gAAAAAAAAAAAAAAAAAAAAAA8P////8fAAAAAACA////DwAAAAAAAAA8wChE/gcAAAAAAAAAAAAAAAAAAAAA+P////8/AAAAAACA////BwAAAAAAAAA4AEAA8B8AAAAAAAAAAAAAAAAAAAAA+P//////AQAAAAAA////BwAAAAAAAAAwAEAAxD8NAAAAAAAAAAAAAAAAAAAA+P//////AQAAAAAA////BwAAAAAAAADAAQAAxP+AAAAAAAAAAAAAAAAAAAAA8P//////AQAAAAAA/v//BwAAAAAAAACAHwAAwH8ABAAAAAAAAAAAAAAAAAAA4P//////AQAAAAAA/v//BwAAAAAAAAAAQFYEAMcAAAAAAAAAAAAAAAAAAAAA4P//////AAAAAAAA/v//DwAAAAAAAAAAAAgBAIABMAAAAAAAAAAAAAAAAAAAwP//////AAAAAAAA/v//DwAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAgP////9/AAAAAAAA/P//DwAAAAAAAAAAAAAAAQQAAAAAAAAAAAAAAAAAAAAAgP////8/AAAAAAAA/v//HyAAAAAAAAAAAACAHwQAAAAAAAAAAAAAAAAAAAAAAP////8fAAAAAAAA/v//HyAAAAAAAAAAAADADwwAAAAAAAAAAAAAAAAAAAAAAP////8fAAAAAAAA////HzAAAAAAAAAAAADsDxwAAAAAAAAAAAAAAAAAAAAAAP7///8fAAAAAAAA////DzgAAAAAAAAAAAD/DxwAAAAAAAAAAAAAAAAAAAAAAPj///8fAAAAAAAA////Dz8AAAAAAAAAAAD/Pz4AAAiAAAAAAAAAAAAAAAAAAOD///8fAAAAAAAA////Ax8AAAAAAAAAAMD//z4AAABAAAAAAAAAAAAAAAAAAMD///8PAAAAAAAA////AB8AAAAAAAAAAMD//z8AAAAAAAAAAAAAAAAAAAAAAMD///8PAAAAAAAA/v9/AB8AAAAAAAAAAOD//38AAAAAAAAAAAAAAAAAAAAAAMD///8PAAAAAAAA/v9/AB8AAAAAAAAAAPz///8BAAEAAAAAAAAAAAAAAAAAAMD///8HAAAAAAAA/P9/gA8AAAAAAAAAgP////8BAAIAAAAAAAAAAAAAAAAAAMD///8DAAAAAAAA/P//gA8AAAAAAAAAwP////8DAAAAAAAAAAAAAAAAAAAAAMD//38AAAAAAAAA/P9/AA8AAAAAAAAAwP////8HAAAAAAAAAAAAAAAAAAAAAOD//x8AAAAAAAAA+P9/AAcAAAAAAAAA4P////8PAAAAAAAAAAAAAAAAAAAAAOD//w8AAAAAAAAA+P8fAAIAAAAAAAAAwP////8fAAAAAAAAAAAAAAAAAAAAAOD//wcAAAAAAAAA+P8fAAAAAAAAAAAA4P////8fAAAAAAAAAAAAAAAAAAAAAOD//wcAAAAAAAAA+P8fAAAAAAAAAAAAwP////8fAAAAAAAAAAAAAAAAAAAAAOD//wcAAAAAAAAA8P8PAAAAAAAAAAAAgP////8/AAAAAAAAAAAAAAAAAAAAAOD//wMAAAAAAAAA4P8HAAAAAAAAAAAAgP////8fAAAAAAAAAAAAAAAAAAAAAPD//wMAAAAAAAAA4P8HAAAAAAAAAAAAgP////8fAAAAAAAAAAAAAAAAAAAAAPD//wEAAAAAAAAAwP8DAAAAAAAAAAAAAP////8fAAAAAAAAAAAAAAAAAAAAAOD//wAAAAAAAAAAwP8BAAAAAAAAAAAAAP8D/P8PAAAAAAAAAAAAAAAAAAAAAPD/fwAAAAAAAAAAwH8AAAAAAAAAAAAAgP8A2P8HAAAAAAAAAAAAAAAAAAAAAPD/OwAAAAAAAAAAgAEAAAAAAAAAAAAAAAcA6P8HAAAAAAAAAAAAAAAAAAAAAPj/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwP8DAAACAAAAAAAAAAAAAAAAAPj/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8DAAAEAAAAAAAAAAAAAAAAAPz/BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8DAAAIAAAAAAAAAAAAAAAAAPj/AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGgAAAA4AAAAAAAAAAAAAAAAAPg/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAAAAAAAAAAAAAAAPw/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAPwHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAALAAAAAAAAAAAAAAAAAPwfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAIADAAAAAAAAAAAAAAAAAPgHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAMABAAAAAAAAAAAAAAAAAPwHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHgAAAAAAAAAAAAAAAAAAP4BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAP4DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4AAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAIAfAAAAAAAeeADADwAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAPD/AADA/////////z8AAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAgP///wH4//////////8DAAAAAAAAAAAAAAAAAAAAADAfAAAAAAAAAAAAAADw8////wP+////////////AwAAAAAAAAAAAAAAAAAAAHA/AAAAAAAAAAA8//P//////+D/////////////HwAAAAAAAAAAAAAAAAAAAP5+AAAAAAAA5v////////////D//////////////38AAAAAAAAAAAAAAAAAAAB+AAAAAACA/////////////////////////////38AAAAAAAAAYAYA4ON/OPh/AAAAAADw/////////////////////////////x8AAAAAAADwv/EXgP////8fAAAAAADw/////////////////////////////wMAAAAAAPz///////////8HAAAAAAD+/////////////////////////////wAAAAAAAPz//////////z8AAAAAAP///////////////////////////////wAAAADA/////////////wEAAAAA8P///////////////////////////////wAAAACH////////////PwAAAPgA/////////////////////////////////wcAAAAcgP//////////fwAAAP4BwP//////////////////////////////HwAAAAAAAP7//////////wf8wD8AwP//////////////////////////////DwAAAAAA/v////////////8HAAD4////////////////////////////////HwAAAAAA+P//////////////4f///////////////////////////////////wAAAAAA/P///////////////////////////////////////////////////x8A3x8AAP7///////////////////////////////////////////////////8/////f///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////");
  function isLand(lat, lon) {
    var r = Math.min(179, Math.max(0, Math.floor(90 - lat)));
    var c = ((Math.floor(lon + 180) % 360) + 360) % 360;
    var k = r * 360 + c;
    return (MASK.charCodeAt(k >> 3) >> (k & 7)) & 1;
  }
  var PK = [24.2,67.59,24.2,68.04,24.2,68.49,24.2,69.84,24.65,67.59,24.65,68.04,24.65,68.49,24.65,68.94,24.65,69.39,24.65,69.84,24.65,70.29,24.65,70.74,25.1,67.14,25.1,67.59,25.1,68.04,25.1,68.49,25.1,68.94,25.1,69.39,25.1,69.84,25.1,70.29,25.1,70.74,25.55,61.74,25.55,62.19,25.55,62.64,25.55,63.09,25.55,63.54,25.55,63.99,25.55,64.44,25.55,64.89,25.55,65.34,25.55,65.79,25.55,66.69,25.55,67.14,25.55,67.59,25.55,68.04,25.55,68.49,25.55,68.94,25.55,69.39,25.55,69.84,25.55,70.29,26,62.19,26,62.64,26,63.09,26,63.54,26,63.99,26,64.44,26,64.89,26,65.34,26,65.79,26,66.24,26,66.69,26,67.14,26,67.59,26,68.04,26,68.49,26,68.94,26,69.39,26,69.84,26.45,62.64,26.45,63.09,26.45,63.54,26.45,63.99,26.45,64.44,26.45,64.89,26.45,65.34,26.45,65.79,26.45,66.24,26.45,66.69,26.45,67.14,26.45,67.59,26.45,68.04,26.45,68.49,26.45,68.94,26.45,69.39,26.45,69.84,26.9,63.54,26.9,63.99,26.9,64.44,26.9,64.89,26.9,65.34,26.9,65.79,26.9,66.24,26.9,66.69,26.9,67.14,26.9,67.59,26.9,68.04,26.9,68.49,26.9,68.94,26.9,69.39,27.35,63.09,27.35,63.54,27.35,63.99,27.35,64.44,27.35,64.89,27.35,65.34,27.35,65.79,27.35,66.24,27.35,66.69,27.35,67.14,27.35,67.59,27.35,68.04,27.35,68.49,27.35,68.94,27.35,69.39,27.8,63.09,27.8,63.54,27.8,63.99,27.8,64.44,27.8,64.89,27.8,65.34,27.8,65.79,27.8,66.24,27.8,66.69,27.8,67.14,27.8,67.59,27.8,68.04,27.8,68.49,27.8,68.94,27.8,69.39,27.8,69.84,27.8,70.74,28.25,62.64,28.25,63.09,28.25,63.54,28.25,63.99,28.25,64.44,28.25,64.89,28.25,65.34,28.25,65.79,28.25,66.24,28.25,66.69,28.25,67.14,28.25,67.59,28.25,68.04,28.25,68.49,28.25,68.94,28.25,69.39,28.25,69.84,28.25,70.29,28.25,70.74,28.25,71.19,28.25,71.64,28.7,61.74,28.7,62.19,28.7,62.64,28.7,63.09,28.7,63.54,28.7,63.99,28.7,64.44,28.7,64.89,28.7,65.34,28.7,65.79,28.7,66.24,28.7,66.69,28.7,67.14,28.7,67.59,28.7,68.04,28.7,68.49,28.7,68.94,28.7,69.39,28.7,69.84,28.7,70.29,28.7,70.74,28.7,71.19,28.7,71.64,28.7,72.09,29.15,61.74,29.15,62.19,29.15,62.64,29.15,63.09,29.15,63.54,29.15,63.99,29.15,64.44,29.15,64.89,29.15,65.34,29.15,65.79,29.15,66.24,29.15,66.69,29.15,67.14,29.15,67.59,29.15,68.04,29.15,68.49,29.15,68.94,29.15,69.39,29.15,69.84,29.15,70.29,29.15,70.74,29.15,71.19,29.15,71.64,29.15,72.09,29.15,72.54,29.6,61.29,29.6,61.74,29.6,65.34,29.6,65.79,29.6,66.24,29.6,66.69,29.6,67.14,29.6,67.59,29.6,68.04,29.6,68.49,29.6,68.94,29.6,69.39,29.6,69.84,29.6,70.29,29.6,70.74,29.6,71.19,29.6,71.64,29.6,72.09,29.6,72.54,29.6,72.99,30.05,66.69,30.05,67.14,30.05,67.59,30.05,68.04,30.05,68.49,30.05,68.94,30.05,69.39,30.05,69.84,30.05,70.29,30.05,70.74,30.05,71.19,30.05,71.64,30.05,72.09,30.05,72.54,30.05,72.99,30.05,73.44,30.5,66.69,30.5,67.14,30.5,67.59,30.5,68.04,30.5,68.49,30.5,68.94,30.5,69.39,30.5,69.84,30.5,70.29,30.5,70.74,30.5,71.19,30.5,71.64,30.5,72.09,30.5,72.54,30.5,72.99,30.5,73.44,30.5,73.89,30.95,66.69,30.95,67.14,30.95,67.59,30.95,68.04,30.95,68.49,30.95,68.94,30.95,69.39,30.95,69.84,30.95,70.29,30.95,70.74,30.95,71.19,30.95,71.64,30.95,72.09,30.95,72.54,30.95,72.99,30.95,73.44,30.95,73.89,30.95,74.34,31.4,68.04,31.4,68.49,31.4,68.94,31.4,69.39,31.4,69.84,31.4,70.29,31.4,70.74,31.4,71.19,31.4,71.64,31.4,72.09,31.4,72.54,31.4,72.99,31.4,73.44,31.4,73.89,31.4,74.34,31.85,69.39,31.85,69.84,31.85,70.29,31.85,70.74,31.85,71.19,31.85,71.64,31.85,72.09,31.85,72.54,31.85,72.99,31.85,73.44,31.85,73.89,31.85,74.34,32.3,69.39,32.3,69.84,32.3,70.29,32.3,70.74,32.3,71.19,32.3,71.64,32.3,72.09,32.3,72.54,32.3,72.99,32.3,73.44,32.3,73.89,32.3,74.34,32.3,74.79,32.3,75.24,32.75,69.84,32.75,70.29,32.75,70.74,32.75,71.19,32.75,71.64,32.75,72.09,32.75,72.54,32.75,72.99,32.75,73.44,32.75,73.89,32.75,74.34,33.2,70.29,33.2,70.74,33.2,71.19,33.2,71.64,33.2,72.09,33.2,72.54,33.2,72.99,33.2,73.44,33.2,73.89,33.65,70.29,33.65,70.74,33.65,71.19,33.65,71.64,33.65,72.09,33.65,72.54,33.65,72.99,33.65,73.44,33.65,73.89,34.1,71.19,34.1,71.64,34.1,72.09,34.1,72.54,34.1,72.99,34.1,73.44,34.1,73.89,34.55,71.19,34.55,71.64,34.55,72.09,34.55,72.54,34.55,72.99,34.55,73.44,34.55,73.89,34.55,75.69,35,71.64,35,72.09,35,72.54,35,72.99,35,73.44,35,73.89,35,74.34,35,74.79,35,75.24,35,75.69,35,76.14,35,76.59,35.45,71.64,35.45,72.09,35.45,72.54,35.45,72.99,35.45,73.44,35.45,73.89,35.45,74.34,35.45,74.79,35.45,75.24,35.45,75.69,35.45,76.14,35.45,76.59,35.9,71.64,35.9,72.09,35.9,72.54,35.9,72.99,35.9,73.44,35.9,73.89,35.9,74.34,35.9,74.79,35.9,75.24,35.9,75.69,36.35,71.64,36.35,72.09,36.35,72.54,36.35,72.99,36.35,73.44,36.35,73.89,36.35,74.34,36.35,74.79,36.35,75.24,36.35,75.69,36.8,72.54,36.8,72.99,36.8,73.44,36.8,73.89,36.8,74.34,36.8,74.79,36.8,75.24];

  /* --- shared dot shader --- */
  var dotVert = [
    "attribute float aSize;",
    "attribute vec3 aColor;",
    "attribute float aSeed;",
    "uniform float uPx;",
    "uniform float uReveal;",
    "uniform float uTime;",
    "uniform float uTwinkle;",
    "varying vec3 vColor;",
    "varying float vFade;",
    "void main() {",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  vec3 n = normalize(normalMatrix * normalize(position));",
    "  float facing = dot(n, normalize(-mv.xyz));",
    "  vFade = smoothstep(0.0, 0.45, facing);",
    "  float tw = 1.0 + uTwinkle * 0.6 * sin(uTime * 2.4 + aSeed * 6.2831);",
    "  float rev = smoothstep(aSeed * 0.6, aSeed * 0.6 + 0.4, uReveal);",
    "  vColor = aColor;",
    "  gl_PointSize = aSize * uPx * tw * rev / -mv.z;",
    "  gl_Position = projectionMatrix * mv;",
    "}"
  ].join("\n");
  var dotFrag = [
    "uniform float uAlpha;",
    "varying vec3 vColor;",
    "varying float vFade;",
    "void main() {",
    "  float d = length(gl_PointCoord - 0.5);",
    "  float a = 1.0 - smoothstep(0.32, 0.5, d);",
    "  gl_FragColor = vec4(vColor, a * vFade * uAlpha);",
    "}"
  ].join("\n");

  var uniCommon = { uPx: { value: 1 }, uReveal: { value: 0 }, uTime: { value: 0 } };
  function dotMaterial(alpha, twinkle, additive) {
    return new T.ShaderMaterial({
      vertexShader: dotVert, fragmentShader: dotFrag, transparent: true, depthWrite: false,
      blending: additive ? T.AdditiveBlending : T.NormalBlending,
      uniforms: {
        uPx: uniCommon.uPx, uReveal: uniCommon.uReveal, uTime: uniCommon.uTime,
        uAlpha: { value: alpha }, uTwinkle: { value: twinkle }
      }
    });
  }

  /* --- land dots (fibonacci lattice, masked) --- */
  (function () {
    var N = small ? 14000 : 26000, ga = Math.PI * (3 - Math.sqrt(5));
    var pos = [], col = [], size = [], seed = [];
    var base = new T.Color(0x6e6e82), hi = new T.Color(0x9a9aae);
    for (var i = 0; i < N; i++) {
      var y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), t = i * ga;
      var x = Math.cos(t) * r, z = Math.sin(t) * r;
      var lat = Math.asin(y) / D;
      var lon = Math.atan2(z, -x) / D - 180;
      if (lon < -180) lon += 360;
      if (!isLand(lat, lon)) continue;
      /* skip Pakistan's own cells; it is drawn separately in red */
      if (lat > 23.5 && lat < 37.2 && lon > 60.8 && lon < 77.9 && inPK(lat, lon)) continue;
      pos.push(x, y, z);
      var c = Math.random() < 0.12 ? hi : base;
      col.push(c.r, c.g, c.b);
      size.push(small ? 2.2 : 2.4);
      seed.push(Math.random());
    }
    var g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("aColor", new T.Float32BufferAttribute(col, 3));
    g.setAttribute("aSize", new T.Float32BufferAttribute(size, 1));
    g.setAttribute("aSeed", new T.Float32BufferAttribute(seed, 1));
    spin.add(new T.Points(g, dotMaterial(0.9, 0, false)));
  })();

  function inPK(lat, lon) {
    for (var i = 0; i < PK.length; i += 2) {
      if (Math.abs(PK[i] - lat) < 0.5 && Math.abs(PK[i + 1] - lon) < 0.5) return true;
    }
    return false;
  }

  /* --- Pakistan in red --- */
  (function () {
    var pos = [], col = [], size = [], seed = [];
    for (var i = 0; i < PK.length; i += 2) {
      var v = ll(PK[i], PK[i + 1], 1.003);
      pos.push(v.x, v.y, v.z);
      var c = Math.random() < 0.25 ? RED_HI : RED;
      col.push(c.r, c.g, c.b);
      size.push(small ? 3.6 : 4.2);
      seed.push(Math.random());
    }
    var g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    g.setAttribute("aColor", new T.Float32BufferAttribute(col, 3));
    g.setAttribute("aSize", new T.Float32BufferAttribute(size, 1));
    g.setAttribute("aSeed", new T.Float32BufferAttribute(seed, 1));
    spin.add(new T.Points(g, dotMaterial(1, 0.35, true)));
  })();

  /* --- body, rim light and atmosphere --- */
  spin.add(new T.Mesh(new T.SphereGeometry(0.995, 64, 48), new T.MeshBasicMaterial({ color: 0x0b0b10 })));

  var rimMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { uColor: { value: RED.clone() }, uReveal: uniCommon.uReveal },
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
    fragmentShader: "uniform vec3 uColor; uniform float uReveal; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 3.6); gl_FragColor = vec4(uColor, f * 0.7 * uReveal); }"
  });
  tilt.add(new T.Mesh(new T.SphereGeometry(1.0, 64, 48), rimMat));

  var haloMat = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.BackSide,
    uniforms: { uColor: { value: RED.clone() }, uReveal: uniCommon.uReveal },
    vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform vec3 uColor; uniform float uReveal; varying vec3 vN; void main(){ float i = pow(max(0.0, 0.58 - dot(vN, vec3(0.0,0.0,1.0))), 3.0); gl_FragColor = vec4(uColor, i * 0.75 * uReveal); }"
  });
  tilt.add(new T.Mesh(new T.SphereGeometry(1.16, 64, 48), haloMat));

  /* --- graticule: faint meridians and parallels --- */
  (function () {
    var pts = [];
    for (var lat = -60; lat <= 60; lat += 30) {
      for (var lo = -180; lo < 180; lo += 4) { pts.push(ll(lat, lo, 1.001), ll(lat, lo + 4, 1.001)); }
    }
    for (var lon = -180; lon < 180; lon += 30) {
      for (var la = -84; la < 84; la += 4) { pts.push(ll(la, lon, 1.001), ll(la + 4, lon, 1.001)); }
    }
    var m = new T.LineBasicMaterial({ color: 0x8a8aa0, transparent: true, opacity: 0.07, depthWrite: false });
    spin.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), m));
  })();

  /* --- places --- */
  var OFFICES = [
    { n: "Islamabad", lat: 33.69, lon: 73.05, hq: true },
    { n: "Lahore", lat: 31.55, lon: 74.34 },
    { n: "Karachi", lat: 24.86, lon: 67.01 },
    { n: "Peshawar", lat: 34.01, lon: 71.58 }
  ];
  var PARTNERS = [
    { n: "Rome", p: "CY4GATE", lat: 41.9, lon: 12.5 },
    { n: "Shenzhen", p: "Huawei · Sangfor", lat: 22.54, lon: 114.06 },
    { n: "Tokyo", p: "Hitachi", lat: 35.68, lon: 139.69 },
    { n: "Armonk", p: "IBM", lat: 41.11, lon: -73.72 },
    { n: "Redmond", p: "Microsoft", lat: 47.64, lon: -122.13 },
    { n: "Palo Alto", p: "VMware", lat: 37.4, lon: -122.14 }
  ];

  /* --- arcs --- */
  var arcVert = "attribute float aT; varying float vT; void main(){ vT = aT; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }";
  var arcFrag = [
    "uniform float uHead; uniform float uTail; uniform float uBase; uniform vec3 uColor; uniform float uOn;",
    "varying float vT;",
    "void main(){",
    "  float d = uHead - vT;",
    "  float trail = (d >= 0.0 && d <= uTail) ? pow(1.0 - d / uTail, 2.0) : 0.0;",
    "  float drawn = step(vT, uOn);",
    "  gl_FragColor = vec4(uColor, (uBase * drawn + trail) );",
    "}"
  ].join("\n");

  var arcs = [];
  function addArc(a, b, domestic, delay) {
    var A = ll(a.lat, a.lon, 1), B = ll(b.lat, b.lon, 1);
    var ang = A.angleTo(B);
    var h = domestic ? 0.05 : 0.06 + ang * 0.2;
    var SEG = domestic ? 40 : 96, pts = [], ts = [];
    for (var i = 0; i <= SEG; i++) {
      var t = i / SEG;
      var v = A.clone().lerp(B, t).normalize();
      /* slerp via lerp+normalise is fine for display at these spans */
      if (ang > 2.6) {
        /* very long arcs: proper slerp so the path does not cut the globe */
        var axis = new T.Vector3().crossVectors(A, B).normalize();
        v = A.clone().applyAxisAngle(axis, ang * t);
      }
      v.multiplyScalar(1 + h * Math.sin(Math.PI * t));
      pts.push(v);
      ts.push(t);
    }
    var g = new T.BufferGeometry().setFromPoints(pts);
    g.setAttribute("aT", new T.Float32BufferAttribute(ts, 1));
    var mat = new T.ShaderMaterial({
      vertexShader: arcVert, fragmentShader: arcFrag, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: {
        uHead: { value: -1 }, uTail: { value: domestic ? 0.45 : 0.28 },
        uBase: { value: domestic ? 0.32 : 0.14 }, uColor: { value: domestic ? RED_HI.clone() : RED.clone() },
        uOn: { value: 0 }
      }
    });
    var line = new T.Line(g, mat);
    spin.add(line);
    arcs.push({
      pts: pts, mat: mat, delay: delay, speed: domestic ? 0.42 : 0.24 + Math.random() * 0.1,
      phase: Math.random(), domestic: domestic
    });
  }
  var O = OFFICES;
  addArc(O[0], O[1], true, 0.9); addArc(O[1], O[2], true, 1.0);
  addArc(O[2], O[3], true, 1.1); addArc(O[3], O[0], true, 1.2);
  addArc(O[0], PARTNERS[0], false, 1.4); addArc(O[2], PARTNERS[0], false, 1.8);
  addArc(O[0], PARTNERS[1], false, 1.5); addArc(O[2], PARTNERS[1], false, 2.0);
  addArc(O[0], PARTNERS[2], false, 1.7);
  addArc(O[0], PARTNERS[3], false, 2.1); addArc(O[2], PARTNERS[4], false, 2.3);
  addArc(O[1], PARTNERS[5], false, 2.5);

  /* signal heads: one glowing point per arc */
  var headPos = new Float32Array(arcs.length * 3);
  var headGeo = new T.BufferGeometry();
  headGeo.setAttribute("position", new T.BufferAttribute(headPos, 3));
  function glowTex() {
    var c = document.createElement("canvas"); c.width = c.height = 64;
    var g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,235,238,1)"); gr.addColorStop(0.25, "rgba(255,80,96,0.9)"); gr.addColorStop(1, "rgba(225,29,46,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  var tex = glowTex();
  var headMat = new T.PointsMaterial({ size: small ? 0.075 : 0.07, map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 });
  spin.add(new T.Points(headGeo, headMat));

  /* --- pulsing rings on offices and partner cities --- */
  var rings = [];
  function addRing(p, strength, big) {
    var pos = ll(p.lat, p.lon, 1.004);
    var m = new T.MeshBasicMaterial({ color: RED_HI, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide });
    var ring = new T.Mesh(new T.RingGeometry(0.012, 0.017, 40), m);
    ring.position.copy(pos);
    ring.lookAt(pos.clone().multiplyScalar(2));
    spin.add(ring);
    var core = new T.Mesh(new T.CircleGeometry(big ? 0.012 : 0.008, 20), new T.MeshBasicMaterial({ color: 0xffe3e6, transparent: true, opacity: 0, depthWrite: false }));
    core.position.copy(pos.clone().multiplyScalar(1.0005));
    core.lookAt(pos.clone().multiplyScalar(2));
    spin.add(core);
    rings.push({ ring: ring, core: core, s: strength, off: Math.random(), big: big });
  }
  OFFICES.forEach(function (o) { addRing(o, 1, !!o.hq); });
  PARTNERS.forEach(function (p) { addRing(p, 0.6, false); });

  /* --- HTML labels --- */
  var LABELS = [
    { at: OFFICES[0], html: "<i></i><b>HQ</b> Islamabad", dx: 16, dy: -30, own: true },
    { at: OFFICES[2], html: "<i></i>Karachi", dx: -92, dy: 12, own: true },
    { at: PARTNERS[0], html: "<i></i>Rome · CY4GATE", dx: -120, dy: -12 },
    { at: PARTNERS[1], html: "<i></i>Shenzhen · Huawei", dx: 12, dy: 6 },
    { at: PARTNERS[2], html: "<i></i>Tokyo · Hitachi", dx: 12, dy: -20 }
  ];
  LABELS.forEach(function (L) {
    var el = document.createElement("span");
    el.className = "hx__label";
    el.innerHTML = L.html;
    el.style.opacity = "0";
    labelLayer.appendChild(el);
    L.el = el;
    L.v = ll(L.at.lat, L.at.lon, 1.01);
  });

  var PK_CENTER = ll(30.2, 69.8, 1.0);

  /* ------------------------------------------------------------ orientation */
  var CENTER_LON = 70, CENTER_LAT = 30;
  var baseYaw = (function () {
    var v = ll(CENTER_LAT, CENTER_LON, 1);
    return -Math.atan2(v.x, v.z);
  })();
  var baseTilt = CENTER_LAT * D * 0.62;

  var drag = { on: false, x: 0, v: 0, off: 0 };
  var px = 0, py = 0, tpx = 0, tpy = 0;
  host.addEventListener("pointerdown", function (e) {
    drag.on = true; drag.x = e.clientX; drag.v = 0;
    try { host.setPointerCapture(e.pointerId); } catch (err) {}
  });
  host.addEventListener("pointermove", function (e) {
    var r = host.getBoundingClientRect();
    tpx = ((e.clientX - r.left) / r.width - 0.5);
    tpy = ((e.clientY - r.top) / r.height - 0.5);
    if (!drag.on) return;
    var dx = e.clientX - drag.x;
    drag.x = e.clientX;
    drag.v = dx * 0.006;
    drag.off += drag.v;
  });
  function endDrag() { drag.on = false; }
  host.addEventListener("pointerup", endDrag);
  host.addEventListener("pointercancel", endDrag);
  host.addEventListener("pointerleave", function () { tpx = 0; tpy = 0; });

  /* ---------------------------------------------------------------- sizing */
  var W = 0, H = 0;
  function resize() {
    var r = host.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    if (W < 2 || H < 2) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, small ? 1.6 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    uniCommon.uPx.value = H * dpr * 0.0036;
    return true;
  }

  /* ----------------------------------------------------------------- frame */
  var start = performance.now(), last = start, running = false, visible = false;
  var tmp = new T.Vector3(), camDir = new T.Vector3();

  function frame(now, still) {
    var t = (now - start) / 1000;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (still) t = 6;

    uniCommon.uTime.value = t;
    uniCommon.uReveal.value = still ? 1 : Math.min(1, t / 1.8);

    /* spin: gentle sway around Pakistan, plus drag with a spring home */
    if (!drag.on) {
      drag.off += drag.v;
      drag.v *= 0.94;
      drag.off *= Math.pow(0.35, dt);
    }
    px += (tpx - px) * Math.min(1, dt * 3);
    py += (tpy - py) * Math.min(1, dt * 3);
    var sway = still ? 0.18 : Math.sin(t * 0.13) * 0.42 + 0.12;
    spin.rotation.y = baseYaw + sway + drag.off + px * 0.25;
    tilt.rotation.x = baseTilt + py * 0.18;
    tilt.rotation.z = -0.08;

    /* arcs */
    for (var i = 0; i < arcs.length; i++) {
      var a = arcs[i];
      var on = still ? 1 : Math.max(0, Math.min(1, (t - a.delay) / 1.1));
      a.mat.uniforms.uOn.value = on;
      var head = -1;
      if (!still && on >= 1) {
        head = ((t - a.delay) * a.speed + a.phase) % 1.35;
      } else if (!still) {
        head = on;
      }
      a.mat.uniforms.uHead.value = head;
      var hp = Math.max(0, Math.min(1, head));
      var idx = Math.round(hp * (a.pts.length - 1));
      var p = a.pts[idx];
      var vis = (head >= 0 && head <= 1) ? 1 : 0;
      headPos[i * 3] = p.x * vis; headPos[i * 3 + 1] = p.y * vis; headPos[i * 3 + 2] = p.z * vis;
    }
    headGeo.attributes.position.needsUpdate = true;
    headMat.opacity = still ? 0 : Math.min(1, Math.max(0, t - 1));

    /* rings */
    for (var r = 0; r < rings.length; r++) {
      var R = rings[r];
      var k = still ? 0.3 : ((t * 0.55 + R.off) % 1);
      var s = 1 + k * (R.big ? 4.2 : 3);
      R.ring.scale.set(s, s, s);
      var rev = uniCommon.uReveal.value;
      R.ring.material.opacity = (1 - k) * 0.9 * R.s * rev;
      R.core.material.opacity = R.s * rev;
    }

    renderer.render(scene, camera);

    /* labels: project to screen, hide when on the far side */
    camDir.copy(camera.position).normalize();
    /* keep the Pakistan cluster itself clear of partner tags */
    tmp.copy(PK_CENTER).applyMatrix4(spin.matrixWorld).project(camera);
    var pkx = (tmp.x * 0.5 + 0.5) * W, pky = (-tmp.y * 0.5 + 0.5) * H;
    var placed = [{ x: pkx - 34, y: pky - 34, w: 68, h: 68 }];
    for (var l = 0; l < LABELS.length; l++) {
      var L = LABELS[l];
      tmp.copy(L.v).applyMatrix4(spin.matrixWorld);
      var facing = tmp.clone().normalize().dot(camDir);
      tmp.project(camera);
      var x = (tmp.x * 0.5 + 0.5) * W + L.dx, y = (-tmp.y * 0.5 + 0.5) * H + L.dy;
      /* keep every label inside the stage so none is clipped at the edge */
      if (!L.w) L.w = L.el.offsetWidth || 120;
      x = Math.max(2, Math.min(W - L.w - 2, x));
      L.el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      var o = facing > 0.28 ? Math.min(1, (facing - 0.28) * 4) : 0;
      /* labels are listed by priority; drop any that would collide with one
         already placed, so the map never turns into a pile of tags */
      if (o > 0) {
        var bx = { x: x - 6, y: y - 6, w: L.w + 12, h: 34 };
        for (var q = L.own ? 1 : 0; q < placed.length; q++) {
          var pb = placed[q];
          if (bx.x < pb.x + pb.w && bx.x + bx.w > pb.x && bx.y < pb.y + pb.h && bx.y + bx.h > pb.y) { o = 0; break; }
        }
        if (o > 0) placed.push(bx);
      }
      L.el.style.opacity = String(o * Math.min(1, Math.max(0, (t - 1.6) * 1.5)));
    }
  }

  function loop(now) {
    if (!running) return;
    frame(now, false);
    requestAnimationFrame(loop);
  }
  function play() {
    if (running || reduced) return;
    if (!resize()) return;
    running = true; last = performance.now();
    requestAnimationFrame(loop);
  }
  function pause() { running = false; }

  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible) play(); else pause();
  }, { threshold: 0.02 }).observe(host);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause(); else if (visible) play();
  });
  new ResizeObserver(function () {
    if (resize() && (reduced || !running)) frame(performance.now(), reduced);
  }).observe(host);

  if (reduced) {
    if (resize()) frame(performance.now(), true);
  }
})();
