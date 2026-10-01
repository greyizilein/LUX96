/* ==========================================================
   LUX96 — the opening screen, always moving
   1. A live workshop clock (Lagos time) with open / closed state.
   2. A muted, looping clip from the workshop floor (common.js plays it).
   3. Workshop life on the wood: a hand plane gliding along the
      grain, curled shavings spinning off it, dust in the light.
   ========================================================== */
window.LUX.afterCount(function () {
  const L = window.LUX;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const hero = $(".hero");
  if (!hero) return;
  const reduced = L.reduced;
  let heroVisible = true, pageVisible = !document.hidden;
  new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe(hero);
  document.addEventListener("visibilitychange", () => (pageVisible = !document.hidden));

  /* ---------------- 1. Live workshop clock ---------------- */
  const H = L.hours || { days: [1, 2, 3, 4, 5, 6], open: 8, close: 18 };
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const chip = $(".live-chip"), stateEl = $(".live-state"), timeEl = $(".live-time");
  const lagosNow = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Lagos", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    return { day: DAYS.indexOf(parts.weekday), h: +parts.hour, m: +parts.minute, s: +parts.second, text: `${parts.hour}:${parts.minute}:${parts.second}` };
  };
  const pad = (n) => String(n).padStart(2, "0");
  function tickClock() {
    const t = lagosNow();
    const open = H.days.includes(t.day) && t.h >= H.open && t.h < H.close;
    timeEl.textContent = t.text;
    chip.classList.toggle("open", open);
    if (open) stateEl.textContent = "Workshop open";
    else {
      // next opening time
      let d = t.day, today = H.days.includes(d) && t.h < H.open;
      if (!today) { for (let i = 1; i <= 7; i++) { d = (t.day + i) % 7; if (H.days.includes(d)) break; } }
      stateEl.textContent = `Closed · opens ${today ? "today" : DAYS[d]} ${pad(H.open)}:00`;
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* 2. The workshop clip itself is handled with every other clip in common.js (Film reels). */

  /* ---------------- 3. Workshop life on the wood ---------------- */
  const cv = $(".hero-fx");
  if (!cv || reduced) return;
  const ctx = cv.getContext("2d");
  let W = 0, Hh = 0, dpr = 1;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = hero.getBoundingClientRect();
    W = r.width; Hh = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  new ResizeObserver(size).observe(hero);

  const rand = (a, b) => a + Math.random() * (b - a);
  // dust motes drifting through the light
  const dust = Array.from({ length: Math.round(Math.min(90, (W * Hh) / 9000)) }, () => ({
    x: rand(0, 1), y: rand(0, 1), r: rand(0.6, 2.2), vx: rand(-0.012, 0.012), vy: rand(-0.02, -0.004), ph: rand(0, 6.28),
  }));
  // the plane and its shavings
  const plane = { active: false, x: 0, y: 0, len: 0, speed: 0, wait: 900, trail: [] };
  const shavings = [];
  function clearStrip(need) {
    const top = hero.getBoundingClientRect().top;
    const blocks = $$(".hero-top, .hero-side, .hero-title, .hero-foot, .nav")
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height)
      .map((r) => [r.top - top - 8, r.bottom - top + 8])
      .sort((a, b) => a[0] - b[0]);
    const gaps = [];
    let y = Math.max(0, 70);
    blocks.forEach(([a, b]) => { if (a - y > 0) gaps.push([y, a]); y = Math.max(y, b); });
    if (Hh - y > 0) gaps.push([y, Hh]);
    const fit = gaps.filter(([a, b]) => b - a >= need);
    const pool = fit.length ? fit : gaps.sort((p, q) => (q[1] - q[0]) - (p[1] - p[0])).slice(0, 1);
    if (!pool.length) return Hh * 0.35;
    const [a, b] = pool[Math.floor(Math.random() * pool.length)];
    return a + need / 2 + Math.random() * Math.max(0, b - a - need);
  }
  function launchPlane() {
    plane.active = true;
    plane.len = Math.max(110, Math.min(190, W * 0.16));
    plane.dir = Math.random() < 0.5 ? 1 : -1;
    plane.x = plane.dir > 0 ? -plane.len : W + plane.len;
    // glide along a clear strip of wood, away from the text and the workshop clip
    plane.y = clearStrip(plane.len * 0.42);
    plane.speed = W / rand(2.8, 3.6);        // crosses the screen in ~3s
    plane.tilt = rand(-0.05, 0.05);
  }
  function drawPlane(p) {
    const l = p.len, w = l * 0.36;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.tilt + (p.dir < 0 ? Math.PI : 0));
    // soft shadow
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath(); ctx.ellipse(6, 10, l * 0.55, w * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    // sole / body
    const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
    g.addColorStop(0, "#9b7550"); g.addColorStop(0.5, "#6e4d31"); g.addColorStop(1, "#4a3220");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(-l / 2, -w / 2, l, w, w * 0.32); ctx.fill();
    ctx.strokeStyle = "rgba(255,230,190,.25)"; ctx.lineWidth = 1; ctx.stroke();
    // cheeks (metal sides)
    ctx.fillStyle = "rgba(30,24,20,.55)";
    ctx.fillRect(-l * 0.42, -w / 2, l * 0.84, w * 0.12); ctx.fillRect(-l * 0.42, w / 2 - w * 0.12, l * 0.84, w * 0.12);
    // blade & lever cap
    const b = ctx.createLinearGradient(-l * 0.05, 0, l * 0.12, 0);
    b.addColorStop(0, "#f0d79a"); b.addColorStop(1, "#8a6528");
    ctx.fillStyle = b; ctx.beginPath(); ctx.roundRect(-l * 0.06, -w * 0.3, l * 0.2, w * 0.6, 4); ctx.fill();
    // front knob and rear tote
    ctx.fillStyle = "#3b2618";
    ctx.beginPath(); ctx.arc(l * 0.36, 0, w * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,220,170,.35)"; ctx.beginPath(); ctx.arc(l * 0.34, -w * 0.06, w * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#3b2618"; ctx.beginPath(); ctx.roundRect(-l * 0.46, -w * 0.16, l * 0.24, w * 0.32, w * 0.14); ctx.fill();
    ctx.restore();
  }
  function spawnShaving() {
    const back = plane.dir > 0 ? -1 : 1;
    shavings.push({
      x: plane.x + back * plane.len * 0.02, y: plane.y + rand(-6, 6),
      vx: plane.dir * rand(20, 80) + rand(-30, 30), vy: rand(-90, -30) * (Math.random() < 0.5 ? 1 : -1),
      rot: rand(0, 6.28), vr: rand(-4, 4), r: rand(6, 13) * (plane.len / 150), life: 0, max: rand(1.8, 3),
      tone: Math.random() < 0.5 ? [233, 207, 160] : [214, 178, 128],
    });
  }
  function drawShaving(s) {
    const a = Math.max(0, 1 - s.life / s.max);
    ctx.save();
    ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.scale(1, 0.8 + 0.2 * Math.sin(s.life * 6));
    ctx.lineCap = "round";
    // a curl: a spiral ribbon, light face with a darker edge
    for (const [lw, col] of [[s.r * 0.55, `rgba(120,80,45,${0.35 * a})`], [s.r * 0.38, `rgba(${s.tone},${0.95 * a})`]]) {
      ctx.lineWidth = lw; ctx.strokeStyle = col;
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.05) {
        const ang = t * Math.PI * 2.6, rr = s.r * (1 - t * 0.7);
        const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr;
        t ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  let last = performance.now();
  (function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (heroVisible && pageVisible) {
      ctx.clearRect(0, 0, W, Hh);

      // freshly planed streaks fade out behind the plane
      plane.trail = plane.trail.filter((t) => (t.a -= dt * 0.35) > 0);
      plane.trail.forEach((t) => {
        const g = ctx.createLinearGradient(0, t.y - t.h, 0, t.y + t.h);
        g.addColorStop(0, "rgba(255,228,190,0)"); g.addColorStop(0.5, `rgba(255,228,190,${0.16 * t.a})`); g.addColorStop(1, "rgba(255,228,190,0)");
        ctx.fillStyle = g; ctx.fillRect(t.x0, t.y - t.h, t.x1 - t.x0, t.h * 2);
      });

      // dust in the light: brighter near the lamp
      const lt = L.heroLight || { x: 0.6, y: 0.55 };
      const lx = lt.x * W, ly = (1 - lt.y) * Hh;
      dust.forEach((d) => {
        d.x += d.vx * dt; d.y += d.vy * dt; d.ph += dt;
        if (d.y < -0.02) { d.y = 1.02; d.x = rand(0, 1); }
        if (d.x < -0.02) d.x = 1.02; if (d.x > 1.02) d.x = -0.02;
        const px = d.x * W + Math.sin(d.ph * 0.8) * 6, py = d.y * Hh;
        const near = Math.exp(-((px - lx) ** 2 + (py - ly) ** 2) / (2 * (Math.min(W, Hh) * 0.35) ** 2));
        ctx.fillStyle = `rgba(255,232,196,${0.08 + 0.55 * near})`;
        ctx.beginPath(); ctx.arc(px, py, d.r, 0, Math.PI * 2); ctx.fill();
      });

      // the plane
      if (!plane.active) { plane.wait -= dt * 1000; if (plane.wait <= 0) launchPlane(); }
      else {
        const prevX = plane.x;
        plane.x += plane.dir * plane.speed * dt;
        plane.y += Math.sin(now / 400) * 0.15;
        const h = plane.len * 0.2;
        const tr = plane.trail[plane.trail.length - 1];
        if (tr && tr.live) { tr.x0 = Math.min(tr.x0, plane.x); tr.x1 = Math.max(tr.x1, plane.x); tr.a = 1; }
        else plane.trail.push({ x0: Math.min(prevX, plane.x), x1: Math.max(prevX, plane.x), y: plane.y, h, a: 1, live: true });
        if (Math.random() < dt * 22) spawnShaving();
        if ((plane.dir > 0 && plane.x > W + plane.len) || (plane.dir < 0 && plane.x < -plane.len)) {
          plane.active = false; plane.wait = rand(2200, 4200);
          if (plane.trail.length) plane.trail[plane.trail.length - 1].live = false;
        }
      }

      // shavings tumble and settle
      for (let i = shavings.length - 1; i >= 0; i--) {
        const s = shavings[i];
        s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.985; s.vy = s.vy * 0.97 + 26 * dt; s.rot += s.vr * dt;
        if (s.life > s.max) shavings.splice(i, 1); else drawShaving(s);
      }
      if (plane.active) drawPlane(plane);
    }
    requestAnimationFrame(frame);
  })(last);
});
