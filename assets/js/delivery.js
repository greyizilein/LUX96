/* ==========================================================
   LUX96 — "Where we deliver" map
   Coverage comes from LUX.deliveryStates / LUX.installStates (config.js).
   ========================================================== */
// Runs once the 00→96 count has finished, so the counter always gets the device to itself.
window.LUX.afterCount(function () {
  const L = window.LUX, M = window.NG_MAP;
  const svg = document.querySelector(".ng-map svg");
  if (!svg || !M) return;
  const NS = "http://www.w3.org/2000/svg";
  const all = M.locations.map((l) => l.id);
  const deliver = L.deliveryStates === "all" ? all : (L.deliveryStates || []);
  const install = L.installStates || [];
  const FIX = { fct: "Abuja (FCT)", nassarawa: "Nasarawa" };
  const nameOf = (l) => FIX[l.id] || l.name;
  if (!install.length) document.querySelector(".lg-inst-wrap").hidden = true;

  const status = (id) => install.includes(id) ? "inst" : deliver.includes(id) ? "del" : "ask";
  const NOTE = {
    inst: "We deliver and install here.",
    del: "We deliver here.",
    ask: "Not on our usual routes — ask us, we may still be able to help.",
  };
  const nameEl = document.querySelector(".ds-name"), noteEl = document.querySelector(".ds-note");
  const askBtn = document.querySelector(".delivery .c-wa");
  const paths = {};

  // a pulsing pin marks the selected state
  const pin = document.createElementNS(NS, "g");
  pin.setAttribute("class", "map-pin");
  pin.innerHTML = '<circle class="pin-ring" r="10"/><circle class="pin-dot" r="7"/>';
  let current = null;
  function select(loc) {
    if (current === loc.id) return;
    current = loc.id;
    Object.values(paths).forEach((p) => p.classList.toggle("sel", p === paths[loc.id]));
    const p = paths[loc.id];
    if (p) {
      svg.appendChild(p);              // bring to front so its lift and shadow show
      svg.appendChild(pin);
      const b = p.getBBox();
      pin.setAttribute("transform", `translate(${b.x + b.width / 2} ${b.y + b.height / 2})`);
      pin.classList.add("on");
    }
    nameEl.textContent = nameOf(loc);
    noteEl.textContent = NOTE[status(loc.id)];
    if (askBtn) {
      askBtn.dataset.msg = `Do you deliver to ${nameOf(loc)}? I'd like to order a piece.`;
      if (L.refreshLinks) L.refreshLinks();
    }
  }

  M.locations.forEach((loc, i) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", loc.path);
    p.setAttribute("class", `map-state ${status(loc.id)}`);
    p.setAttribute("tabindex", "0");
    p.setAttribute("role", "button");
    p.setAttribute("aria-label", `${nameOf(loc)}: ${NOTE[status(loc.id)]}`);
    p.style.setProperty("--d", `${(i % 37) * 28}ms`);
    p.addEventListener("click", () => select(loc));
    p.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && select(loc));
    p.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(loc); } });
    svg.appendChild(p);
    paths[loc.id] = p;
  });

  // states rise in one by one when the map scrolls into view
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    svg.classList.add("drawn");
    io.disconnect();
  }, { threshold: 0.25 });
  io.observe(svg);

  // start with a sensible selection: the first installation state, else Lagos, else the first lit state
  const start = M.locations.find((l) => l.id === (install[0] || (deliver.includes("lagos") ? "lagos" : deliver[0])));
  if (start) select(start);
});
