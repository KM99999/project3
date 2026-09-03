/* ===== 3D parallax background (three.js) =====
   A fixed, full-viewport depth field of soft dots sitting behind the page.
   The camera translates and the field tilts toward the pointer, so nearer
   dots sweep further than distant ones — real perspective parallax, not a
   2D offset. Ambient drift and scroll keep it alive without a pointer.

   Degrades to nothing at all: no THREE, no WebGL, or prefers-reduced-motion
   and the page renders exactly as it did before. */
(function () {
  "use strict";

  var THREE = window.THREE;
  if (!THREE) return;

  var canvas = document.getElementById("bg3d");
  if (!canvas) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Renderer (transparent — the page background shows through) ----
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: false, powerPreference: "low-power"
    });
  } catch (e) { return; }                       // no WebGL — leave the page alone
  if (!renderer.getContext()) return;

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(58, 1, 1, 260);
  camera.position.set(0, 0, 42);

  var field = new THREE.Group();
  scene.add(field);

  // ---- Soft round sprite, drawn once into a canvas texture ----
  function dotTexture() {
    var c = document.createElement("canvas");
    c.width = c.height = 64;
    var g = c.getContext("2d").createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    var ctx = c.getContext("2d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  var SPRITE = dotTexture();

  // Site palette. Weighted toward the pink accent and the hero's teal — the
  // violet is an occasional accent, not an equal third.
  var PALETTE = [0xec1e79, 0xec1e79, 0x2dd4bf, 0x2dd4bf, 0x7c3aed].map(function (h) {
    return new THREE.Color(h);
  });

  // ---- Three depth layers: far/small/faint through near/large/bokeh ----
  // Separate layers because PointsMaterial carries a single size; the depth
  // split also lets each band carry its own opacity.
  var LAYERS = [
    { count: 300, size: 0.70, opacity: 0.34, zNear: -45, zFar: -95, spread: 105 },
    { count: 150, size: 1.35, opacity: 0.30, zNear: -14, zFar: -45, spread: 78 },
    { count: 22,  size: 3.20, opacity: 0.13, zNear: 10,  zFar: -14, spread: 58 }
  ];

  LAYERS.forEach(function (L) {
    var pos = new Float32Array(L.count * 3);
    var col = new Float32Array(L.count * 3);
    for (var i = 0; i < L.count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * L.spread * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * L.spread * 1.35;
      pos[i * 3 + 2] = L.zNear + Math.random() * (L.zFar - L.zNear);
      var c = PALETTE[(Math.random() * PALETTE.length) | 0];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    field.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: L.size,
      map: SPRITE,
      vertexColors: true,
      transparent: true,
      opacity: L.opacity,
      depthWrite: false,          // dots blend instead of punching holes
      sizeAttenuation: true       // near dots read larger — the depth cue
    })));
  });

  // ---- Sizing ----
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();

  // Reduced motion: one static frame, no listeners, no loop.
  if (reduceMotion) {
    renderer.render(scene, camera);
    window.addEventListener("resize", function () { resize(); renderer.render(scene, camera); });
    return;
  }

  // ---- Pointer + scroll targets (eased toward every frame) ----
  var target = { x: 0, y: 0 }, ease = { x: 0, y: 0 };
  var scrollY = window.pageYOffset || 0, maxScroll = 1;

  function measureScroll() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }
  measureScroll();

  window.addEventListener("mousemove", function (e) {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // Touch drags steer it too, so the effect isn't mouse-only.
  window.addEventListener("touchmove", function (e) {
    if (!e.touches.length) return;
    target.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    target.y = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  // Pointer leaving the window drifts the field back to centre.
  document.addEventListener("mouseleave", function () { target.x = target.y = 0; });

  window.addEventListener("scroll", function () {
    scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  }, { passive: true });

  window.addEventListener("resize", function () { resize(); measureScroll(); }, { passive: true });

  // ---- Loop ----
  var running = true, raf = 0;

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    // Critically-damped-ish follow: snappy but never jittery.
    ease.x += (target.x - ease.x) * 0.045;
    ease.y += (target.y - ease.y) * 0.045;

    // Camera translation is what produces genuine differential parallax.
    camera.position.x = ease.x * 9;
    camera.position.y = -ease.y * 6;
    camera.lookAt(0, 0, 0);

    // A small counter-tilt on the field exaggerates the depth read.
    field.rotation.y = ease.x * 0.07;
    field.rotation.x = -ease.y * 0.055;

    // Ambient drift, so it breathes with the pointer parked.
    field.rotation.z += 0.00035;

    // Scrolling pushes the field past the camera.
    field.position.y = (scrollY / maxScroll) * 26;

    renderer.render(scene, camera);
  }

  // Don't burn frames on a hidden tab.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (!running) { running = true; frame(); }
  });

  frame();
})();
