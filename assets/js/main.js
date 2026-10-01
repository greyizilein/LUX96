/* ==========================================================
   LUX96 Furnitures — home page behaviour
   (shared behaviour lives in common.js; settings in config.js)
   ========================================================== */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isDesktop = () => innerWidth > 820;
  const LUX = window.LUX;
  const waLink = LUX.wa;

  /* ---------------- Loader ---------------- */
  const loader = $(".loader");
  const start = () => document.body.classList.add("ready");
  let visited = false; try { visited = !!sessionStorage.getItem("lux-visited-home"); sessionStorage.setItem("lux-visited-home", "1"); } catch (e) {}
  if (loader && !reduced && !visited) {
    const svg = $(".loader-rings", loader);
    const rings = [];
    for (let i = 1; i <= 12; i++) {
      const e = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      e.setAttribute("cx", 100 - i * 0.3); e.setAttribute("cy", 100 + i * 0.25);
      e.setAttribute("rx", i * 7.6); e.setAttribute("ry", i * 7.1);
      svg.appendChild(e); rings.push(e);
    }
    const num = $(".loader-count span", loader);
    const t0 = performance.now(), dur = 1500;
    (function tick(now) {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      num.textContent = String(Math.round(e * 96)).padStart(2, "0");
      rings.forEach((r, i) => r.classList.toggle("on", i < e * 12));
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => { loader.classList.add("done"); start(); setTimeout(() => loader.remove(), 1200); }, 250);
    })(t0);
  } else {
    loader && loader.remove();
    start();
  }

  const sections = $$('#nav-links a[href^="#"]').map((a) => [a, $(a.getAttribute("href"))]).filter(([, s]) => s);

  /* ---------------- Hero slab ---------------- */
  const hero = $(".hero");
  const heroSlab = Wood.slab($(".hero-slab"), "walnut", 3);
  const lx = $(".lx"), ly = $(".ly");
  let L = { x: 0.62, y: 0.58, tx: 0.62, ty: 0.58, user: false };
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    L.tx = (e.clientX - r.left) / r.width; L.ty = 1 - (e.clientY - r.top) / r.height; L.user = true;
  });
  hero.addEventListener("pointerleave", () => (L.user = false));
  let heroVisible = true;
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe(hero);
  (function heroLoop(t) {
    if (heroVisible && !reduced) {
      if (!L.user) { L.tx = 0.6 + Math.sin(t / 2600) * 0.22; L.ty = 0.55 + Math.cos(t / 3400) * 0.16; }
      L.x = lerp(L.x, L.tx, 0.06); L.y = lerp(L.y, L.ty, 0.06);
      heroSlab.setLight(L.x, L.y);
      lx.textContent = L.x.toFixed(2); ly.textContent = L.y.toFixed(2);
    }
    requestAnimationFrame(heroLoop);
  })(0);

  /* ---------------- Manifesto words ---------------- */
  const man = $("[data-words]");
  man.innerHTML = man.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span> `).join("");
  const words = $$(".w", man);

  /* ---------------- Counters ---------------- */
  const io = (cb, opts) => new IntersectionObserver((es, o) => es.forEach((e) => e.isIntersecting && (cb(e.target), o.unobserve(e.target))), opts);
  const countIO = io((el) => {
    const end = +el.dataset.count, t0 = performance.now(), d = 1400;
    (function f(n) { const p = clamp((n - t0) / d, 0, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((el) => (reduced ? (el.textContent = el.dataset.count) : countIO.observe(el)));

  /* ---------------- Reveal ---------------- */
  const rvIO = io((el) => el.classList.add("in"), { rootMargin: "0px 0px -8% 0px" });
  $$(".sec-label, .display:not(.hero-title), .svc, .steps li, .fact, .species-card, .timber-specimen, .build-views, .build-ctrl, .quote, .contact-list, .work-note, .joints li, .care-tips li, .faq-list details, .ng-map, .greet-pick")
    .forEach((el) => { el.classList.add("rv"); rvIO.observe(el); });

  /* ---------------- Rings ---------------- */
  const ringsSec = $(".rings"), ringsCv = $(".rings-canvas"), ringN = $(".ring-n");
  const rctx = ringsCv.getContext("2d");
  const ringW = [], RN = 96;
  let seed = 7; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < RN; i++) ringW.push(0.6 + rand() * 0.9 + (i % 9 === 0 ? 0.8 : 0));
  const ringSum = ringW.reduce((a, b) => a + b, 0);
  const wob = Array.from({ length: 7 }, (_, j) => [rand() * 6.28, (0.004 + rand() * 0.01) / (1 + j * 0.35)]);
  let lastRings = -1, ringRGB = "200,161,101", ringHi = "rgba(230,197,138,.95)";
  const ringColours = () => {
    const light = document.documentElement.dataset.theme === "light";
    ringRGB = light ? "138,97,37" : "200,161,101"; ringHi = light ? "rgba(120,80,25,.95)" : "rgba(230,197,138,.95)";
  };
  ringColours();
  document.addEventListener("lux:theme", () => { ringColours(); lastRings = -1; onScroll(); });
  function drawRings(p) {
    const n = Math.round(clamp(p, 0, 1) * RN);
    if (n === lastRings && ringsCv.width) return;
    lastRings = n;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = ringsCv.clientWidth, H = ringsCv.clientHeight;
    if (ringsCv.width !== Math.round(W * dpr)) { ringsCv.width = Math.round(W * dpr); ringsCv.height = Math.round(H * dpr); }
    rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rctx.clearRect(0, 0, W, H);
    const ox = W * 0.5 + W * 0.04, oy = H * 0.52;
    const maxR = Math.hypot(W, H) * 0.62;
    let acc = 0;
    for (let i = 0; i < n; i++) {
      acc += ringW[i];
      const r = (acc / ringSum) * maxR;
      const age = (n - i) / RN;
      rctx.beginPath();
      for (let k = 0; k <= 160; k++) {
        const a = (k / 160) * Math.PI * 2;
        let d = 1;
        wob.forEach(([ph, amp], j) => (d += Math.sin(a * (j + 2) + ph + i * 0.05) * amp * Math.min(1, i / 10)));
        d += Math.cos(a - 0.6) * 0.035 * Math.min(1, i / 30);
        const x = ox + Math.cos(a) * r * d * 1.08, y = oy + Math.sin(a) * r * d * 0.94;
        k ? rctx.lineTo(x, y) : rctx.moveTo(x, y);
      }
      rctx.closePath();
      const fresh = i === n - 1;
      rctx.strokeStyle = fresh ? ringHi : `rgba(${ringRGB},${0.1 + 0.32 * (1 - age)})`;
      rctx.lineWidth = fresh ? 2 : i % 9 === 0 ? 1.4 : 0.8;
      rctx.stroke();
    }
    ringN.textContent = n;
  }

  /* ---------------- Work: horizontal scroll ---------------- */
  const work = $(".work"), pin = $(".work-pin"), track = $(".work-track");
  function layoutWork() {
    const on = isDesktop() && !reduced;
    work.classList.toggle("pinned", on);
    track.style.transform = "";
    if (on) {
      const dist = track.scrollWidth - innerWidth;
      pin.style.setProperty("--pin-h", `${dist + innerHeight}px`);
      work._dist = dist;
    }
  }
  // render the pieces (skip any that already use a real photo)
  const pieceCanvases = $$("canvas[data-piece]");
  function renderPieces() {
    let i = 0;
    const next = () => {
      const c = pieceCanvases[i++]; if (!c) return;
      Render.piece(c, c.dataset.piece, c.dataset.species);
      // a real photo (data-photo="assets/img/work/….jpg") replaces the render once it loads
      if (c.dataset.photo && !c._photo) {
        c._photo = true;
        const img = new Image();
        img.alt = c.closest(".piece").querySelector("h3").textContent;
        img.onload = () => c.replaceWith(img);
        img.src = c.dataset.photo;
      }
      (window.requestIdleCallback || setTimeout)(next);
    };
    next();
  }
  /* ---------------- Services: floating swatch ---------------- */
  const float = $(".svc-float");
  if (finePointer) {
    const swatch = {};
    $$(".svc").forEach((s) => {
      s.addEventListener("pointerenter", () => {
        const sp = s.dataset.species;
        swatch[sp] = swatch[sp] || Wood.texture(sp, 260, 320, 9, 260).toDataURL("image/jpeg", 0.85);
        float.style.backgroundImage = `url(${swatch[sp]})`;
        float.classList.add("on");
      });
      s.addEventListener("pointerleave", () => float.classList.remove("on"));
      s.addEventListener("pointermove", (e) => { float.style.left = e.clientX + 40 + "px"; float.style.top = e.clientY + "px"; });
    });
  }

  /* ---------------- Timber library ---------------- */
  const INFO = {
    walnut:   { tone: "Chocolate brown with purple-grey streaks", char: "Straight to wavy grain, rich figure", best: "Dining tables, desks, statement pieces", janka: 1010,
                desc: "The cabinetmaker's favourite: dark, calm and endlessly deep under oil. Walnut ages to a warmer, honeyed brown." },
    oak:      { tone: "Pale honey to light tan", char: "Bold grain, ray fleck when quartersawn", best: "Wardrobes, kitchens, doors, floors", janka: 1360,
                desc: "Strong, honest and familiar. Oak takes stains and fumed finishes beautifully and shrugs off daily use." },
    iroko:    { tone: "Golden yellow, darkening to warm brown", char: "Interlocked grain, naturally durable", best: "Doors, frames, worktops, outdoor", janka: 1260,
                desc: "A dependable West African hardwood with teak-like durability. Ideal where moisture and wear are a concern." },
    mahogany: { tone: "Reddish brown with a deep lustre", char: "Ribbon stripe, very stable", best: "Beds, cabinets, classic interiors", janka: 830,
                desc: "Smooth to work and stable across seasons, with a glow that deepens every year. The classic choice for fine cabinetry." },
    teak:     { tone: "Golden brown, silvers outdoors", char: "Naturally oily, weather resistant", best: "Outdoor furniture, bathrooms", janka: 1155,
                desc: "Rich in natural oils, teak resists water and rot. Leave it to silver outdoors, or oil it to keep the gold." },
    ash:      { tone: "Creamy white to light brown", char: "Straight, open grain; tough and springy", best: "Chairs, bentwork, Scandinavian pieces", janka: 1320,
                desc: "Light, bright and remarkably tough. Ash flexes without breaking, which is why it has made chairs for centuries." },
  };
  const names = Object.keys(Wood.species);
  const swatchCanvas = (sp) => { const c = document.createElement("canvas"); c.width = c.height = 52; c.getContext("2d").drawImage(Wood.texture(sp, 104, 104, 5, 160), 0, 0, 52, 52); c.setAttribute("aria-hidden", "true"); return c; };
  const tabs = $(".species-tabs");
  const specimen = Wood.slab($(".specimen-slab"), "walnut", 8);
  const specEl = $(".timber-specimen");
  // light follows the pointer; otherwise it drifts slowly across the board
  let specHover = false, specVisible = false;
  specEl.addEventListener("pointermove", (e) => { specHover = e.pointerType === "mouse"; const r = specEl.getBoundingClientRect(); specimen.setLight((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height); });
  specEl.addEventListener("pointerleave", () => (specHover = false));
  specimen.setLight(0.62, 0.62);
  new IntersectionObserver(([e]) => (specVisible = e.isIntersecting)).observe(specEl);
  if (!reduced) (function drift(t) {
    if (specVisible && !specHover) specimen.setLight(0.5 + Math.sin(t / 2300) * 0.3, 0.55 + Math.cos(t / 3100) * 0.28);
    requestAnimationFrame(drift);
  })(0);
  function pickSpecies(sp) {
    $$("button", tabs).forEach((b) => { const on = b.dataset.sp === sp; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
    const i = INFO[sp];
    $(".species-name").textContent = Wood.species[sp].name;
    $(".species-desc").textContent = i.desc;
    $(".sp-tone").textContent = i.tone; $(".sp-char").textContent = i.char; $(".sp-best").textContent = i.best;
    $(".sp-hard").style.width = `${(i.janka / 1500) * 100}%`;
    $(".sp-janka").textContent = `≈ ${i.janka} lbf Janka`;
    specimen.setSpecies(sp);
  }
  names.forEach((sp) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "tab"); b.dataset.sp = sp;
    b.append(swatchCanvas(sp), Wood.species[sp].name.split(" ").pop());
    b.addEventListener("click", () => pickSpecies(sp));
    b.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return;
      const n = names[(names.indexOf(sp) + d + names.length) % names.length]; pickSpecies(n); $(`[data-sp="${n}"]`, tabs).focus();
    });
    tabs.appendChild(b);
  });
  pickSpecies("walnut");

  /* ---------------- Dovetail ---------------- */
  const dtSvg = $(".dovetail"), tailsG = $(".dt-tails");
  (function buildDovetail() {
    const xs = [0, 1, 2].map((i) => 60 + (400 * (i + 0.5)) / 3);
    const top = 230, deep = 290, a = 22, b = 40;
    let pins = `M60 380 L60 ${top}`;
    xs.forEach((c) => (pins += ` L${c - a} ${top} L${c - b} ${deep} L${c + b} ${deep} L${c + a} ${top}`));
    pins += ` L460 ${top} L460 380 Z`;
    let tails = `M60 80 L460 80 L460 ${top}`;
    [...xs].reverse().forEach((c) => (tails += ` L${c + a} ${top} L${c + b} ${deep} L${c - b} ${deep} L${c - a} ${top}`));
    tails += ` L60 ${top} Z`;
    $(".dt-pins").setAttribute("d", pins);
    $("path", tailsG).setAttribute("d", tails);
    $(".dt-tex-a").setAttribute("href", Wood.texture("oak", 520, 420, 4, 420).toDataURL("image/jpeg", 0.85));
    $(".dt-tex-b").setAttribute("href", Wood.texture("walnut", 520, 420, 12, 420).toDataURL("image/jpeg", 0.85));
  })();

  /* ---------------- Configurator ---------------- */
  const cfgForm = $("#cfg"), planCv = $(".cfg-plan"), sideCv = $(".cfg-side");
  const chips = $("#cfg-species");
  names.forEach((sp, i) => {
    const l = document.createElement("label");
    l.innerHTML = `<input type="radio" name="species" value="${sp}" ${i === 0 ? "checked" : ""}><span></span>`;
    $("span", l).append(swatchCanvas(sp), Wood.species[sp].name.split(" ").pop());
    chips.appendChild(l);
  });
  const lenR = $("[name=length]", cfgForm), widR = $("[name=width]", cfgForm);
  let lastShape = "rect";
  function readCfg() {
    const f = cfgForm.elements;
    const shape = f.shape.value;
    if (shape !== lastShape) {
      if (shape === "round") { widR.min = 90; widR.max = 160; widR.value = 130; }
      else if (lastShape === "round") { widR.min = 80; widR.max = 120; widR.value = 95; }
      lastShape = shape;
    }
    return { shape, species: f.species.value, length: +lenR.value, width: +widR.value, base: f.base.value, edge: f.edge.value };
  }
  let cfgRaf = 0;
  function updateCfg() {
    const c = readCfg();
    $(".rng-length").classList.toggle("disabled", c.shape === "round");
    lenR.disabled = c.shape === "round";
    $(".w-label").textContent = c.shape === "round" ? "Diameter" : "Width";
    $("#o-length").textContent = `${c.length} cm`;
    $("#o-width").textContent = `${c.width} cm`;
    [lenR, widR].forEach((r) => r.style.setProperty("--p", `${((r.value - r.min) / (r.max - r.min)) * 100}%`));
    $(".cfg-dims").textContent = c.shape === "round" ? `Ø ${c.width}` : `${c.length} × ${c.width}`;
    cancelAnimationFrame(cfgRaf);
    cfgRaf = requestAnimationFrame(() => {
      const seats = Render.tablePlan(planCv, c);
      Render.tableSide(sideCv, c);
      $(".cfg-seats").textContent = seats;
      const len = c.shape === "round" ? c.width : c.length;
      const finish = { square: "oil", chamfer: "oil", rounded: "oil" }[c.edge];
      $(".cfg-price").href = `pricing/?type=table&length=${len}&width=${c.width}&species=${c.species}&finish=${finish}${c.base !== "legs" ? "&addons=trestle" : ""}`;
    });
    return c;
  }
  cfgForm.addEventListener("input", updateCfg);
  $(".cfg-send").addEventListener("click", () => {
    const c = updateCfg();
    const label = (n, v) => $(`input[name="${n}"][value="${v}"] + span`, cfgForm).textContent.trim();
    const msg = [
      `${LUX.hello()}, LUX96! I designed a table on your website:`,
      "",
      `• Shape: ${label("shape", c.shape)}`,
      `• Timber: ${Wood.species[c.species].name}`,
      c.shape === "round" ? `• Diameter: ${c.width} cm` : `• Size: ${c.length} × ${c.width} cm`,
      `• Base: ${label("base", c.base)}`,
      `• Edge: ${label("edge", c.edge)}`,
      `• Seats: about ${Render.seatsFor(c)}`,
      "",
      "Could you send me a quote and lead time?",
    ].join("\n");
    window.open(waLink(msg), "_blank", "noopener");
  });

  /* ---------------- Quote form ---------------- */
  const form = $("#quote"), err = $(".q-err");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const via = (e.submitter && e.submitter.dataset.via) || "whatsapp";
    const d = Object.fromEntries(new FormData(form));
    const missing = ["name", "message"].filter((k) => !String(d[k] || "").trim());
    $$("[aria-invalid]", form).forEach((el) => el.removeAttribute("aria-invalid"));
    if (missing.length) {
      missing.forEach((k) => form.elements[k].setAttribute("aria-invalid", "true"));
      err.textContent = "Please add your name and a few words about the piece.";
      err.hidden = false; form.elements[missing[0]].focus(); return;
    }
    err.hidden = true;
    const body = [
      `${LUX.hello()}, LUX96! I'd like a quote.`, "",
      `Name: ${d.name}`, d.phone ? `Phone: ${d.phone}` : null, d.email ? `Email: ${d.email}` : null,
      `Project: ${d.project}`, "", d.message,
    ].filter((l) => l !== null).join("\n");
    if (via === "email") location.href = `mailto:${LUX.email}?subject=${encodeURIComponent(`Commission enquiry — ${d.project}`)}&body=${encodeURIComponent(body)}`;
    else window.open(waLink(body), "_blank", "noopener");
  });

  /* ---------------- Footer wordmark ---------------- */
  const fw = $(".footer-word");
  const fwIO = io(() => {
    fw.style.setProperty("--wood", `url(${Wood.texture("teak", 1600, 520, 31, 300).toDataURL("image/jpeg", 0.85)})`);
    fw.classList.add("textured");
  }, { rootMargin: "400px" });
  fwIO.observe(fw.closest("footer"));

  /* ---------------- FAQ structured data (built from the visible answers) ---------------- */
  const faqLd = $("#faq-ld");
  if (faqLd) faqLd.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: $$(".faq details").map((d) => ({
      "@type": "Question", name: $("summary", d).textContent.trim(),
      acceptedAnswer: { "@type": "Answer", text: $("div", d).textContent.trim().replace(/\s+/g, " ") },
    })),
  });

  /* ---------------- Scroll loop ---------------- */
  let ticking = false;
  const progress = (el) => { const r = el.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight), 0, 1); };
  function onScroll() {
    ticking = false;

    // manifesto
    const mr = man.getBoundingClientRect();
    const mp = clamp((innerHeight * 0.85 - mr.top) / (mr.height + innerHeight * 0.35), 0, 1);
    const lit = Math.round(mp * words.length);
    words.forEach((w, i) => w.classList.toggle("on", reduced || i < lit));

    // rings
    const rr = ringsSec.getBoundingClientRect();
    if (rr.bottom > 0 && rr.top < innerHeight) drawRings(reduced ? 1 : progress(ringsSec) * 1.15);

    // work
    if (work.classList.contains("pinned")) {
      const p = progress(pin);
      track.style.transform = `translate3d(${-p * work._dist}px,0,0)`;
    }

    // dovetail
    const jr = $(".joinery").getBoundingClientRect();
    if (jr.bottom > 0 && jr.top < innerHeight) {
      const jp = isDesktop() ? progress($(".joinery")) : clamp((innerHeight - jr.top) / (innerHeight * 0.9), 0, 1);
      const off = reduced ? 0 : (1 - clamp(jp * 1.6, 0, 1)) * 150;
      tailsG.setAttribute("transform", `translate(0 ${-off})`);
    }

    // current nav
    let cur = null;
    sections.forEach(([a, s]) => { const r = s.getBoundingClientRect(); if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) cur = a; });
    sections.forEach(([a]) => a.classList.toggle("current", a === cur));
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  let lastW = innerWidth;
  addEventListener("resize", () => {
    clearTimeout(window.__rz);
    window.__rz = setTimeout(() => {
      layoutWork(); lastRings = -1; ringsCv.width = 0; onScroll();
      if (Math.abs(innerWidth - lastW) > 80) { lastW = innerWidth; renderPieces(); updateCfg(); }
    }, 150);
  });

  // boot
  layoutWork();
  renderPieces();
  updateCfg();
  onScroll();
  if (document.fonts) document.fonts.ready.then(() => { layoutWork(); onScroll(); });
})();
