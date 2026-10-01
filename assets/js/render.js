/* ==========================================================
   LUX96 — furniture renderer
   Draws oblique "studio renders" of pieces on <canvas>, using
   procedural textures from wood.js. Units are centimetres,
   origin at floor-left, y pointing up.
   Render.piece(canvas, kind, species)
   Render.tablePlan(canvas, cfg) / Render.tableSide(canvas, cfg)
   ========================================================== */
(function () {
  const OB = { x: 0.34, y: 0.2 }; // oblique projection of depth

  function setup(canvas) {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round((r.width || canvas.width) * dpr);
    canvas.height = Math.round((r.height || canvas.height) * dpr);
    return canvas.getContext("2d");
  }

  function studio(ctx, W, H, floorY) {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#2a221c"); bg.addColorStop(floorY / H, "#1b1612"); bg.addColorStop(1, "#120e0b");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.3, H * 0.15, W * 0.9);
    glow.addColorStop(0, "rgba(255,214,160,.16)"); glow.addColorStop(1, "rgba(255,214,160,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,235,210,.05)"; ctx.fillRect(0, floorY, W, 1);
  }

  function makeView(ctx, W, H, piece) {
    // fit piece (w, h, d in cm) inside canvas with margins
    const totalW = piece.w + piece.d * OB.x, totalH = piece.h + piece.d * OB.y;
    const s = Math.min((W * 0.78) / totalW, (H * 0.7) / totalH);
    const floorY = H * 0.84;
    const ox = (W - totalW * s) / 2;
    const P = (x, y, z = 0) => [ox + (x + z * OB.x) * s, floorY - (y + z * OB.y) * s];
    return { s, floorY, P, ox };
  }

  function poly(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }

  let seedN = 0;
  const rnd = () => { seedN = (seedN * 9301 + 49297) % 233280; return seedN / 233280; };
  // Pattern anchored to the part so a single tile always covers it (no seams).
  function woodFill(ctx, tex, vertical, scale, pts) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const bx = Math.min(...xs), by = Math.min(...ys);
    const pw = Math.max(...xs) - bx, ph = Math.max(...ys) - by;
    const sc = Math.max(scale, (Math.max(pw, ph) + 2) / tex.width);
    const T = tex.width * sc;
    const offX = rnd() * Math.max(0, T - pw), offY = rnd() * Math.max(0, T - ph);
    const p = ctx.createPattern(tex, "no-repeat");
    const m = vertical
      ? new DOMMatrix().translateSelf(bx + T - offX, by - offY).rotateSelf(90).scaleSelf(sc)
      : new DOMMatrix().translateSelf(bx - offX, by - offY).scaleSelf(sc);
    p.setTransform(m);
    return p;
  }

  function shadeFill(ctx, pts, from, to, stops) {
    const g = ctx.createLinearGradient(from[0], from[1], to[0], to[1]);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    poly(ctx, pts); ctx.fillStyle = g; ctx.fill();
  }

  // An oblique box: front face, top face, right face.
  function box(ctx, v, tex, x, y, w, h, d, o = {}) {
    const { P, s } = v;
    const sc = o.scale || Math.max(0.35, s / 3.2);
    const front = [P(x, y + h), P(x + w, y + h), P(x + w, y), P(x, y)];
    const top = [P(x, y + h), P(x, y + h, d), P(x + w, y + h, d), P(x + w, y + h)];
    const side = [P(x + w, y + h), P(x + w, y + h, d), P(x + w, y, d), P(x + w, y)];
    const vert = !!o.vertical;
    if (o.side !== false && d > 0) {
      poly(ctx, side); ctx.fillStyle = woodFill(ctx, tex, vert, sc, side); ctx.fill();
      shadeFill(ctx, side, side[0], side[2], [[0, "rgba(0,0,0,.45)"], [1, "rgba(0,0,0,.65)"]]);
    }
    if (o.top !== false && d > 0) {
      poly(ctx, top); ctx.fillStyle = woodFill(ctx, tex, false, sc, top); ctx.fill();
      shadeFill(ctx, top, top[0], top[2], [[0, "rgba(255,236,205,.16)"], [1, "rgba(0,0,0,.12)"]]);
    }
    poly(ctx, front); ctx.fillStyle = o.color || woodFill(ctx, tex, vert, sc, front); ctx.fill();
    shadeFill(ctx, front, front[0], vert ? front[1] : front[3],
      vert ? [[0, "rgba(255,230,200,.10)"], [0.5, "rgba(0,0,0,.05)"], [1, "rgba(0,0,0,.32)"]]
           : [[0, "rgba(255,230,200,.10)"], [1, "rgba(0,0,0,.30)"]]);
    // crisp arrises
    ctx.lineWidth = Math.max(1, s * 0.12);
    ctx.strokeStyle = "rgba(255,226,180,.22)";
    ctx.beginPath(); ctx.moveTo(...front[0]); ctx.lineTo(...front[1]); ctx.stroke();
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = Math.max(1, s * 0.08);
    poly(ctx, front); ctx.stroke();
    return front;
  }

  function contactShadow(ctx, v, x, w, d) {
    const { P, s } = v;
    const [cx, cy] = P(x + w / 2, 0, d / 2);
    const rx = (w / 2 + d * 0.2) * s, ry = Math.max(6, d * s * 0.14);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, "rgba(0,0,0,.6)"); g.addColorStop(0.6, "rgba(0,0,0,.25)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function brass(ctx, v, x, y, w, h) {
    const { P } = v;
    const a = P(x, y + h), b = P(x + w, y);
    const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, "#f0d79a"); g.addColorStop(0.5, "#b88c45"); g.addColorStop(1, "#6e4f22");
    ctx.fillStyle = g; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  }

  function fabric(ctx, v, x, y, w, h, d, c1, c2, r = 4) {
    const { P, s } = v;
    const [x0, y0] = P(x, y + h), [x1, y1] = P(x + w, y);
    const [tx, ty] = P(x, y + h, d);
    // top
    poly(ctx, [P(x, y + h), P(x, y + h, d), P(x + w, y + h, d), P(x + w, y + h)]);
    ctx.fillStyle = c2; ctx.fill();
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, c2); g.addColorStop(1, c1);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, r * s); ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 1; ctx.stroke();
    void tx; void ty;
  }

  // ---------- Pieces ----------
  const PIECES = {
    table: {
      w: 220, h: 76, d: 95,
      draw(ctx, v, t) {
        const legs = (z) => { box(ctx, v, t, 10, 0, 7, 72, 7, { vertical: true, z }); box(ctx, v, t, 203, 0, 7, 72, 7, { vertical: true }); };
        // back legs (offset in depth) drawn first
        const back = { ...v, P: (x, y, z = 0) => v.P(x, y, z + 80) };
        box(ctx, back, t, 10, 0, 7, 72, 7, { vertical: true }); box(ctx, back, t, 203, 0, 7, 72, 7, { vertical: true });
        box(ctx, v, t, 14, 62, 192, 10, 84, { top: false });
        legs();
        box(ctx, v, t, 0, 72, 220, 4.5, 95);
      },
    },
    sideboard: {
      w: 180, h: 82, d: 45,
      draw(ctx, v, t) {
        box(ctx, v, t, 8, 0, 5, 16, 5, { vertical: true }); box(ctx, v, t, 167, 0, 5, 16, 5, { vertical: true });
        box(ctx, v, t, 0, 15, 180, 67, 45);
        for (let i = 0; i < 3; i++) {
          const x = 2.5 + i * 58.5;
          box(ctx, v, t, x, 18, 57, 61, 0, { vertical: true, top: false, side: false });
          brass(ctx, v, x + (i === 2 ? 4 : 51), 44, 1.6, 12);
        }
      },
    },
    wardrobe: {
      w: 120, h: 210, d: 60,
      draw(ctx, v, t) {
        box(ctx, v, t, 0, 0, 120, 8, 58);
        box(ctx, v, t, 0, 8, 120, 202, 60);
        box(ctx, v, t, 2, 10, 57.5, 198, 0, { vertical: true, top: false, side: false });
        box(ctx, v, t, 60.5, 10, 57.5, 198, 0, { vertical: true, top: false, side: false });
        brass(ctx, v, 55, 85, 1.5, 50); brass(ctx, v, 63.5, 85, 1.5, 50);
      },
    },
    bed: {
      w: 186, h: 115, d: 205,
      draw(ctx, v, t) {
        const at = (z) => ({ ...v, P: (x, y, zz = 0) => v.P(x, y, zz + z) });
        box(ctx, at(196), t, 0, 0, 186, 115, 6);
        box(ctx, v, t, 6, 0, 6, 8, 6, { vertical: true }); box(ctx, v, t, 174, 0, 6, 8, 6, { vertical: true });
        box(ctx, v, t, 0, 8, 186, 26, 196);
        fabric(ctx, at(4), 6, 34, 174, 20, 190, "#cbbfae", "#efe7db", 3);
        fabric(ctx, at(150), 18, 54, 70, 12, 36, "#d6ccbc", "#f6f0e6", 6);
        fabric(ctx, at(150), 98, 54, 70, 12, 36, "#d6ccbc", "#f6f0e6", 6);
        fabric(ctx, at(2), 4, 30, 178, 26, 110, "#4d3b2f", "#6d5546", 3);
      },
    },
    chair: {
      w: 86, h: 82, d: 70,
      draw(ctx, v, t) {
        const back = { ...v, P: (x, y, z = 0) => v.P(x, y, z + 58) };
        fabric(ctx, back, 9, 36, 68, 44, 12, "#6b3d24", "#94593a", 6);
        box(ctx, v, t, 0, 0, 9, 60, 66, { vertical: true });
        fabric(ctx, v, 9, 22, 68, 16, 60, "#6b3d24", "#a2643f", 5);
        box(ctx, v, t, 9, 14, 68, 8, 62, { top: false });
        box(ctx, v, t, 77, 0, 9, 60, 66, { vertical: true });
      },
    },
    shelf: {
      w: 100, h: 200, d: 35,
      draw(ctx, v, t) {
        const books = ["#6f2f1f", "#c8a165", "#2f3b33", "#d9cbb4", "#3b2a1e", "#8b6a45"];
        box(ctx, v, t, 0, 0, 4, 200, 35, { vertical: true, side: false });
        [0, 48, 96, 144, 196].forEach((y, i) => {
          box(ctx, v, t, 4, y, 92, 4, 35, { side: false });
          if (i < 4) {
            let x = 8 + i * 6;
            const n = 3 + ((i * 5) % 4);
            for (let k = 0; k < n; k++) {
              const bh = 28 + ((k * 7 + i * 3) % 12), bw = 3 + ((k + i) % 3);
              box(ctx, v, t, x, y + 4, bw, bh, 20, { color: books[(k + i) % books.length], side: false, top: false });
              x += bw + 0.6;
            }
            if (i % 2 === 0) fabric(ctx, v, 66, y + 4, 16, 14, 14, "#9b8f7f", "#d8cfc0", 7);
          }
        });
        box(ctx, v, t, 96, 0, 4, 200, 35, { vertical: true });
      },
    },
    desk: {
      w: 150, h: 76, d: 70,
      draw(ctx, v, t) {
        const back = { ...v, P: (x, y, z = 0) => v.P(x, y, z + 60) };
        box(ctx, back, t, 4, 0, 5, 72, 5, { vertical: true });
        box(ctx, v, t, 4, 0, 5, 72, 5, { vertical: true });
        box(ctx, v, t, 98, 0, 48, 72, 66);
        [6, 28, 50].forEach((y) => { box(ctx, v, t, 99.5, y + 1, 45, 19, 0, { top: false, side: false }); brass(ctx, v, 117, y + 11, 9, 1.4); });
        box(ctx, v, t, 0, 72, 150, 4, 70);
      },
    },
    door: {
      w: 90, h: 210, d: 5,
      draw(ctx, v, t) {
        box(ctx, v, t, 0, 0, 12, 210, 5, { vertical: true, top: false });
        box(ctx, v, t, 78, 0, 12, 210, 5, { vertical: true });
        [[0, 22], [96, 16], [190, 20]].forEach(([y, h]) => box(ctx, v, t, 12, y, 66, h, 5, { side: false }));
        [[22, 74], [112, 78]].forEach(([y, h]) => {
          box(ctx, v, t, 12, y, 66, h, 2, { vertical: true, side: false, top: false });
          const { P } = v; const a = P(18, y + h - 6), b = P(72, y + 6);
          ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2; ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
          ctx.strokeStyle = "rgba(255,226,180,.12)"; ctx.strokeRect(a[0] + 2, a[1] + 2, b[0] - a[0], b[1] - a[1]);
        });
        brass(ctx, v, 80, 100, 7, 2); brass(ctx, v, 81, 92, 2, 8);
      },
    },
  };

  function piece(canvas, kind, species) {
    const ctx = setup(canvas);
    const W = canvas.width, H = canvas.height;
    const def = PIECES[kind];
    const v = makeView(ctx, W, H, def);
    studio(ctx, W, H, v.floorY);
    contactShadow(ctx, v, 0, def.w, def.d);
    const tex = Wood.texture(species, 1024, 1024, 11, 300);
    seedN = kind.length * 3;
    def.draw(ctx, v, tex);
  }

  // ---------- Configurator renders ----------
  function shapePath(ctx, shape, cx, cy, w, h) {
    ctx.beginPath();
    if (shape === "round") ctx.ellipse(cx, cy, w / 2, w / 2, 0, 0, Math.PI * 2);
    else if (shape === "oval") ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
    else ctx.roundRect(cx - w / 2, cy - h / 2, w, h, Math.min(w, h) * 0.02);
  }

  function seatsFor(cfg) {
    const L = cfg.shape === "round" ? cfg.width : cfg.length, Wd = cfg.width;
    if (cfg.shape === "round") return Math.max(2, Math.floor((Math.PI * L) / 65));
    if (cfg.shape === "oval") {
      const a = L / 2, b = Wd / 2;
      const per = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
      return Math.max(2, Math.floor(per / 64));
    }
    const side = Math.floor((L - 20) / 60);
    const ends = Wd >= 90 && L >= 180 ? 2 : 0;
    return side * 2 + ends;
  }

  function tablePlan(canvas, cfg) {
    const ctx = setup(canvas);
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#16110d"; ctx.fillRect(0, 0, W, H);

    const L = cfg.shape === "round" ? cfg.width : cfg.length, Wd = cfg.width;
    const s = Math.min((W * 0.62) / (L + 110), (H * 0.62) / (Wd + 110)) * 1.25;
    const cx = W / 2, cy = H / 2, w = L * s, h = Wd * s;

    // chairs
    const n = seatsFor(cfg);
    const cw = 46 * s, cd = 44 * s;
    ctx.fillStyle = "rgba(244,237,226,.06)"; ctx.strokeStyle = "rgba(244,237,226,.18)"; ctx.lineWidth = Math.max(1, s * 0.6);
    const chairAt = (x, y, ang) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.beginPath(); ctx.roundRect(-cw / 2, -cd / 2, cw, cd, 8 * s); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-cw / 2 + 4 * s, cd / 2 - 4 * s); ctx.lineTo(cw / 2 - 4 * s, cd / 2 - 4 * s); ctx.stroke();
      ctx.restore();
    };
    if (cfg.shape === "rect") {
      const ends = Wd >= 90 && L >= 180 ? 2 : 0, side = (n - ends) / 2;
      for (let i = 0; i < side; i++) {
        const x = cx - w / 2 + (w / side) * (i + 0.5);
        chairAt(x, cy - h / 2 - cd * 0.35, Math.PI); chairAt(x, cy + h / 2 + cd * 0.35, 0);
      }
      if (ends) { chairAt(cx - w / 2 - cd * 0.35, cy, Math.PI / 2); chairAt(cx + w / 2 + cd * 0.35, cy, -Math.PI / 2); }
    } else {
      const rx = w / 2 + cd * 0.35, ry = (cfg.shape === "round" ? w : h) / 2 + cd * 0.35;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        chairAt(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, a - Math.PI / 2);
      }
    }

    // shadow
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,.7)"; ctx.shadowBlur = 40 * s; ctx.shadowOffsetY = 10 * s;
    shapePath(ctx, cfg.shape, cx, cy, w, h); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();

    // top with grain
    const tex = Wood.texture(cfg.species, 1024, 512, 21, 300);
    ctx.save(); shapePath(ctx, cfg.shape, cx, cy, w, h); ctx.clip();
    const grainScale = Math.max(w / 1024, h / 512) * 1.02;
    ctx.drawImage(tex, cx - (1024 * grainScale) / 2, cy - (512 * grainScale) / 2, 1024 * grainScale, 512 * grainScale);
    // sheen + edge profile
    const sheen = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    sheen.addColorStop(0, "rgba(255,230,190,.16)"); sheen.addColorStop(0.45, "rgba(255,230,190,0)"); sheen.addColorStop(1, "rgba(0,0,0,.22)");
    ctx.fillStyle = sheen; ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    const edgeW = (cfg.edge === "chamfer" ? 3.2 : cfg.edge === "rounded" ? 2.2 : 0.8) * s;
    shapePath(ctx, cfg.shape, cx, cy, w, h);
    ctx.lineWidth = edgeW * 2; ctx.strokeStyle = cfg.edge === "chamfer" ? "rgba(255,226,180,.22)" : "rgba(0,0,0,.25)"; ctx.stroke();
    ctx.restore();
    shapePath(ctx, cfg.shape, cx, cy, w, h);
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.stroke();

    // dimension lines
    ctx.fillStyle = ctx.strokeStyle = "rgba(200,161,101,.85)";
    ctx.font = `${Math.round(11 * (W / 600) + 4)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center"; ctx.lineWidth = 1;
    const dy = cy + h / 2 + cd * 1.2;
    ctx.beginPath(); ctx.moveTo(cx - w / 2, dy); ctx.lineTo(cx + w / 2, dy);
    ctx.moveTo(cx - w / 2, dy - 5); ctx.lineTo(cx - w / 2, dy + 5); ctx.moveTo(cx + w / 2, dy - 5); ctx.lineTo(cx + w / 2, dy + 5); ctx.stroke();
    ctx.fillText(cfg.shape === "round" ? `\u00D8 ${L} cm` : `${L} cm`, cx, dy + 18 * (W / 600) + 4);
    return n;
  }

  function tableSide(canvas, cfg) {
    const ctx = setup(canvas);
    const W = canvas.width, H = canvas.height;
    const L = cfg.shape === "round" ? cfg.width : cfg.length;
    const def = { w: L, h: 76, d: cfg.width };
    const v = makeView(ctx, W, H, { w: L, h: 76, d: Math.min(cfg.width, 60) });
    studio(ctx, W, H, v.floorY);
    contactShadow(ctx, v, 0, L, 60);
    const t = Wood.texture(cfg.species, 1024, 1024, 11, 300);
    seedN = 4;
    const d = Math.min(cfg.width, 60);
    const back = (z) => ({ ...v, P: (x, y, zz = 0) => v.P(x, y, zz + z) });
    if (cfg.base === "trestle") {
      [L * 0.16, L * 0.84 - 8].forEach((x) => {
        box(ctx, back(d * 0.1), t, x - 2, 0, 12, 3, d * 0.8);
        box(ctx, v, t, x, 3, 8, 69, d * 0.8, { vertical: true });
      });
      box(ctx, back(d * 0.45), t, L * 0.16 + 8, 22, L * 0.68 - 16, 7, 4);
    } else if (cfg.base === "pedestal") {
      const cxp = L / 2;
      box(ctx, back(d * 0.2), t, cxp - 26, 0, 52, 4, d * 0.6);
      box(ctx, back(d * 0.35), t, cxp - 9, 4, 18, 68, 18, { vertical: true });
      box(ctx, back(d * 0.2), t, cxp - 22, 66, 44, 6, d * 0.6);
    } else {
      box(ctx, back(d - 7), t, 6, 0, 7, 72, 7, { vertical: true });
      box(ctx, back(d - 7), t, L - 13, 0, 7, 72, 7, { vertical: true });
      box(ctx, v, t, 10, 62, L - 20, 10, d - 6, { top: false });
      box(ctx, v, t, 6, 0, 7, 72, 7, { vertical: true });
      box(ctx, v, t, L - 13, 0, 7, 72, 7, { vertical: true });
    }
    const topT = cfg.edge === "chamfer" ? 5 : 4;
    box(ctx, v, t, 0, 72, L, topT, d);
    void def;
  }

  window.Render = { piece, tablePlan, tableSide, seatsFor, kinds: Object.keys(PIECES) };
})();
