/* ==========================================================
   LUX96 — behaviour for piece, service and care pages
   ========================================================== */
(function () {
  const L = window.LUX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = L.reduced;

  /* reveal on scroll (same classes the home page uses, so alive.js word reveals work too) */
  const rvIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); rvIO.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  $$(".sec-label, .display, .specs > div, .p-about, .p-options, .steps li, .mini, .c-item, .s-makes li, .s-other-list li, .pay-steps li, .est-head, .tray")
    .forEach((el) => { el.classList.add("rv"); rvIO.observe(el); });

  /* furniture renders (big one first, minis when they come into view) */
  const main = $(".p-canvas");
  if (main) Render.piece(main, main.dataset.piece, main.dataset.species);
  const miniIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const c = e.target; Render.piece(c, c.dataset.piece, c.dataset.species); miniIO.unobserve(c);
  }), { rootMargin: "200px" });
  $$(".mini canvas").forEach((c) => miniIO.observe(c));

  /* piece page: preview the piece in another timber */
  const names = { walnut: "Walnut", oak: "Oak", iroko: "Iroko", mahogany: "Mahogany", teak: "Teak", ash: "Ash" };
  $$(".p-swatches button").forEach((b) => {
    const sw = document.createElement("i");
    sw.style.backgroundImage = `url(${Wood.texture(b.dataset.species, 60, 60, 5, 120).toDataURL()})`;
    b.prepend(sw);
    b.addEventListener("click", () => {
      $$(".p-swatches button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      main.dataset.species = b.dataset.species;
      main.classList.remove("swap"); void main.offsetWidth; main.classList.add("swap");
      Render.piece(main, main.dataset.piece, b.dataset.species);
      $(".p-timber").textContent = names[b.dataset.species];
      // the enquiry mentions the chosen timber
      const cta = $(".p-actions .c-wa");
      if (cta) {
        cta.dataset.msg = cta.dataset.msg.replace(/( in \w+)? from your website/, ` in ${names[b.dataset.species]} from your website`);
        L.refreshLinks();
      }
    });
  });

  /* service page: a live, lit slab behind the title */
  const slabCv = $(".s-slab");
  if (slabCv) {
    const slab = Wood.slab(slabCv, slabCv.dataset.species, 5);
    const hero = $(".s-hero");
    let tx = 0.6, ty = 0.5, x = tx, y = ty, user = false;
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = hero.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = 1 - (e.clientY - r.top) / r.height; user = true;
    });
    hero.addEventListener("pointerleave", () => (user = false));
    slab.setLight(x, y);
    if (!reduced) (function loop(t) {
      if (!user) { tx = 0.62 + Math.sin(t / 2600) * 0.24; ty = 0.5 + Math.cos(t / 3300) * 0.18; }
      x += (tx - x) * 0.06; y += (ty - y) * 0.06; slab.setLight(x, y);
      requestAnimationFrame(loop);
    })(0);
  }

  let w = innerWidth;
  addEventListener("resize", () => {
    clearTimeout(window.__prz);
    window.__prz = setTimeout(() => {
      if (Math.abs(innerWidth - w) < 80) return;
      w = innerWidth;
      if (main) Render.piece(main, main.dataset.piece, main.dataset.species);
    }, 200);
  });
})();
