/* Shared i18n engine + language switcher (used by index.html and about.html) */
(function () {
  "use strict";
  var I18N = window.I18N || { en: {} };
  var CAT_I18N = window.CAT_I18N || {};
  var TAG_I18N = window.TAG_I18N || {};
  var LANGS = ["en", "es", "ptBR"];
  var LABEL = { en: "Language", es: "Idioma", ptBR: "Idioma" };
  var MENU = { en: "English", es: "Español", ptBR: "Português (BR)" };
  var HTMLLANG = { en: "en", es: "es", ptBR: "pt-BR" };
  // Inline SVG flags (emoji flags don't render on Windows, so we draw them)
  var FLAG = {
    en: '<svg class="flag" viewBox="0 0 190 100" aria-hidden="true"><rect width="190" height="100" fill="#fff"/><g fill="#b22234"><rect width="190" height="7.7"/><rect y="15.4" width="190" height="7.7"/><rect y="30.8" width="190" height="7.7"/><rect y="46.2" width="190" height="7.7"/><rect y="61.6" width="190" height="7.7"/><rect y="77" width="190" height="7.7"/><rect y="92.3" width="190" height="7.7"/></g><rect width="80" height="53.8" fill="#3c3b6e"/></svg>',
    es: '<svg class="flag" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#c60b1e"/><rect y="5" width="30" height="10" fill="#ffc400"/></svg>',
    ptBR: '<svg class="flag" viewBox="0 0 20 14" aria-hidden="true"><rect width="20" height="14" fill="#009c3b"/><polygon points="10,1.6 18.4,7 10,12.4 1.6,7" fill="#ffdf00"/><circle cx="10" cy="7" r="3" fill="#002776"/></svg>'
  };

  var stored = localStorage.getItem("site-lang");
  var cur = LANGS.indexOf(stored) >= 0 ? stored : "en";
  var listeners = [];

  function t(k) {
    var d = I18N[cur] || {};
    if (k in d) return d[k];
    return (I18N.en && k in I18N.en) ? I18N.en[k] : k;
  }
  function cat(name) { return (CAT_I18N[cur] && CAT_I18N[cur][name]) || name; }
  function tag(name) { return (TAG_I18N[cur] && TAG_I18N[cur][name]) || name; }
  function detail(slug) {
    var d = window.DETAILS_I18N && window.DETAILS_I18N[cur];
    return (d && d[slug]) || null;
  }

  function applyStatic() {
    document.documentElement.setAttribute("lang", HTMLLANG[cur] || "en");
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i], k = el.getAttribute("data-i18n"), v = t(k);
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = v; else el.textContent = v;
    }
  }

  function renderSwitcher() {
    var host = document.getElementById("lang-switch");
    if (!host) return;
    host.innerHTML =
      '<button class="lang-btn" aria-haspopup="true" aria-expanded="false">' +
        FLAG[cur] + ' <span class="lang-cur">' + LABEL[cur] + '</span> <span class="lang-caret">▾</span></button>' +
      '<div class="lang-menu" hidden>' +
        LANGS.map(function (l) {
          return '<button data-lang="' + l + '"' + (l === cur ? ' class="active"' : "") + '>' + FLAG[l] + " " + MENU[l] + "</button>";
        }).join("") +
      "</div>";
    var btn = host.querySelector(".lang-btn");
    var menu = host.querySelector(".lang-menu");
    btn.onclick = function (e) {
      e.stopPropagation();
      var open = menu.hasAttribute("hidden");
      if (open) { menu.removeAttribute("hidden"); btn.setAttribute("aria-expanded", "true"); }
      else { menu.setAttribute("hidden", ""); btn.setAttribute("aria-expanded", "false"); }
    };
    host.querySelectorAll(".lang-menu button").forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); set(b.getAttribute("data-lang")); };
    });
  }
  document.addEventListener("click", function () {
    var menu = document.querySelector("#lang-switch .lang-menu");
    if (menu && !menu.hasAttribute("hidden")) { menu.setAttribute("hidden", ""); var b = document.querySelector("#lang-switch .lang-btn"); if (b) b.setAttribute("aria-expanded", "false"); }
  });

  function set(l) {
    if (LANGS.indexOf(l) < 0 || l === cur) { if (l === cur) renderSwitcher(); return; }
    cur = l;
    localStorage.setItem("site-lang", l);
    applyStatic();
    renderSwitcher();
    for (var i = 0; i < listeners.length; i++) { try { listeners[i](cur); } catch (e) {} }
  }
  function onChange(fn) { listeners.push(fn); }

  window.LANG = {
    get current() { return cur; },
    set: set, t: t, cat: cat, tag: tag, detail: detail, onChange: onChange
  };

  // init (scripts load at end of <body>, so DOM is ready)
  renderSwitcher();
  applyStatic();
})();
