/* ==========================================================
   LUX96 — pricing engine (shared by the pricing page and invoices)
   Needs: pricing-data.js (and nigeria-map.js for delivery distances)
   ========================================================== */
(function () {
  const P = window.LUX_PRICING;
  const round = (n, to = 1000) => Math.round(n / to) * to;
  const fmt = (n) => `${P.currency}${Math.round(n).toLocaleString("en-NG")}`;

  /* ---------- one piece ---------- */
  // sel = { type, species, finish, values: {…}, addons: [keys] }
  function priceItem(sel) {
    const def = P.items[sel.type];
    const v = sel.values;
    const t = P.timbers[sel.species] || P.timbers.iroko;
    const f = P.finishes[sel.finish] || P.finishes.oil;
    const parts = def.price(v);
    const lines = [];
    lines.push({ label: "Design, joinery & labour", amount: parts.base });
    lines.push({ label: `${t.label} timber${t.mult !== 1 ? ` (×${t.mult})` : ""}`, amount: parts.wood * t.mult });
    let pct = 0;
    (def.addons || []).forEach((a) => {
      if (!sel.addons.includes(a.key)) return;
      if (a.pct) { pct += a.pct; return; }
      let amt = a.add * (a.perQty ? v.qty || 1 : 1);
      if (a.perUnit) amt += v[a.perUnit.key] * a.perUnit.rate * t.mult;
      lines.push({ label: a.label, amount: amt });
    });
    let sub = lines.reduce((s, l) => s + l.amount, 0);
    if (pct) { lines.push({ label: `Fitted / custom build +${pct}%`, amount: sub * pct / 100 }); sub *= 1 + pct / 100; }
    if (f.mult !== 1) { lines.push({ label: `${f.label} finish +${Math.round((f.mult - 1) * 100)}%`, amount: sub * (f.mult - 1) }); sub *= f.mult; }
    const total = round(sub);
    return {
      total, lines: lines.map((l) => ({ ...l, amount: round(l.amount, 500) })),
      low: round(total * P.estimateSpread[0], 5000), high: round(total * P.estimateSpread[1], 5000),
      title: def.label, detail: def.detail(v), timber: t.label, finish: f.label,
    };
  }

  // cheapest sensible version of a piece, for the "from" price guide
  function fromPrice(type, species) {
    const def = P.items[type];
    const values = {};
    def.inputs.forEach((i) => (values[i.key] = def.from[i.key] !== undefined ? def.from[i.key] : (i.options ? 0 : i.min)));
    return priceItem({ type, species, finish: "oil", values, addons: [] }).total;
  }

  /* ---------- delivery distance from the map geometry ---------- */
  let centres = null;
  function stateCentres() {
    if (centres || !window.NG_MAP) return centres;
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", window.NG_MAP.viewBox);
    svg.style.cssText = "position:absolute;width:744px;height:600px;left:-9999px;top:0;visibility:hidden";
    document.body.appendChild(svg);
    centres = {};
    window.NG_MAP.locations.forEach((l) => {
      const p = document.createElementNS(NS, "path"); p.setAttribute("d", l.path); svg.appendChild(p);
      const b = p.getBBox(); centres[l.id] = { x: b.x + b.width / 2, y: b.y + b.height / 2, name: l.id === "fct" ? "Abuja (FCT)" : l.id === "nassarawa" ? "Nasarawa" : l.name };
    });
    svg.remove();
    return centres;
  }
  const KM_PER_UNIT = 1.75; // map is ~744 units across ~1,300 km of Nigeria
  function delivery(stateId, itemsTotal, install) {
    const c = stateCentres();
    if (!c || !stateId || !c[stateId]) return { km: 0, fee: 0, install: 0 };
    const a = c[P.workshopState] || c.lagos, b = c[stateId];
    const km = Math.round(Math.hypot(a.x - b.x, a.y - b.y) * KM_PER_UNIT * P.delivery.roadFactor);
    const fee = km <= P.delivery.freeWithinKm ? 0 : round(P.delivery.base + km * P.delivery.perKm, 500);
    const inst = install ? Math.max(P.installation.minimum, round(itemsTotal * P.installation.percent / 100, 500)) : 0;
    return { km, fee, install: inst };
  }

  /* ---------- a whole project ---------- */
  function totals(items, stateId, install, plan) {
    const sub = items.reduce((s, it) => s + it.total * (it.qty || 1), 0);
    const d = delivery(stateId, sub, install);
    let total = sub + d.fee + d.install;
    const discount = plan === "full" && P.fullPaymentDiscount ? round(total * P.fullPaymentDiscount / 100, 500) : 0;
    total -= discount;
    const depositPct = (window.LUX && window.LUX.depositPercent) || 60;
    const payNow = plan === "full" ? total : round(total * depositPct / 100, 500);
    return { sub, delivery: d.fee, km: d.km, install: d.install, discount, total, payNow, balance: total - payNow, depositPct };
  }

  /* ---------- odometer numbers ---------- */
  // Renders "₦1,234,000" as rolling digit wheels. Call again with a new value to roll.
  function odometer(el, value) {
    const text = fmt(value);
    if (el.dataset.len !== String(text.length)) {
      el.innerHTML = "";
      [...text].forEach((ch) => {
        if (/\d/.test(ch)) {
          const d = document.createElement("span"); d.className = "odo-d";
          const s = document.createElement("span"); s.className = "odo-s";
          s.textContent = "0123456789"; d.appendChild(s); el.appendChild(d);
        } else {
          const c = document.createElement("span"); c.className = "odo-c"; c.textContent = ch; el.appendChild(c);
        }
      });
      el.dataset.len = String(text.length);
      el.setAttribute("aria-label", text);
    }
    const wheels = el.querySelectorAll(".odo-s");
    let k = 0;
    [...text].forEach((ch) => {
      if (!/\d/.test(ch)) return;
      const w = wheels[k++];
      w.style.transitionDelay = `${k * 35}ms`;
      w.style.transform = `translateY(-${+ch}em)`;
    });
    el.setAttribute("aria-label", text);
  }

  /* ---------- invoices: packed into the link itself ---------- */
  const b64 = {
    enc: (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
    dec: (s) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))),
  };
  // small, deterministic checksum so an edited link is spotted (not security — the workshop always checks)
  function checksum(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function invoiceId(seed) {
    const d = new Date();
    const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    return `LUX-${ymd}-${checksum(seed + d.getTime()).slice(0, 4).toUpperCase()}`;
  }
  function pack(inv) {
    const body = JSON.stringify(inv);
    return b64.enc(JSON.stringify({ v: 1, b: body, c: checksum(body) }));
  }
  function unpack(s) {
    try {
      const o = JSON.parse(b64.dec(s));
      const inv = JSON.parse(o.b);
      return { inv, ok: checksum(o.b) === o.c };
    } catch (e) { return null; }
  }

  // invoices this browser has created, for the "Your invoices" list
  const MINE = "lux-invoices";
  function remember(inv, link) {
    try {
      const list = JSON.parse(localStorage.getItem(MINE) || "[]").filter((x) => x.id !== inv.id);
      list.unshift({ id: inv.id, date: inv.date, total: inv.totals.total, name: inv.customer.name, link });
      localStorage.setItem(MINE, JSON.stringify(list.slice(0, 8)));
    } catch (e) {}
  }
  function mine() { try { return JSON.parse(localStorage.getItem(MINE) || "[]"); } catch (e) { return []; } }

  window.LuxPrice = { P, fmt, round, priceItem, fromPrice, delivery, totals, odometer, stateCentres, pack, unpack, invoiceId, remember, mine };
})();
