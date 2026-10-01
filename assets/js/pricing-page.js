/* ==========================================================
   LUX96 — pricing page: price tag, price guide, breakdown,
   estimator, project tray and checkout → personalised invoice
   ========================================================== */
(function () {
  const L = window.LUX, X = window.LuxPrice, P = X.P;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = L.reduced;
  const TYPES = Object.keys(P.items);
  const TIMBERS = Object.keys(P.timbers);
  const swatch = (sp, size = 52) => {
    const c = document.createElement("canvas"); c.width = c.height = size; c.setAttribute("aria-hidden", "true");
    c.getContext("2d").drawImage(Wood.texture(sp, size * 2, size * 2, 5, 160), 0, 0, size, size); return c;
  };
  const ICONS = {
    table: "M3 9h18M5 9v10M19 9v10M7 9v4h10V9", chairs: "M7 3v18M7 12h10v9M7 12V6", sideboard: "M3 6h18v11H3zM9 6v11M15 6v11M5 17v3M19 17v3",
    wardrobe: "M5 2h14v19H5zM12 2v19M10 11h0M14 11h0", lounge: "M5 10h14v6H5zM3 9v9M21 9v9M7 10V5h10v5M6 16v3M18 16v3", bed: "M3 18V8M3 14h18v4M21 14v-3a2 2 0 0 0-2-2H9v5", desk: "M3 8h18M5 8v12M14 8v12h6V8M14 13h6",
    shelf: "M5 3v18M19 3v18M5 7h14M5 12h14M5 17h14", door: "M6 2h12v20H6zM15 12h0", kitchen: "M3 10h18v10H3zM3 4h18v4H3zM9 10v10M15 10v10",
  };
  const icon = (t) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[t]}"/></svg>`;

  // copy the deposit / validity / discount settings into the page
  $$(".dep-pct").forEach((e) => (e.textContent = L.depositPercent));
  $$(".valid-days").forEach((e) => (e.textContent = P.quoteValidDays));
  $(".full-off").textContent = P.fullPaymentDiscount ? `· save ${P.fullPaymentDiscount}%` : "";
  $(".full-faq").textContent = P.fullPaymentDiscount
    ? `Yes — pay the full amount up front and we take ${P.fullPaymentDiscount}% off. Choose “Pay in full” in your project before creating your invoice.`
    : "We keep prices the same whichever way you pay — a deposit to start and the balance on delivery.";
  $(".ts-disc-row").hidden = true;

  /* ---------------- Hero: a swinging wooden price tag ---------------- */
  const tag = $(".tag");
  tag.style.backgroundImage = `linear-gradient(160deg, rgba(255,240,215,.18), rgba(0,0,0,.25)), url(${Wood.texture("teak", 520, 640, 17, 300).toDataURL("image/jpeg", .85)})`;
  const tagPrice = $(".tag-price"), tagItem = $(".tag-item");
  let tagI = 0;
  function cycleTag() {
    const t = TYPES[tagI++ % TYPES.length];
    tagItem.classList.add("out");
    setTimeout(() => { tagItem.textContent = P.items[t].label; tagItem.classList.remove("out"); }, 300);
    X.odometer(tagPrice, X.fromPrice(t, "iroko"));
    tag.classList.remove("nudge"); void tag.offsetWidth; tag.classList.add("nudge");
  }
  cycleTag();
  if (!reduced) setInterval(cycleTag, 3200);

  /* ---------------- Price guide ---------------- */
  let guideTimber = "iroko";
  const cards = $(".pr-cards");
  TYPES.forEach((t) => {
    const def = P.items[t];
    const a = document.createElement("article");
    a.className = "pr-card";
    a.innerHTML = `<div class="pr-card-media"><canvas data-kind="${def.render}"></canvas></div>
      <div class="pr-card-body"><h3>${def.label}</h3><span class="label">from</span><b class="odo pr-card-price">₦0</b>
      <button type="button" class="pr-card-go" data-type="${t}" data-cursor="Price">Price it <span aria-hidden="true">→</span></button></div>`;
    cards.appendChild(a);
  });
  const guideIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const c = $("canvas", e.target); Render.piece(c, c.dataset.kind, guideTimber); c.dataset.drawn = guideTimber;
    guideIO.unobserve(e.target);
  }), { rootMargin: "200px" });
  $$(".pr-card").forEach((c) => guideIO.observe(c));
  function priceGuide() {
    $$(".pr-card").forEach((card, i) => {
      X.odometer($(".pr-card-price", card), X.fromPrice(TYPES[i], guideTimber));
      const c = $("canvas", card);
      if (c.dataset.drawn && c.dataset.drawn !== guideTimber) { Render.piece(c, c.dataset.kind, guideTimber); c.dataset.drawn = guideTimber; }
    });
  }
  const gChips = $(".pr-timber-chips");
  TIMBERS.forEach((sp) => {
    const l = document.createElement("label");
    l.innerHTML = `<input type="radio" name="g-timber" value="${sp}" ${sp === guideTimber ? "checked" : ""}><span></span>`;
    $("span", l).append(swatch(sp), P.timbers[sp].label);
    gChips.appendChild(l);
  });
  gChips.addEventListener("change", (e) => { guideTimber = e.target.value; priceGuide(); });
  priceGuide();
  cards.addEventListener("click", (e) => {
    const b = e.target.closest(".pr-card-go"); if (!b) return;
    setType(b.dataset.type, { species: guideTimber });
    $("#estimator").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  });

  /* ---------------- Where the money goes ---------------- */
  const bar = $(".split-bar"), legend = $(".split-legend");
  const SEG_WOOD = ["walnut", "oak", "mahogany", "teak", "ash"];
  P.breakdown.forEach((b, i) => {
    const seg = document.createElement("div");
    seg.className = "split-seg"; seg.style.setProperty("--w", `${b.pct}%`); seg.style.setProperty("--i", i);
    seg.style.backgroundImage = `url(${Wood.texture(SEG_WOOD[i % SEG_WOOD.length], 400, 120, 3 + i, 200).toDataURL("image/jpeg", .8)})`;
    seg.innerHTML = `<span>${b.pct}%</span>`;
    seg.tabIndex = 0;
    bar.appendChild(seg);
    const li = document.createElement("div");
    li.className = "split-item"; li.style.setProperty("--i", i);
    li.innerHTML = `<b>${b.pct}<small>%</small></b><span>${b.label}</span><p>${b.note}</p>`;
    legend.appendChild(li);
    const hot = (on) => { seg.classList.toggle("hot", on); li.classList.toggle("hot", on); bar.classList.toggle("has-hot", on); };
    [seg, li].forEach((el) => { el.addEventListener("pointerenter", () => hot(true)); el.addEventListener("pointerleave", () => hot(false)); });
    seg.addEventListener("focus", () => hot(true)); seg.addEventListener("blur", () => hot(false));
  });
  $(".split-sentence").innerHTML = P.breakdown.map((b) => `<b>${X.fmt(b.pct * 10000)}</b> ${b.label.toLowerCase()}`).join(", ").replace(/, ([^,]*)$/, " and $1");
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { bar.classList.add("grown"); legend.classList.add("grown"); o.disconnect(); } }, { threshold: 0.4 }).observe(bar);

  /* ---------------- Estimator ---------------- */
  const form = $("#est-form");
  const state = { type: "table", species: "iroko", finish: "oil", values: {}, addons: [] };
  const typesEl = $(".est-types"), inputsEl = $(".est-inputs"), addonsEl = $(".est-addons");

  TYPES.forEach((t) => {
    const l = document.createElement("label");
    l.className = "est-type";
    l.innerHTML = `<input type="radio" name="type" value="${t}"><span>${icon(t)}<em>${P.items[t].label}</em></span>`;
    typesEl.appendChild(l);
  });
  const tChips = $(".est-timbers");
  TIMBERS.forEach((sp) => {
    const l = document.createElement("label");
    l.innerHTML = `<input type="radio" name="species" value="${sp}"><span></span>`;
    $("span", l).append(swatch(sp), P.timbers[sp].label);
    tChips.appendChild(l);
  });
  const fEl = $(".est-finishes");
  Object.entries(P.finishes).forEach(([k, f]) => {
    const l = document.createElement("label");
    l.innerHTML = `<input type="radio" name="finish" value="${k}"><span>${f.label}</span>`;
    fEl.appendChild(l);
  });

  function buildInputs() {
    const def = P.items[state.type];
    inputsEl.innerHTML = "";
    def.inputs.forEach((inp) => {
      const v = state.values[inp.key] !== undefined ? state.values[inp.key] : inp.value;
      state.values[inp.key] = v;
      const wrap = document.createElement("div");
      if (inp.options) {
        wrap.className = "seg est-opts";
        inp.options.forEach((o, i) => {
          const l = document.createElement("label");
          l.innerHTML = `<input type="radio" name="in-${inp.key}" value="${i}" ${i === v ? "checked" : ""}><span>${o}</span>`;
          wrap.appendChild(l);
        });
        wrap.addEventListener("change", (e) => { state.values[inp.key] = +e.target.value; update(); });
      } else {
        wrap.className = "rng est-rng";
        wrap.innerHTML = `<div class="rng-row"><span>${inp.label}</span><output>${v}${inp.unit ? " " + inp.unit : ""}</output></div>
          <input type="range" min="${inp.min}" max="${inp.max}" step="${inp.step}" value="${v}" aria-label="${inp.label}">`;
        const r = $("input", wrap), out = $("output", wrap);
        const paint = () => r.style.setProperty("--p", `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
        paint();
        r.addEventListener("input", () => { state.values[inp.key] = +r.value; out.textContent = `${r.value}${inp.unit ? " " + inp.unit : ""}`; paint(); update(); });
      }
      inputsEl.appendChild(wrap);
    });
    addonsEl.innerHTML = "";
    (def.addons || []).forEach((a) => {
      const l = document.createElement("label");
      l.className = "toggle";
      l.innerHTML = `<input type="checkbox" value="${a.key}" ${state.addons.includes(a.key) ? "checked" : ""}><span></span>${a.label}`;
      addonsEl.appendChild(l);
    });
  }
  addonsEl.addEventListener("change", () => { state.addons = $$("input:checked", addonsEl).map((i) => i.value); update(); });

  function setType(t, extra = {}) {
    if (!P.items[t]) return;
    if (state.type !== t) { state.values = {}; state.addons = []; }
    state.type = t;
    Object.assign(state, extra.species ? { species: extra.species } : {}, extra.finish ? { finish: extra.finish } : {});
    if (extra.values) Object.assign(state.values, extra.values);
    if (extra.addons) state.addons = extra.addons.filter((k) => (P.items[t].addons || []).some((a) => a.key === k));
    form.elements.type.value = t;
    form.elements.species.value = state.species;
    form.elements.finish.value = state.finish;
    buildInputs(); update(true);
  }
  form.addEventListener("change", (e) => {
    if (e.target.name === "type") setType(e.target.value);
    if (e.target.name === "species") { state.species = e.target.value; update(true); }
    if (e.target.name === "finish") { state.finish = e.target.value; update(); }
  });

  const canvas = $(".est-canvas"), renderTag = $(".est-render-tag");
  let lastRender = "";
  let current = null;
  function update(rerender) {
    current = X.priceItem(state);
    const def = P.items[state.type];
    const key = `${def.render}|${state.species}`;
    if (rerender || key !== lastRender) {
      lastRender = key;
      canvas.classList.remove("swap"); void canvas.offsetWidth; canvas.classList.add("swap");
      Render.piece(canvas, def.render, state.species);
    }
    renderTag.textContent = `${current.title} · ${current.timber}`;
    $(".docket-title").textContent = current.title;
    $(".docket-detail").textContent = `${current.detail} · ${current.finish}`;
    $(".docket-no").textContent = `No. ${String(project.length + 1).padStart(2, "0")}`;
    const ul = $(".docket-lines");
    ul.innerHTML = current.lines.map((l) => `<li><span>${l.label}</span><b>${X.fmt(l.amount)}</b></li>`).join("");
    X.odometer($(".docket-odo"), current.total);
    $(".docket-range").textContent = `Likely ${X.fmt(current.low)} – ${X.fmt(current.high)}`;
  }

  /* ---------------- Project tray ---------------- */
  const KEY = "lux-project";
  let project = [];
  try { project = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(project)); } catch (e) {} };
  const stateSel = $(".tray-state"), installCb = $(".tray-install");
  const centres = X.stateCentres() || {};
  Object.entries(centres).sort((a, b) => a[1].name.localeCompare(b[1].name)).forEach(([id, c]) => {
    const o = document.createElement("option"); o.value = id; o.textContent = c.name; stateSel.appendChild(o);
  });
  try { const s = JSON.parse(localStorage.getItem("lux-delivery") || "{}"); if (s.state) stateSel.value = s.state; installCb.checked = !!s.install; } catch (e) {}

  const plan = () => (form.ownerDocument.querySelector('input[name="plan"]:checked') || {}).value || "deposit";
  function renderTray() {
    const list = $(".tray-list");
    $(".tray-count").textContent = `${project.length} piece${project.length === 1 ? "" : "s"}`;
    if (!project.length) {
      list.innerHTML = `<li class="tray-empty">Nothing here yet — price a piece above and tap <b>Add to my project</b>.</li>`;
    } else {
      list.innerHTML = project.map((it, i) => `
        <li class="tray-item" data-i="${i}">
          <i class="tray-sw" style="background-image:url(${swatch(it.species, 40).toDataURL()})"></i>
          <div><b>${it.title}</b><span>${it.detail} · ${it.timber} · ${it.finish}</span></div>
          <div class="tray-qty"><button type="button" data-q="-1" aria-label="One fewer">−</button><span>${it.qty}</span><button type="button" data-q="1" aria-label="One more">+</button></div>
          <b class="tray-amt">${X.fmt(it.total * it.qty)}</b>
          <button type="button" class="tray-rm" aria-label="Remove ${it.title}">×</button>
        </li>`).join("");
    }
    const t = X.totals(project, stateSel.value, installCb.checked, plan());
    $(".ts-sub").textContent = X.fmt(t.sub);
    $(".ts-del").textContent = stateSel.value ? (t.delivery ? X.fmt(t.delivery) : "Free") : "Choose a state";
    $(".ts-km").textContent = stateSel.value ? `≈ ${t.km.toLocaleString()} km` : "";
    $(".ts-inst-row").hidden = !installCb.checked;
    $(".ts-inst").textContent = X.fmt(t.install);
    $(".ts-disc-row").hidden = !t.discount;
    $(".ts-disc").textContent = `− ${X.fmt(t.discount)}`;
    X.odometer($(".ts-odo"), t.total);
    $(".ts-pay").textContent = `${X.fmt(t.payNow)}${plan() === "full" ? " (paid in full)" : ` (${t.depositPct}% deposit)`}`;
    $(".est-checkout").disabled = !project.length;
    try { localStorage.setItem("lux-delivery", JSON.stringify({ state: stateSel.value, install: installCb.checked })); } catch (e) {}
    return t;
  }
  $(".tray-list").addEventListener("click", (e) => {
    const li = e.target.closest(".tray-item"); if (!li) return;
    const i = +li.dataset.i;
    if (e.target.closest(".tray-rm")) { li.classList.add("leaving"); setTimeout(() => { project.splice(i, 1); save(); renderTray(); }, 280); return; }
    const q = e.target.closest("[data-q]");
    if (q) { project[i].qty = Math.max(1, Math.min(50, project[i].qty + +q.dataset.q)); save(); renderTray(); }
  });
  [stateSel, installCb].forEach((el) => el.addEventListener("change", renderTray));
  $$('input[name="plan"]').forEach((r) => r.addEventListener("change", renderTray));

  // "Add to my project": the docket flies down into the tray
  $(".est-add").addEventListener("click", () => {
    project.push({ ...current, type: state.type, species: state.species, finishKey: state.finish, values: { ...state.values }, addons: [...state.addons], qty: 1 });
    save();
    const from = $(".docket").getBoundingClientRect(), to = $(".tray").getBoundingClientRect();
    if (!reduced) {
      const ghost = $(".docket").cloneNode(true);
      ghost.classList.add("docket-ghost");
      Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px` });
      document.body.appendChild(ghost);
      ghost.animate([
        { transform: "none", opacity: 1 },
        { transform: `translate(${to.left + 40 - from.left}px, ${Math.min(to.top, innerHeight - 80) - from.top}px) scale(.25) rotate(-8deg)`, opacity: 0.2 },
      ], { duration: 750, easing: "cubic-bezier(.6,0,.3,1)" }).onfinish = () => ghost.remove();
    }
    L.sound && L.sound.chisel();
    setTimeout(() => { renderTray(); $(".tray").classList.remove("pulse"); void $(".tray").offsetWidth; $(".tray").classList.add("pulse"); }, reduced ? 0 : 600);
    update();
  });

  /* ---------------- Checkout → invoice ---------------- */
  const co = $("#checkout");
  $(".est-checkout").addEventListener("click", () => {
    co.hidden = false;
    requestAnimationFrame(() => co.classList.add("open"));
    co.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    setTimeout(() => $("#c-name").focus({ preventScroll: true }), 500);
  });
  co.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(co));
    const err = $(".checkout-err");
    const missing = [];
    if (!String(d.name || "").trim()) missing.push("your name");
    if (String(d.phone || "").replace(/\D/g, "").length < 7) missing.push("a phone number");
    if (!stateSel.value) missing.push("your delivery state (in the project above)");
    if (!d.agree) missing.push("your agreement to the estimate terms");
    $$("[aria-invalid]", co).forEach((x) => x.removeAttribute("aria-invalid"));
    if (missing.length) {
      err.textContent = `Please add ${missing.join(", ")}.`; err.hidden = false;
      if (!String(d.name || "").trim()) $("#c-name").setAttribute("aria-invalid", "true");
      if (String(d.phone || "").replace(/\D/g, "").length < 7) $("#c-phone").setAttribute("aria-invalid", "true");
      return;
    }
    err.hidden = true;
    const t = X.totals(project, stateSel.value, installCb.checked, plan());
    const now = new Date();
    const inv = {
      id: X.invoiceId(d.name + d.phone + JSON.stringify(project)),
      date: now.toISOString(),
      valid: new Date(now.getTime() + P.quoteValidDays * 864e5).toISOString(),
      customer: { name: d.name.trim(), phone: d.phone.trim(), email: (d.email || "").trim(), address: (d.address || "").trim(), note: (d.note || "").trim(), state: centres[stateSel.value] ? centres[stateSel.value].name : "" },
      items: project.map((it) => ({ title: it.title, detail: it.detail, timber: it.timber, finish: it.finish, species: it.species, qty: it.qty, unit: it.total })),
      plan: plan(), install: installCb.checked,
      totals: { sub: t.sub, delivery: t.delivery, km: t.km, install: t.install, discount: t.discount, total: t.total, payNow: t.payNow, balance: t.balance, depositPct: t.depositPct },
    };
    const link = `invoice.html#i=${X.pack(inv)}`;
    X.remember(inv, link);
    L.sound && L.sound.plane();
    location.href = link;
  });

  /* ---------------- Your invoices on this device ---------------- */
  const mine = X.mine();
  if (mine.length) {
    const box = $(".my-invoices"); box.hidden = false;
    $("ul", box).innerHTML = mine.map((m) => `<li><a href="${m.link}" data-cursor="Open"><b>${m.id}</b><span>${new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${m.name}</span><em>${X.fmt(m.total)}</em></a></li>`).join("");
  }

  /* ---------------- Start state: from a link (?type=…), a saved project, or the default ---------------- */
  const q = new URLSearchParams(location.search);
  const startType = q.get("type") && P.items[q.get("type")] ? q.get("type") : "table";
  const values = {};
  q.forEach((v, k) => { if (!["type", "species", "finish", "addons"].includes(k) && !isNaN(+v)) values[k] = +v; });
  setType(startType, {
    species: P.timbers[q.get("species")] ? q.get("species") : "iroko",
    finish: P.finishes[q.get("finish")] ? q.get("finish") : "oil",
    values, addons: (q.get("addons") || "").split(",").filter(Boolean),
  });
  renderTray();
  if (q.get("type")) setTimeout(() => $("#estimator").scrollIntoView({ behavior: "auto" }), 50);
})();
