/* ==========================================================
   LUX96 — shared behaviour for every page
   (contact links, theme, sound, cursor, header & menu,
   page transitions, offline/install, greetings)
   Needs: config.js loaded first.
   ========================================================== */
(function () {
  const L = window.LUX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const root = ($('meta[name="lux-root"]') || { content: "./" }).content;
  L.root = root;
  L.reduced = reduced;
  L.finePointer = finePointer;

  /* ---------------- Greeting language ---------------- */
  L.lang = L.greetings[store.get("lux-lang")] ? store.get("lux-lang") : "en";
  L.hello = () => L.greetings[L.lang].hello;
  L.wa = (text) => `https://wa.me/${L.whatsapp}?text=${encodeURIComponent(text)}`;
  L.intro = () => `${L.hello()}, LUX96 Furnitures! I found you through your website and I'm interested in having a piece made. Could you tell me how to get started, and what information you need from me for a quote?`;

  // Every WhatsApp link opens a chat with a complete, ready-to-send message.
  // Links with data-msg send that message (after the greeting) instead of the general intro.
  function refreshLinks() {
    $$(".c-wa").forEach((a) => {
      a.href = L.wa(a.dataset.msg ? `${L.hello()}, LUX96! ${a.dataset.msg}` : L.intro());
    });
    $$(".c-email").forEach((a) => (a.href = `mailto:${L.email}?subject=${encodeURIComponent(a.dataset.subject || "Enquiry from the LUX96 website")}`));
    $$(".lang-pick button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === L.lang)));
    $$(".lang-hello").forEach((el) => (el.textContent = L.hello()));
  }
  $$(".lang-pick").forEach((g) => {
    Object.entries(L.greetings).forEach(([k, v]) => {
      const b = document.createElement("button");
      b.type = "button"; b.dataset.lang = k; b.textContent = v.label;
      b.addEventListener("click", () => { L.lang = k; store.set("lux-lang", k); refreshLinks(); });
      g.appendChild(b);
    });
  });
  L.refreshLinks = refreshLinks;
  refreshLinks();
  $$(".year").forEach((el) => (el.textContent = new Date().getFullYear()));
  $$("[data-guarantee]").forEach((el) => (el.textContent = L.guaranteeYears));
  $$("[data-leadtime]").forEach((el) => (el.textContent = L.leadTime));
  $$("[data-deposit]").forEach((el) => (el.textContent = L.depositPercent));

  /* ---------------- Welcome rotator (opening screen) ---------------- */
  $$(".greet-rotator").forEach((el) => {
    const words = Object.values(L.greetings).map((g) => g.welcome);
    let i = 0;
    el.textContent = words[0];
    if (reduced) return;
    setInterval(() => {
      el.classList.add("out");
      setTimeout(() => { i = (i + 1) % words.length; el.textContent = words[i]; el.classList.remove("out"); }, 450);
    }, 2600);
  });

  /* ---------------- Sound (synthesised, off by default) ---------------- */
  const Sound = (() => {
    let ctx = null, noise = null;
    let on = store.get("lux-sound") === "1";
    const ensure = () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        const len = ctx.sampleRate * 0.6;
        noise = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    };
    const env = (g, t, peak, attack, decay) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    };
    const burst = (dur, filterType, freq, q, peak, attack, decay, sweepTo) => {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource(); src.buffer = noise;
      const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
      const g = ctx.createGain(); env(g, t, peak, attack, decay);
      src.connect(f).connect(g).connect(ctx.destination);
      src.start(t); src.stop(t + dur + 0.05);
    };
    const tone = (type, from, to, peak, decay) => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + decay);
      const g = ctx.createGain(); env(g, t, peak, 0.004, decay);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + decay + 0.05);
    };
    return {
      get on() { return on; },
      set(v) { on = v; store.set("lux-sound", v ? "1" : "0"); if (v) { ensure(); this.tap(); } },
      // knuckle on a hardwood board
      tap() { if (!on || !ensure()) return; tone("sine", 210, 120, 0.22, 0.09); burst(0.03, "bandpass", 2400, 1.4, 0.08, 0.002, 0.03); },
      // chisel striking end grain
      chisel() { if (!on || !ensure()) return; burst(0.02, "highpass", 3200, 0.7, 0.18, 0.001, 0.02); tone("triangle", 980, 700, 0.06, 0.05); },
      // a hand plane taking a long shaving
      plane() { if (!on || !ensure()) return; burst(0.42, "bandpass", 650, 0.9, 0.16, 0.06, 0.36, 2600); burst(0.42, "highpass", 4500, 0.5, 0.03, 0.08, 0.32); },
    };
  })();
  L.sound = Sound;
  function syncSoundButtons() {
    $$(".sound-toggle").forEach((b) => {
      b.setAttribute("aria-pressed", String(Sound.on));
      b.setAttribute("aria-label", Sound.on ? "Turn sound off" : "Turn sound on");
      b.classList.toggle("on", Sound.on);
    });
  }
  $$(".sound-toggle").forEach((b) => b.addEventListener("click", () => { Sound.set(!Sound.on); syncSoundButtons(); }));
  syncSoundButtons();
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".sound-toggle")) return;
    if (e.target.closest(".btn, .seg span, .chips span, .species-tabs button, .lang-pick button, .faq summary, .theme-toggle, .nav-cta")) Sound.tap();
    else if (e.target.closest(".nav-links a, .menu-links a, .footer a, .piece, .svc, .map-state")) Sound.chisel();
  }, { passive: true });

  /* ---------------- Theme (night default, daylight optional) ---------------- */
  const metaTheme = $('meta[name="theme-color"]');
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    if (metaTheme) metaTheme.content = t === "light" ? "#f3ede3" : "#120e0b";
    $$(".theme-toggle").forEach((b) => {
      b.setAttribute("aria-pressed", String(t === "light"));
      b.setAttribute("aria-label", t === "light" ? "Switch to night theme" : "Switch to daylight theme");
    });
  }
  applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  $$(".theme-toggle").forEach((b) => b.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.classList.add("theme-anim");
    applyTheme(next); store.set("lux-theme", next); Sound.plane();
    setTimeout(() => document.documentElement.classList.remove("theme-anim"), 700);
    document.dispatchEvent(new CustomEvent("lux:theme", { detail: next }));
  }));

  /* ---------------- Cursor ---------------- */
  const cursor = $(".cursor");
  if (cursor) {
    if (finePointer && !reduced) {
      let cx = -100, cy = -100, tx = -100, ty = -100;
      addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; cursor.classList.add("on"); }, { passive: true });
      document.addEventListener("pointerleave", () => cursor.classList.remove("on"));
      document.addEventListener("pointerover", (e) => {
        const t = e.target.closest("[data-cursor]");
        cursor.classList.toggle("big", !!t);
        $(".cursor-label", cursor).textContent = t ? t.dataset.cursor : "";
      });
      (function loop() {
        cx = lerp(cx, tx, 0.22); cy = lerp(cy, ty, 0.22);
        cursor.style.transform = `translate(${cx}px, ${cy}px)`;
        requestAnimationFrame(loop);
      })();
    } else cursor.remove();
  }

  /* ---------------- Header & mobile menu ---------------- */
  const nav = $(".nav"), burger = $(".nav-burger"), menu = $("#menu");
  L.menuOpen = false;
  const setMenu = (open) => {
    if (!menu || open === L.menuOpen) return;
    L.menuOpen = open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.classList.toggle("open", open);
    nav.classList.toggle("menu-open", open);
    nav.classList.remove("hide");
    document.body.classList.toggle("menu-lock", open);
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) { $("a", menu).focus({ preventScroll: true }); Sound.plane(); }
  };
  if (burger) burger.addEventListener("click", () => setMenu(!L.menuOpen));
  if (menu) $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));
  addEventListener("resize", () => innerWidth > 1060 && setMenu(false));

  const fab = $(".wa-fab"), contact = $("#contact");
  let lastY = scrollY, ticking = false;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    if (nav) {
      nav.classList.toggle("scrolled", y > 40);
      nav.classList.toggle("hide", y > lastY && y > innerHeight * 0.8 && !L.menuOpen);
    }
    if (fab) {
      let overContact = false;
      if (contact) { const r = contact.getBoundingClientRect(); overContact = r.top < innerHeight && r.bottom > 0; }
      fab.classList.toggle("show", y > innerHeight * 0.6 && !overContact);
    }
    lastY = y;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------------- Page transitions ---------------- */
  const curtain = document.createElement("div");
  curtain.className = "curtain"; curtain.setAttribute("aria-hidden", "true");
  curtain.innerHTML = `<img src="${root}assets/img/logo.svg" alt="" width="56" height="56">`;
  document.body.appendChild(curtain);
  const ss = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }, del: (k) => { try { sessionStorage.removeItem(k); } catch (e) {} } };
  if (ss.get("lux-nav") && !reduced) {
    ss.del("lux-nav");
    curtain.classList.add("cover");
    requestAnimationFrame(() => requestAnimationFrame(() => curtain.classList.add("lift")));
    setTimeout(() => (curtain.className = "curtain"), 1100);   // park it, hidden, once it has lifted
  }
  ss.set("lux-visited", "1");
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || a.target === "_blank" || a.hasAttribute("download") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname) return;               // in-page anchor
    if (reduced) return;
    e.preventDefault();
    ss.set("lux-nav", "1");
    Sound.plane();
    curtain.className = "curtain in";
    setTimeout(() => (location.href = url.href), 620);
  });
  addEventListener("pageshow", (e) => { if (e.persisted) curtain.className = "curtain"; });

  /* ---------------- Offline support & "Add to home screen" ---------------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener("load", () => navigator.serviceWorker.register(`${root}sw.js`).catch(() => {}));
  }
  let deferred = null;
  const installBtns = $$(".install-btn");
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferred = e;
    installBtns.forEach((b) => (b.hidden = false));
  });
  installBtns.forEach((b) => b.addEventListener("click", async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null; installBtns.forEach((x) => (x.hidden = true));
    } else {
      const hint = $(".install-hint"); if (hint) hint.hidden = !hint.hidden;
    }
  }));
  // iOS Safari has no install prompt: show the button with a how-to hint instead
  if (!standalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) installBtns.forEach((b) => (b.hidden = false));
  addEventListener("appinstalled", () => installBtns.forEach((b) => (b.hidden = true)));
})();
