/* ===== Case-studies portfolio recreation — app logic (grouped by category) ===== */
(function () {
  "use strict";

  var ALL = window.PROJECTS || [];
  var DETAILS = window.DETAILS || {};
  var IMAGES = window.IMAGES || {};

  ALL.forEach(function (p) {
    p.detail = DETAILS[p.slug] || null;
    p.tagline = p.detail ? p.detail.tagline : null;
  });
  var PROJECTS = ALL.filter(function (p) { return p.detail; });

  // ---- Category colors ----
  var CAT_STYLE = {
    "Artificial Intelligence": ["#7c3aed", "#a855f7", "🤖"],
    "E-Commerce":              ["#0891b2", "#22d3ee", "🛒"],
    "Web Development":          ["#2563eb", "#60a5fa", "🌐"],
    "UI/UX Design":            ["#db2777", "#f472b6", "🎨"]
  };
  function styleFor(project) {
    for (var i = 0; i < project.categories.length; i++) {
      if (CAT_STYLE[project.categories[i]]) return CAT_STYLE[project.categories[i]];
    }
    var h = 0; for (var j = 0; j < project.name.length; j++) h = (h * 31 + project.name.charCodeAt(j)) % 360;
    return ["hsl(" + h + ",55%,42%)", "hsl(" + ((h + 40) % 360) + ",65%,58%)", "◈"];
  }
  function catStyle(cat) { return CAT_STYLE[cat] || ["#6b7280", "#9ca3af", "◈"]; }

  // ---- Category counts + ordering ----
  var counts = {};
  PROJECTS.forEach(function (p) { p.categories.forEach(function (c) { counts[c] = (counts[c] || 0) + 1; }); });
  var PRIMARY = ["Artificial Intelligence", "E-Commerce", "Web Development", "UI/UX Design"];
  var orderedCats = [];
  PRIMARY.forEach(function (c) { if (counts[c]) orderedCats.push(c); });
  Object.keys(counts).filter(function (c) { return PRIMARY.indexOf(c) === -1; })
    .sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); })
    .forEach(function (c) { orderedCats.push(c); });

  var elTotal = document.getElementById("count-total");
  if (elTotal) elTotal.textContent = PROJECTS.length;
  var elCats = document.getElementById("count-cats");
  if (elCats) elCats.textContent = orderedCats.length;

  // ---- State ----
  var state = { category: "All Categories" };
  var elFilters = document.getElementById("filters");
  var elSections = document.getElementById("sections");

  // ---- Filter chips (All + the primary categories) ----
  function renderFilters() {
    elFilters.innerHTML = "";
    elFilters.appendChild(chipEl("All Categories", PROJECTS.length));
    PRIMARY.forEach(function (c) { if (counts[c]) elFilters.appendChild(chipEl(c, counts[c])); });
  }
  function chipEl(name, count) {
    var label = name === "All Categories" ? LANG.t("chipAll") : LANG.cat(name);
    var b = document.createElement("button");
    b.className = "chip" + (state.category === name ? " active" : "");
    b.innerHTML = escapeHtml(label) + ' <span class="chip-count">' + count + "</span>";
    b.onclick = function () { state.category = name; renderFilters(); renderSections(); };
    return b;
  }

  // ---- Grouped sections ----
  function renderSections() {
    var catsToShow = state.category === "All Categories" ? orderedCats : [state.category];
    elSections.innerHTML = "";
    catsToShow.forEach(function (cat) {
      var items = PROJECTS.filter(function (p) { return p.categories.indexOf(cat) !== -1; });
      if (!items.length) return;
      var st = catStyle(cat);
      var section = document.createElement("section");
      section.className = "cat-section";
      section.innerHTML = '<div class="cat-head">' +
        '<span class="cat-dot" style="background:linear-gradient(135deg,' + st[0] + ',' + st[1] + ')">' + st[2] + "</span>" +
        "<h2>" + escapeHtml(LANG.cat(cat)) + "</h2>" +
        '<span class="cat-count">' + items.length + " project" + (items.length === 1 ? "" : "s") + "</span></div>";
      var grid = document.createElement("div");
      grid.className = "grid";
      items.forEach(function (p) { grid.appendChild(cardEl(p)); });
      section.appendChild(grid);
      elSections.appendChild(section);
    });
  }

  function cardEl(p) {
    var st = styleFor(p);
    var card = document.createElement("div");
    card.className = "card";
    card.onclick = function () { location.hash = "#/p/" + p.slug; };

    // Wide case-study image as a full-bleed banner (fallback to gradient tile).
    var thumb = document.createElement("div");
    thumb.className = "card-thumb";
    thumb.style.background = "linear-gradient(135deg," + st[0] + "," + st[1] + ")";
    var im = IMAGES[p.slug];
    if (im && im.img) {
      thumb.classList.add("has-banner");
      var img = document.createElement("img");
      img.className = "banner-img";
      img.loading = "lazy";
      img.alt = p.name;
      img.src = im.img;
      img.onerror = function () {
        thumb.classList.remove("has-banner");
        thumb.innerHTML = '<span class="initial">' + escapeHtml(initials(p.name)) + "</span>";
      };
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = '<span class="initial">' + escapeHtml(initials(p.name)) + "</span>";
    }

    // Translated name/tagline (fall back to English), tech-stack tags translated where applicable.
    var tr = LANG.detail(p.slug);
    var dispName = (tr && tr.name) || p.name;
    var dispTagline = (tr && tr.tagline) || p.tagline;
    var tagList = (p.tags && p.tags.length) ? p.tags : p.categories;
    var cats = tagList.map(function (c) {
      return '<span class="tag">' + escapeHtml(LANG.tag(c)) + "</span>";
    }).join("");
    var tagline = dispTagline ? '<p class="card-tagline">' + escapeHtml(truncate(dispTagline, 92)) + "</p>" : "";

    var body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = '<div class="card-name">' + escapeHtml(dispName) + "</div>" +
      tagline + '<div class="card-cats">' + cats + "</div>";

    card.appendChild(thumb);
    card.appendChild(body);
    return card;
  }

  // ---- Modal / detail ----
  var elModal = document.getElementById("modal");
  var elModalBody = document.getElementById("modal-body");
  document.getElementById("modal-close").onclick = function () { location.hash = "#/"; };
  elModal.onclick = function (e) { if (e.target === elModal) location.hash = "#/"; };
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !elModal.hidden) location.hash = "#/"; });

  function openModal(slug) {
    var p = PROJECTS.filter(function (x) { return x.slug === slug; })[0];
    if (!p) { location.hash = "#/"; return; }
    var st = styleFor(p);
    var tr = LANG.detail(p.slug);
    var d = tr || p.detail;                       // active-language fields (fall back to English)
    var dispName = (tr && tr.name) || p.name;
    var im = IMAGES[p.slug] || {};

    var cats = p.categories.map(function (c) { return '<span class="tag">' + escapeHtml(LANG.cat(c)) + "</span>"; }).join("");
    var html = '<div class="modal-hero" style="background:linear-gradient(135deg,' + st[0] + ',' + st[1] + ')">' +
      '<div class="m-cats">' + cats + "</div>" +
      "<h2>" + escapeHtml(dispName) + "</h2>" +
      (d.tagline ? '<p class="m-tagline">' + escapeHtml(d.tagline) + "</p>" : "") + "</div>";
    if (im.img) html += '<img class="m-hero-img" src="' + escapeAttr(im.img) + '" alt="" onerror="this.style.display=\'none\'">';
    html += "<div class='modal-content'>";

    if (d.whatItDoes) html += section(LANG.t("mWhat"), "<p>" + escapeHtml(d.whatItDoes) + "</p>");
    if (d.highlights && d.highlights.length) {
      html += section(LANG.t("mHighlights"), "<ul>" + d.highlights.map(function (f) { return "<li>" + escapeHtml(f) + "</li>"; }).join("") + "</ul>");
    }
    var grid = "";
    if (stated(d.industry)) grid += section(LANG.t("mIndustry"), "<p>" + escapeHtml(d.industry) + "</p>");
    if (stated(d.techStack)) grid += section(LANG.t("mTech"), "<p>" + escapeHtml(d.techStack) + "</p>");
    if (grid) html += '<div class="m-grid">' + grid + "</div>";
    if (stated(d.results)) html += section(LANG.t("mResults"), '<div class="m-status">' + escapeHtml(d.results) + "</div>");
    html += "</div>";

    elModalBody.innerHTML = html;
    elModal.hidden = false;
    document.body.style.overflow = "hidden";
    elModal.scrollTop = 0;
  }
  function closeModal() { elModal.hidden = true; document.body.style.overflow = ""; }
  function section(title, inner) { return '<div class="m-section"><h3>' + escapeHtml(title) + "</h3>" + inner + "</div>"; }
  // Treat "Not stated / Not found / N/A" placeholder values as empty so they aren't shown.
  function stated(v) { return !!v && !/^\s*(not stated|not found|not applicable|n\/a|no especificado|não informado|nao informado)\b/i.test(v); }

  // ---- Routing ----
  function route() {
    var h = location.hash || "#/";
    var m = h.match(/^#\/p\/(.+)$/);
    if (m) { openModal(decodeURIComponent(m[1])); } else { closeModal(); }
  }
  window.addEventListener("hashchange", route);

  // ---- Helpers ----
  function initials(name) {
    var clean = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/);
    if (clean.length === 1) return clean[0].slice(0, 2).toUpperCase();
    return (clean[0][0] + clean[1][0]).toUpperCase();
  }
  function truncate(s, n) { return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ---- Hero coverflow: phone-style cards fanned out, center stands out, images flow through ----
  function buildHeroStack() {
    var stack = document.getElementById("hero-stack");
    if (!stack) return;
    var pool = Object.keys(IMAGES)
      .map(function (s) { return IMAGES[s].img; })
      .filter(function (src) { return src && !/photo\.png$/i.test(src); });
    if (!pool.length) { stack.style.display = "none"; return; }

    var COUNT = 7, HALF = (COUNT - 1) / 2; // positions -3..3 (visible |pos| <= 2)
    var cards = [], idx = 0;

    function applyPos(card, pos) {
      var abs = Math.abs(pos), sign = pos < 0 ? -1 : (pos > 0 ? 1 : 0);
      var x, s, z, op, br, ry;
      if (abs === 0)      { x = 0;          s = 1;   z = 10; op = 1; br = 1;   ry = 0; }
      else if (abs === 1) { x = sign * 150; s = .82; z = 8;  op = 1; br = .72; ry = -sign * 22; }
      else if (abs === 2) { x = sign * 278; s = .64; z = 6;  op = 1; br = .5;  ry = -sign * 28; }
      else                { x = sign * 380; s = .5;  z = 4;  op = 0; br = .4;  ry = -sign * 30; }
      card.style.transform = "translateX(" + x + "px) scale(" + s + ") rotateY(" + ry + "deg)";
      card.style.zIndex = z; card.style.opacity = op; card.style.filter = "brightness(" + br + ")";
    }

    for (var i = 0; i < COUNT; i++) {
      var pos = i - HALF;
      var card = document.createElement("div");
      card.className = "pf-card";
      var img = document.createElement("img");
      img.alt = ""; img.loading = "lazy"; img.src = pool[idx++ % pool.length];
      card.appendChild(img);
      card._pos = pos;
      applyPos(card, pos);
      stack.appendChild(card);
      cards.push(card);
    }

    setInterval(function () {
      cards.forEach(function (c) {
        var p = c._pos - 1;
        if (p < -HALF) { p = HALF; c.querySelector("img").src = pool[idx++ % pool.length]; } // wrap in, new image
        c._pos = p;
        applyPos(c, p);
      });
    }, 1800);
  }

  // ---- Init ----
  if (window.LANG) LANG.onChange(function () { renderFilters(); renderSections(); route(); });
  renderFilters();
  renderSections();
  buildHeroStack();
  route();
})();
