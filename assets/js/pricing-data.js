/* ==========================================================
   LUX96 — pricing model
   All prices are in Naira. Every figure here is a PLACEHOLDER
   for the workshop to set — the estimator, price guide and
   invoices all read from this file, so change them in one place.
   ========================================================== */
window.LUX_PRICING = {
  currency: "₦",

  // Payment details — shown ONLY on a personalised invoice, when a customer is ready to pay.
  bank: {
    name: "OPay",
    accountNumber: "8167993933",
    accountName: "DAVID JONAH",         // name on the account, shown so payers can check it matches
  },

  quoteValidDays: 14,                   // CONFIRM: how long an estimate/invoice stays valid
  fullPaymentDiscount: 3,               // CONFIRM: % off for paying everything up front (0 to switch off)
  estimateSpread: [0.92, 1.12],         // the "from–to" range shown around the estimate

  // Delivery: a flat handling fee + a rate per road-km from the workshop's state.
  workshopState: "lagos",               // CONFIRM: state id of the workshop (see config.js for ids)
  delivery: { base: 20000, perKm: 180, roadFactor: 1.3, freeWithinKm: 0 },  // CONFIRM
  installation: { percent: 6, minimum: 30000 },                            // CONFIRM: optional on-site installation

  // Timber multipliers apply to the "wood" part of each price.
  timbers: {                            // CONFIRM
    iroko:    { label: "Iroko",    mult: 1.0 },
    mahogany: { label: "Mahogany", mult: 1.12 },
    teak:     { label: "Teak",     mult: 1.35 },
    ash:      { label: "Ash",      mult: 1.55 },
    oak:      { label: "Oak",      mult: 1.65 },
    walnut:   { label: "Walnut",   mult: 2.1 },
  },

  finishes: {                           // CONFIRM: multiplier on the whole piece
    oil:     { label: "Natural oil",     mult: 1.0 },
    hardwax: { label: "Hard-wax oil",    mult: 1.04 },
    lacquer: { label: "Lacquer",         mult: 1.07 },
    stain:   { label: "Stain + lacquer", mult: 1.1 },
    paint:   { label: "Painted",         mult: 1.06 },
  },

  // Where the money goes (shown as a breakdown on the pricing page). Should add up to 100.
  breakdown: [                          // CONFIRM
    { key: "timber",   label: "Timber",            pct: 42, note: "Kiln-dried boards, chosen and matched by hand." },
    { key: "labour",   label: "Joinery & labour",  pct: 31, note: "Skilled hours at the bench: cutting, joining, fitting." },
    { key: "finish",   label: "Finishing",         pct: 10, note: "Sanding, sealing and the final coats." },
    { key: "hardware", label: "Hardware",          pct: 7,  note: "Hinges, runners, pulls, fixings." },
    { key: "workshop", label: "Workshop & tools",  pct: 10, note: "Machines, blades, power, rent." },
  ],

  /* ---------- Pieces ----------
     Each piece: base (fixed, not affected by timber) + wood (scaled by timber),
     size inputs and add-ons. `price(v)` returns { base, wood } in Naira before
     timber/finish multipliers; add-ons are added on top. */
  items: {
    table: {
      label: "Dining table", render: "table", from: { length: 180, width: 90 },
      inputs: [
        { key: "length", label: "Length", unit: "cm", min: 120, max: 320, step: 10, value: 200 },
        { key: "width",  label: "Width",  unit: "cm", min: 75,  max: 120, step: 5,  value: 95 },
      ],
      price: (v) => ({ base: 160000, wood: (v.length / 100) * (v.width / 100) * 330000 }),
      addons: [
        { key: "trestle", label: "Trestle or pedestal base", add: 90000 },
        { key: "extend",  label: "Extending leaf",           add: 180000 },
      ],
      detail: (v) => `${v.length} × ${v.width} cm · seats about ${Math.max(4, Math.floor((v.length - 20) / 60) * 2 + (v.width >= 90 && v.length >= 180 ? 2 : 0))}`,
    },
    chairs: {
      label: "Dining chairs", render: "chair", from: { qty: 1 },
      inputs: [{ key: "qty", label: "How many", unit: "", min: 1, max: 16, step: 1, value: 6 }],
      price: (v) => ({ base: 22000 * v.qty, wood: 68000 * v.qty }),
      addons: [{ key: "uphol", label: "Upholstered seats", add: 25000, perQty: true }, { key: "arms", label: "Carver chairs with arms (×2)", add: 70000 }],
      detail: (v) => `${v.qty} chair${v.qty > 1 ? "s" : ""}`,
    },
    lounge: {
      label: "Lounge chair", render: "chair", from: { qty: 1 },
      inputs: [{ key: "qty", label: "How many", unit: "", min: 1, max: 8, step: 1, value: 1 }],
      price: (v) => ({ base: 95000 * v.qty, wood: 210000 * v.qty }),
      addons: [{ key: "leather", label: "Leather cushions", add: 90000, perQty: true }, { key: "stool", label: "Matching footstool", add: 120000 }],
      detail: (v) => `${v.qty} lounge chair${v.qty > 1 ? "s" : ""}`,
    },
    sideboard: {
      label: "Sideboard", render: "sideboard", from: { width: 150 },
      inputs: [{ key: "width", label: "Width", unit: "cm", min: 90, max: 260, step: 10, value: 180 }],
      price: (v) => ({ base: 120000, wood: (v.width / 100) * 420000 }),
      addons: [{ key: "drawers", label: "Row of drawers", add: 95000 }, { key: "brass", label: "Solid brass pulls", add: 40000 }],
      detail: (v) => `${v.width} cm wide`,
    },
    wardrobe: {
      label: "Wardrobe", render: "wardrobe", from: { width: 120 },
      inputs: [{ key: "width", label: "Width", unit: "cm", min: 80, max: 400, step: 10, value: 180 }],
      price: (v) => ({ base: 150000, wood: (v.width / 100) * 520000 }),
      addons: [
        { key: "fitted",  label: "Fitted floor-to-ceiling", add: 0, pct: 15 },
        { key: "mirror",  label: "Mirror door",             add: 55000 },
        { key: "drawers", label: "Internal drawer stack",   add: 85000 },
      ],
      detail: (v) => `${v.width} cm wide`,
    },
    bed: {
      label: "Bed frame", render: "bed", from: { size: 0 },
      inputs: [{ key: "size", label: "Size", options: ["Double (4.5ft)", "Queen (5ft)", "King (6ft)", "Super king (7ft)"], value: 2 }],
      price: (v) => ({ base: 140000, wood: [300000, 340000, 390000, 450000][v.size] }),
      addons: [{ key: "uphol", label: "Upholstered headboard", add: 75000 }, { key: "drawers", label: "Under-bed drawers (pair)", add: 120000 }],
      detail: (v) => ["Double", "Queen", "King", "Super king"][v.size],
    },
    desk: {
      label: "Desk", render: "desk", from: { width: 120 },
      inputs: [{ key: "width", label: "Width", unit: "cm", min: 100, max: 220, step: 10, value: 150 }],
      price: (v) => ({ base: 110000, wood: (v.width / 100) * 260000 }),
      addons: [{ key: "pedestal", label: "Three-drawer pedestal", add: 110000 }, { key: "leather", label: "Leather writing inlay", add: 65000 }],
      detail: (v) => `${v.width} cm wide`,
    },
    shelf: {
      label: "Shelving", render: "shelf", from: { width: 90, height: 180 },
      inputs: [
        { key: "width",  label: "Width",  unit: "cm", min: 60,  max: 400, step: 10, value: 120 },
        { key: "height", label: "Height", unit: "cm", min: 90,  max: 280, step: 10, value: 200 },
      ],
      price: (v) => ({ base: 60000, wood: (v.width / 100) * (v.height / 100) * 190000 }),
      addons: [{ key: "doors", label: "Cupboards below", add: 140000 }, { key: "lights", label: "Integrated lights", add: 60000 }],
      detail: (v) => `${v.width} × ${v.height} cm`,
    },
    door: {
      label: "Doors", render: "door", from: { qty: 1 },
      inputs: [{ key: "qty", label: "How many", unit: "", min: 1, max: 20, step: 1, value: 1 }],
      price: (v) => ({ base: 60000 * v.qty, wood: 210000 * v.qty }),
      addons: [{ key: "frame", label: "Frames & architraves", add: 85000, perQty: true }, { key: "glass", label: "Glazed panels", add: 60000, perQty: true }],
      detail: (v) => `${v.qty} door${v.qty > 1 ? "s" : ""}, made to your openings`,
    },
    kitchen: {
      label: "Kitchen", render: "sideboard", from: { metres: 3 },
      inputs: [{ key: "metres", label: "Run length", unit: "m", min: 2, max: 12, step: 0.5, value: 4 }],
      price: (v) => ({ base: 250000, wood: v.metres * 380000 }),
      addons: [{ key: "wall", label: "Wall cabinets", add: 0, perUnit: { key: "metres", rate: 210000 } }, { key: "island", label: "Kitchen island", add: 650000 }],
      detail: (v) => `${v.metres} m of cabinets`,
    },
  },
};
