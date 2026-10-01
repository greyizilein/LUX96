/* ==========================================================
   LUX96 — motion layer
   Small interactions that make the page feel alive. Everything
   here is progressive: if this file fails, the site still works.
   Disabled entirely for prefers-reduced-motion.
   ========================================================== */
(function () {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  document.documentElement.classList.add("alive");

  /* ---------- Headings rise word by word ---------- */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "wd";
            const inner = document.createElement("span"); inner.className = "wi"; inner.textContent = p;
            inner.style.setProperty("--i", i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          if (n.classList.contains("ring-n")) {           // live counter: move as one unit
            const w = document.createElement("span"); w.className = "wd";
            const inner = document.createElement("span"); inner.className = "wi"; inner.style.setProperty("--i", i++);
            n.replaceWith(w); inner.appendChild(n); w.appendChild(inner);
          } else walk(n);
        }
      });
    };
    walk(el);
    el.classList.add("split");
  }
  $$(".display:not(.hero-title)").forEach(splitWords);

  /* ---------- Arrows on every call-to-action ---------- */
  $$(".btn").forEach((b) => {
    if ($(".arr", b)) return;
    const href = b.getAttribute("href") || "";
    const a = document.createElement("span");
    a.className = "arr"; a.setAttribute("aria-hidden", "true");
    a.textContent = /^(https?:|mailto:)/.test(href) && !href.includes(location.host) ? "↗" : "→";
    b.append(" ", a);
  });

  /* ---------- Tap ripple ---------- */
  const rippleTargets = ".btn, .nav-cta, .seg span, .chips span, .species-tabs button, .socials a, .lang-pick button, .icon-btn";
  document.addEventListener("pointerdown", (e) => {
    const t = e.target.closest(rippleTargets);
    if (!t) return;
    const r = t.getBoundingClientRect();
    const s = document.createElement("span");
    s.className = "ripple";
    const d = Math.max(r.width, r.height) * 2.2;
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    t.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
  }, { passive: true });

  /* ---------- Magnetic buttons (mouse only) ---------- */
  if (fine) {
    $$(".btn, .nav-cta, .wa-fab, .nav-burger, .socials a").forEach((el) => {
      const strength = el.classList.contains("wa-fab") ? 0.3 : 0.22;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * strength}px`);
        el.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * strength}px`);
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); });
    });

    /* catalogue cards tilt toward the cursor */
    $$(".piece:not(.piece-end)").forEach((p) => {
      const m = $(".piece-media", p);
      p.addEventListener("pointermove", (e) => {
        const r = m.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        m.style.setProperty("--rx", `${-y * 7}deg`); m.style.setProperty("--ry", `${x * 9}deg`);
        m.style.setProperty("--gx", `${(x + 0.5) * 100}%`); m.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
      });
      p.addEventListener("pointerleave", () => { m.style.setProperty("--rx", "0deg"); m.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------- Reveal helpers ---------- */
  const once = (sel, cls, opts) => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add(cls); io.unobserve(e.target); } }), opts);
    $$(sel).forEach((el) => io.observe(el));
  };
  once(".piece", "seen", { rootMargin: "0px 0px -10% 0px" });
  // the wordmark starts fully clipped, so watch its footer instead of the word itself
  if ($(".footer-word")) {
    const fio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { $(".footer-word").classList.add("seen"); fio.disconnect(); } }, { threshold: 0.25 });
    fio.observe($(".footer"));
  }
  once(".step-n", "seen", { threshold: 0.6 });

  /* ---------- Services: on touch, light the row in the middle of the screen ---------- */
  if (!fine) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("active", e.isIntersecting)),
      { rootMargin: "-49% 0px -49% 0px" });
    $$(".svc").forEach((s) => io.observe(s));
  }

  /* ---------- Catalogue: one-time "you can swipe this" nudge on touch ---------- */
  if (!fine) {
    const track = $(".work-track");
    if (track) { const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setTimeout(() => {
        if (track.scrollLeft > 4) return;
        track.scrollTo({ left: 90, behavior: "smooth" });
        setTimeout(() => track.scrollTo({ left: 0, behavior: "smooth" }), 650);
      }, 500);
    }, { threshold: 0.6 });
    io.observe(track); }
  }

  /* ---------- Scroll-linked motion: hero parallax + marquee velocity ---------- */
  const heroInner = $(".hero-inner"), hero = $(".hero");
  const marquee = $(".marquee-track");
  const mAnim = marquee && marquee.getAnimations ? marquee.getAnimations()[0] : null;
  let lastY = scrollY, vel = 0, raf = 0;
  function frame() {
    raf = 0;
    const y = scrollY, h = hero ? hero.offsetHeight : 0;
    if (hero && heroInner && y < h * 1.2) {
      const p = clamp(y / h, 0, 1);
      heroInner.style.transform = `translate3d(0, ${p * h * 0.28}px, 0)`;
      heroInner.style.opacity = String(1 - p * 1.15);
    }
    vel = clamp(vel * 0.9 + (y - lastY) * 0.1, -60, 60);
    lastY = y;
    if (mAnim) mAnim.playbackRate = vel < -0.5 ? -1 - Math.abs(vel) / 6 : 1 + Math.abs(vel) / 6;
    if (marquee) marquee.style.setProperty("--skew", `${clamp(-vel * 0.25, -8, 8)}deg`);
    if (Math.abs(vel) > 0.05) raf = requestAnimationFrame(frame);
  }
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });

  /* ---------- Configurator: values tick when they change ---------- */
  const cfg = $("#cfg");
  if (cfg) {
    const bump = (el) => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); };
    let prev = {};
    cfg.addEventListener("input", () => {
      requestAnimationFrame(() => $$(".spec b, .build-ctrl output", cfg).forEach((b, i) => {
        if (prev[i] !== b.textContent) bump(b);
        prev[i] = b.textContent;
      }));
      $$(".view canvas").forEach(bump);
    });
  }

  /* ---------- FAQ: answers open and close smoothly ---------- */
  $$(".faq details").forEach((d) => {
    const sum = $("summary", d), body = $("div", d);
    sum.addEventListener("click", (e) => {
      e.preventDefault();
      if (d.dataset.anim) return;
      d.dataset.anim = "1";
      const ease = "cubic-bezier(.2,.7,.1,1)";
      if (d.open) {
        d.classList.remove("is-open");
        body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 380, easing: ease })
          .onfinish = () => { d.open = false; delete d.dataset.anim; };
      } else {
        d.open = true; d.classList.add("is-open");
        body.animate([{ height: "0px", opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 480, easing: ease })
          .onfinish = () => delete d.dataset.anim;
      }
    });
    if (d.open) d.classList.add("is-open");
  });

  /* ---------- Timber tabs: card content swaps with a soft rise ---------- */
  const tabs = $(".species-tabs");
  if (tabs) tabs.addEventListener("click", (e) => {
    if (!e.target.closest("button")) return;
    $$(".species-name, .species-desc, .species-spec").forEach((el) => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); });
  });
})();
