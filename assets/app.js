/* ══════════════════════════════════════════════════════════════
 * LexusFX — lógica de aplicación
 * i18n · tema · scroll-spy · contadores · reveal · demo flag · form
 * ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* Bandera del demo studio. Mientras sea false (por defecto) no se enlaza
   * ningún demo externo: se muestra la galería de capturas embebida. La URL
   * del demo se inyecta en build-time cuando DEMO_STUDIO_LISTO = true (no se
   * publica en el bundle estático para no filtrar hosts internos). */
  var DEMO_STUDIO_LISTO = false;
  var URL_DEMO_STUDIO = ""; // se define en build cuando el demo esté listo

  /* Número de WhatsApp (solo dígitos, con código de país) al que se envía
   * el formulario de contacto. Debe coincidir con los enlaces wa.me del HTML. */
  var WHATSAPP = "34654949878";

  var I18N = window.I18N;
  var LS_LANG = "lexusfx.lang";
  var LS_THEME = "lexusfx.theme";

  /* ── Idioma ──────────────────────────────────────────────── */
  function detectLang() {
    var saved = localStorage.getItem(LS_LANG);
    if (saved === "es" || saved === "pt") return saved;
    var nav = (navigator.language || "es").toLowerCase();
    return nav.indexOf("pt") === 0 ? "pt" : "es";
  }

  var lang = detectLang();

  function t(key) {
    var d = I18N[lang] || I18N.es;
    return (key in d) ? d[key] : (I18N.es[key] || key);
  }

  function applyI18n() {
    document.documentElement.lang = lang;
    // textContent
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    // atributos: data-i18n-attr="placeholder:key,aria-label:key2"
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(",").forEach(function (pair) {
        var bits = pair.split(":");
        if (bits.length === 2) el.setAttribute(bits[0].trim(), t(bits[1].trim()));
      });
    });
    // meta
    document.title = t("meta.title");
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", t("meta.desc"));
    var ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.setAttribute("content", t("meta.title"));
    var ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.setAttribute("content", t("meta.desc"));

    // botones segmentados de idioma
    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-lang-btn") === lang));
    });
  }

  function setLang(l) {
    if (l !== "es" && l !== "pt") return;
    lang = l;
    localStorage.setItem(LS_LANG, l);
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var main = document.querySelector("main");
    if (main && !reduce) { main.classList.remove("lang-fade"); void main.offsetWidth; main.classList.add("lang-fade"); }
    applyI18n();
  }

  /* ── Tema ────────────────────────────────────────────────── */
  function detectTheme() {
    var saved = localStorage.getItem(LS_THEME);
    return saved === "light" ? "light" : "dark"; // oscuro por defecto
  }
  function applyTheme(th) {
    document.documentElement.setAttribute("data-theme", th);
    document.querySelectorAll("[data-theme-icon]").forEach(function (el) {
      el.style.display = (el.getAttribute("data-theme-icon") === th) ? "block" : "none";
    });
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    var next = cur === "light" ? "dark" : "light";
    localStorage.setItem(LS_THEME, next);
    applyTheme(next);
  }

  /* ── Contadores numéricos ────────────────────────────────── */
  function animateCounter(el) {
    if (el.dataset.done) return;
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400, start = null;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = formatNum(target) + suffix; el.dataset.done = "1"; return; }
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step); else el.dataset.done = "1";
    }
    requestAnimationFrame(step);
  }
  function formatNum(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  /* ── IntersectionObserver: reveal + counters ─────────────── */
  function initObservers() {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); revObs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { revObs.observe(el); });

    var cntObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCounter(e.target); cntObs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-count]").forEach(function (el) { cntObs.observe(el); });

    // Visuales animados: añade .viz-on al entrar; pausa SMIL si reduced-motion.
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var vizObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("viz-on"); vizObs.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll(".case-visuals").forEach(function (el) { vizObs.observe(el); });
    if (reduce) {
      document.querySelectorAll(".viz svg").forEach(function (s) {
        try { s.pauseAnimations(); } catch (err) {}
      });
    }
  }

  /* ── Scroll-spy (sección activa en nav) ──────────────────── */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (l) { l.classList.remove("active"); });
          var a = map[e.target.id];
          if (a) a.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  /* ── Demo Studio: galería vs botón ───────────────────────── */
  function initDemoFlag() {
    var btnWrap = document.getElementById("studio-demo-btn");
    if (!btnWrap) return;
    if (DEMO_STUDIO_LISTO && URL_DEMO_STUDIO) {
      var a = btnWrap.querySelector("a");
      if (a) { a.href = URL_DEMO_STUDIO; a.target = "_blank"; a.rel = "noopener noreferrer"; }
      btnWrap.style.display = "";
    } else {
      btnWrap.style.display = "none"; // por defecto: solo galería, sin enlace a demo PT con marca real
    }
  }

  /* ── Menú móvil ──────────────────────────────────────────── */
  function initBurger() {
    var burger = document.getElementById("burger");
    var links = document.getElementById("nav-links");
    if (!burger || !links) return;
    burger.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); });
    });
  }

  /* ── Formulario ──────────────────────────────────────────── */
  function initForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      // Construye el mensaje con los datos del formulario y abre WhatsApp
      // hacia el número de LexusFX con el texto ya preparado. Bilingüe ES/PT.
      var val = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ""; };
      var opt = function (n) {
        var el = form.elements[n];
        return (el && el.selectedOptions && el.selectedOptions[0]) ? el.selectedOptions[0].textContent.trim() : "";
      };

      var L = (lang === "pt")
        ? { hi: "Olá LexusFX! 👋", nombre: "Nome", email: "Email", empresa: "Empresa", gama: "Preciso de", budget: "Orçamento", msg: "Projeto" }
        : { hi: "¡Hola LexusFX! 👋", nombre: "Nombre", email: "Email", empresa: "Empresa", gama: "Necesito", budget: "Presupuesto", msg: "Proyecto" };

      var lines = [L.hi, "", L.nombre + ": " + val("nombre"), L.email + ": " + val("email")];
      var empresa = val("empresa");
      if (empresa) lines.push(L.empresa + ": " + empresa);
      lines.push(L.gama + ": " + opt("gama"));
      lines.push(L.budget + ": " + opt("budget"));
      lines.push("", L.msg + ": " + val("mensaje"));

      var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));

      var ok = document.getElementById("form-ok");
      if (ok) { ok.classList.add("show"); }

      window.open(url, "_blank", "noopener");
      form.reset();
    });
  }

  /* ── Año dinámico no necesario (copy fija 2026 por brief) ── */

  /* ── Contadores de precio (Carrusel) ───────────────── */
  function animatePrice(el) {
    if (el.dataset.pdone) return;
    var full = el.textContent;
    var m = full.match(/[0-9][0-9.]*/);
    if (!m) { el.dataset.pdone = "1"; return; }
    var numStr = m[0];
    var target = parseInt(numStr.replace(/\./g, ""), 10);
    if (!target) { el.dataset.pdone = "1"; return; }
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.dataset.pdone = "1"; return; }
    var pre = full.slice(0, m.index), post = full.slice(m.index + numStr.length);
    var dur = 600, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + formatNum(Math.round(target * eased)) + post;
      if (p < 1) requestAnimationFrame(step);
      else { el.textContent = full; el.dataset.pdone = "1"; }
    }
    requestAnimationFrame(step);
  }
  function initPriceCounters() {
    var els = document.querySelectorAll(".cat-count");
    if (!els.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animatePrice(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ── Stagger: asigna --i a hijos de .stagger ──────────────── */
  function initStagger() {
    document.querySelectorAll(".stagger").forEach(function (c) {
      Array.prototype.forEach.call(c.children, function (ch, i) {
        ch.style.setProperty("--i", i);
      });
    });
  }

  /* ── Pipeline de proceso: nodos que se iluminan en cadena ──── */
  function initPipeline() {
    var pipe = document.getElementById("pipe");
    if (!pipe) return;
    var nodes = Array.prototype.slice.call(pipe.querySelectorAll(".pipe-node"));
    var fill = pipe.querySelector(".pipe-fill");
    if (!nodes.length || !fill) return;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var n = nodes.length;
    function horiz() { return window.matchMedia("(min-width:860px)").matches; }
    function setFill(k) {
      var frac = k <= 0 ? 0 : (k >= n ? 1 : (k - 0.5) / n);
      var pct = Math.max(0, Math.min(1, frac)) * 100;
      if (horiz()) { fill.style.width = pct + "%"; fill.style.height = "100%"; }
      else { fill.style.height = pct + "%"; fill.style.width = "100%"; }
    }
    function litTo(k) {
      nodes.forEach(function (node, i) { node.classList.toggle("lit", i < k); });
      setFill(k);
    }
    if (reduce) { litTo(n); return; }
    var timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function runLoop() {
      clearTimers();
      litTo(0);
      for (var i = 1; i <= n; i++) {
        (function (k) { timers.push(setTimeout(function () { litTo(k); }, k * 850)); })(i);
      }
      var holdEnd = n * 850 + 2400;
      timers.push(setTimeout(function () { litTo(0); }, holdEnd));
      timers.push(setTimeout(runLoop, holdEnd + 520));
    }
    var started = false;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !started) { started = true; runLoop(); }
        else if (!e.isIntersecting && started) { /* pausa fuera de vista */ started = false; clearTimers(); litTo(0); }
      });
    }, { threshold: 0.35 });
    obs.observe(pipe);
    window.addEventListener("resize", function () { setFill(nodes.filter(function (nd) { return nd.classList.contains("lit"); }).length); });
  }

  /* ── Init ────────────────────────────────────────────────── */
  function init() {
    applyTheme(detectTheme());
    applyI18n();
    initStagger();
    initObservers();
    initScrollSpy();
    initPipeline();
    initPriceCounters();
    initDemoFlag();
    initBurger();
    initForm();

    document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.getAttribute("data-lang-btn")); });
    });
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.addEventListener("click", toggleTheme);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
