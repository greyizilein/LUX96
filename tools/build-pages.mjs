// Generates the piece pages, service pages and the care guide.
// The header, menu and footer are copied from index.html (between the
// <!-- chrome:… --> markers), so there is one source of truth.
//
//   node tools/build-pages.mjs
//
// No dependencies; the output is plain HTML committed to the repo.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pieces, services, films } from "./content.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const index = readFileSync(join(ROOT, "index.html"), "utf8");
const between = (a, b) => {
  const i = index.indexOf(a), j = index.indexOf(b);
  if (i < 0 || j < 0) throw new Error(`markers not found: ${a}`);
  return index.slice(i + a.length, j);
};
const TOP = between("<!-- chrome:top (shared with generated pages by tools/build-pages.mjs) -->", "<!-- /chrome:top -->");
const FOOTER = between("<!-- chrome:footer -->", "<!-- /chrome:footer -->");

// Rewrite home-page-relative links for a page at a given depth.
function chrome(html, root) {
  return html
    .replace(/class="nav-logo" href="#top"/g, `class="nav-logo" href="${root}"`)
    .replace(/href="#(?!top"|main")([^"]*)"/g, `href="${root}#$1"`)
    .replace(/(href|src)="(assets\/|services\/|pieces\/|pricing\/|care\.html)/g, `$1="${root}$2`);
}

const esc = (s) => s.replace(/&(?!amp;|lt;|gt;|quot;)/g, "&amp;");
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&");

const DEFAULT_SCRIPTS = ["config", "wood", "render", "common", "page", "alive"];
function page({ root, title, description, bodyClass, main, ld = [], scripts = DEFAULT_SCRIPTS, robots = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#120e0b">${robots ? `\n  <meta name="robots" content="${robots}">` : ""}
  <meta name="lux-root" content="${root}">
  <link rel="icon" href="${root}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="${root}manifest.webmanifest">
  <link rel="apple-touch-icon" href="${root}assets/img/icon-192.png">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(description)}">
  <script>document.documentElement.classList.add("js");try{if(localStorage.getItem("lux-theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${root}assets/css/main.css">
${ld.map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
</head>
<body class="sub ${bodyClass}">
  <a class="skip" href="#main">Skip to content</a>
${chrome(TOP, root)}
  <main id="main">
${main}
  </main>
${chrome(FOOTER, root)}
${scripts.map((n) => `  <script src="${root}assets/${n.startsWith("vendor/") ? n : "js/" + n}.js"></script>`).join("\n")}
</body>
</html>
`;
}

// A swipeable row of muted, looping clips (played by common.js "Film reels")
const filmsSection = (s, root) => `
    <section class="resin s-films">
      <div class="wrap resin-inner">
        <div class="resin-copy">
          <p class="label sec-label">On film</p>
          <h2 class="display">From the <em>bench</em></h2>
          <p class="resin-sub">Timber, stone and clear resin: the kind of piece we can draw and build for you.</p>
        </div>
        <div class="reels" tabindex="0" aria-label="Pieces on film — swipe for more">${s.films.map((k) => { const f = films[k]; return `
          <figure class="reel">
            <video class="reel-video" muted loop playsinline preload="none" poster="${root}assets/video/${k}.jpg" data-src="${root}assets/video/${k}" aria-label="${f.aria}"></video>
            <figcaption><span class="label reel-tag"><i class="rec-dot" aria-hidden="true"></i>${f.tag}</span><b>${f.name}</b><span>${f.sub}</span></figcaption>
          </figure>`; }).join("")}
        </div>
      </div>
    </section>

`;

const crumbs = (root, items) =>
  `<nav class="crumbs label" aria-label="Breadcrumb"><a href="${root}">Home</a>${items.map(([t, h]) => h ? ` <span>/</span> <a href="${h}">${t}</a>` : ` <span>/</span> <b>${t}</b>`).join("")}</nav>`;
const crumbLd = (items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((name, i) => ({ "@type": "ListItem", position: i + 1, name })),
});
const TIMBERS = ["walnut", "oak", "iroko", "mahogany", "teak", "ash"];
const TIMBER_NAMES = { walnut: "Walnut", oak: "Oak", iroko: "Iroko", mahogany: "Mahogany", teak: "Teak", ash: "Ash" };
const PRICE_TYPE = { table: "table", sideboard: "sideboard", wardrobe: "wardrobe", bed: "bed", chair: "lounge", shelf: "shelf", desk: "desk", door: "door" };
const bySlug = Object.fromEntries(pieces.map((p) => [p.slug, p]));
const card = (p, root) => `
          <a class="mini" href="${root}pieces/${p.slug}.html" data-cursor="View">
            <span class="mini-media"><canvas data-piece="${p.kind}" data-species="${p.species}"></canvas></span>
            <span class="label">No. ${p.no}</span><b>${p.name}</b>
          </a>`;

/* ---------------- piece pages ---------------- */
mkdirSync(join(ROOT, "pieces"), { recursive: true });
pieces.forEach((p, i) => {
  const root = "../";
  const prev = pieces[(i - 1 + pieces.length) % pieces.length], next = pieces[(i + 1) % pieces.length];
  const msg = `I'm interested in the ${p.name} (No. ${p.no}) from your website. Could you send me a quote and lead time?`;
  const main = `
    <section class="p-hero">
      <div class="wrap p-hero-grid">
        <div class="p-copy">
          ${crumbs(root, [["Catalogue", `${root}#work`], [p.name]])}
          <p class="label sec-label">No. ${p.no} — Catalogue</p>
          <h1 class="display p-title">${p.title}</h1>
          <p class="p-lede">${p.lede}</p>
          <div class="p-actions btn-row">
            <a class="btn btn-brass c-wa" data-msg="${esc(msg)}" href="https://wa.me/${"2348167993933"}" target="_blank" rel="noopener" data-cursor="Ask">Enquire<span class="lbl-x"> on WhatsApp</span></a>
            <a class="btn btn-line" href="${root}pricing/?type=${PRICE_TYPE[p.kind]}&species=${p.species}" data-cursor="Price">Get a price</a>
          </div>
        </div>
        <div class="p-media">
          <canvas class="p-canvas" data-piece="${p.kind}" data-species="${p.species}" role="img" aria-label="${p.name} in ${TIMBER_NAMES[p.species]}"></canvas>
          <div class="p-swatches" role="group" aria-label="Preview in another timber">
            ${TIMBERS.map((t) => `<button type="button" data-species="${t}" aria-pressed="${t === p.species}">${TIMBER_NAMES[t]}</button>`).join("")}
          </div>
        </div>
      </div>
    </section>

    <section class="p-specs">
      <dl class="wrap specs">
        <div><dt class="label">Timber</dt><dd class="p-timber">${TIMBER_NAMES[p.species]}</dd></div>
        <div><dt class="label">Size</dt><dd>${p.size}</dd></div>
        <div><dt class="label">Details</dt><dd>${p.seats}</dd></div>
        <div><dt class="label">Finish</dt><dd>${p.finish}</dd></div>
        <div><dt class="label">Lead time</dt><dd data-leadtime>4–8 weeks</dd></div>
        <div><dt class="label">Guarantee</dt><dd><span data-guarantee>10</span> years on joinery</dd></div>
      </dl>
    </section>

    <section class="p-body">
      <div class="wrap p-body-grid">
        <div class="p-about">
          <p class="label sec-label">About this piece</p>
          ${p.about.map((t) => `<p>${t}</p>`).join("\n          ")}
        </div>
        <div class="p-options">
          <p class="label sec-label">Make it yours</p>
          <ul>${p.options.map((o) => `<li>${o}</li>`).join("")}</ul>
          <p class="p-note">Sizes, timber and finish are all made to order. Delivery across our <a href="${root}#delivery">delivery area</a>.</p>
        </div>
      </div>
    </section>

    <section class="p-more">
      <div class="wrap">
        <p class="label sec-label">More from the catalogue</p>
        <div class="minis">${card(prev, root)}${card(next, root)}
          <a class="mini mini-cta" href="${root}#contact" data-cursor="Talk"><b>Something<br><em>not on the list?</em></b><span class="label">Tell us about it →</span></a>
        </div>
      </div>
    </section>`;
  const ld = [
    { "@context": "https://schema.org", "@type": "Product", name: `${p.name} — LUX96 Furnitures`, description: p.lede,
      brand: { "@type": "Brand", name: "LUX96 Furnitures" }, material: TIMBER_NAMES[p.species], category: "Furniture" },
    crumbLd(["Home", "Catalogue", p.name]),
  ];
  writeFileSync(join(ROOT, "pieces", `${p.slug}.html`), page({
    root, title: `${p.name} — Made to order | LUX96 Furnitures`,
    description: `${p.lede} Made to order in solid ${TIMBER_NAMES[p.species].toLowerCase()} or the timber of your choice by LUX96 Furnitures.`,
    bodyClass: "piece-page", main, ld,
  }));
});

/* ---------------- service pages ---------------- */
mkdirSync(join(ROOT, "services"), { recursive: true });
services.forEach((s, i) => {
  const root = "../";
  const msg = `I'd like to talk about ${strip(s.name).toLowerCase()}. Here's what I have in mind: `;
  const others = services.filter((o) => o !== s);
  const main = `
    <section class="s-hero">
      <canvas class="s-slab" data-species="${s.species}" aria-hidden="true"></canvas>
      <div class="s-shade" aria-hidden="true"></div>
      <div class="wrap s-hero-inner">
        ${crumbs(root, [["Services", `${root}#services`], [strip(s.name)]])}
        <p class="label sec-label">Service ${s.no}</p>
        <h1 class="display s-title">${s.title}</h1>
        <p class="s-lede">${s.lede}</p>
        <div class="p-actions btn-row">
          <a class="btn btn-brass c-wa" data-msg="${esc(msg)}" href="https://wa.me/2348167993933" target="_blank" rel="noopener" data-cursor="Ask"><span class="lbl-x">Start on </span>WhatsApp</a>
          <a class="btn btn-line" href="${root}pricing/" data-cursor="Price">See pricing</a>
        </div>
      </div>
    </section>

    <section class="s-intro">
      <div class="wrap s-intro-grid">
        <p class="s-big">${s.intro}</p>
        <div>
          <p class="label sec-label">What we make</p>
          <ul class="s-makes">${s.makes.map((m) => `<li>${m}</li>`).join("")}</ul>
        </div>
      </div>
    </section>

${s.films ? filmsSection(s, root) : ""}    <section class="s-steps">
      <div class="wrap">
        <p class="label sec-label">How it works</p>
        <ol class="steps">${s.steps.map(([h, t], k) => `<li><span class="step-n">${["I", "II", "III"][k]}</span><h3>${h}</h3><p>${t}</p></li>`).join("")}</ol>
      </div>
    </section>

    <section class="p-more">
      <div class="wrap">
        <p class="label sec-label">Related pieces</p>
        <div class="minis">${s.related.map((sl) => card(bySlug[sl], root)).join("")}</div>
      </div>
    </section>

    <section class="s-others">
      <div class="wrap">
        <p class="label sec-label">Other services</p>
        <ul class="s-other-list">${others.map((o) => `<li><a href="${o.slug}.html" data-cursor="Open"><span class="svc-n">${o.no}</span>${o.title}</a></li>`).join("")}</ul>
      </div>
    </section>`;
  const ld = [
    { "@context": "https://schema.org", "@type": "Service", name: strip(s.name), description: s.lede,
      provider: { "@type": "FurnitureStore", name: "LUX96 Furnitures" }, areaServed: "Nigeria" },
    crumbLd(["Home", "Services", strip(s.name)]),
  ];
  writeFileSync(join(ROOT, "services", `${s.slug}.html`), page({
    root, title: `${strip(s.name)} — LUX96 Furnitures`,
    description: `${s.lede} ${s.intro.split(". ")[0]}.`, bodyClass: "service-page has-hero", main, ld,
  }));
});

/* ---------------- care guide ---------------- */
{
  const root = "./";
  const sections = [
    ["everyday", "Everyday care", [
      ["Dust often", "Use a soft, dry microfibre cloth, wiping along the grain. Dust is abrasive; regular dusting keeps the surface clear and bright."],
      ["Wipe, don't wash", "For marks, use a cloth barely damp with water and a drop of mild soap, then dry straight away. Never soak wood or leave water standing."],
      ["Use coasters & mats", "Hot dishes, cold glasses and wet plant pots are the most common causes of rings and marks. A coaster prevents all three."],
      ["Lift, don't drag", "Lift furniture when moving it. Dragging strains the joints and scratches floors."],
    ]],
    ["finish", "Care by finish", [
      ["Oiled & hard-wax oiled", "These finishes soak into the wood. Refresh once or twice a year: clean, let dry, apply a thin coat of the same oil with a lint-free cloth, wipe off the excess after 15 minutes. Small scratches can be lightly sanded and re-oiled on the spot."],
      ["Lacquered", "Lacquer forms a hard film on top. Clean with a damp cloth only — no oils, polishes or silicone sprays, which leave a greasy haze. Chips or deep scratches should be repaired by us."],
      ["Painted", "Wipe with a soft damp cloth. Avoid abrasive pads and strong cleaners; touch-up paint can be supplied with your piece."],
      ["Outdoor teak & iroko", "Left alone, these timbers weather to a soft silver-grey without losing strength. To keep the golden colour, clean and apply a teak oil each season."],
    ]],
    ["climate", "Sun, heat & seasons", [
      ["Harmattan & air-conditioning", "Very dry air makes timber shrink. Keep pieces away from AC vents, fans blowing directly on them and heaters; a bowl of water or a humidifier in very dry rooms helps."],
      ["Rainy season", "Humid air makes wood swell, so drawers and doors can feel tighter for a few weeks — this is normal. Keep rooms ventilated and wipe up any damp promptly."],
      ["Direct sunlight", "Strong sun changes the colour of every timber over time. Use curtains or blinds, and rotate lamps, vases and ornaments so the surface ages evenly."],
      ["Settling in", "Solid wood moves with the seasons. Our joinery is designed to allow for this; a hairline gap that opens and closes with the weather is a sign of real timber, not a fault."],
    ]],
    ["fixes", "Small fixes", [
      ["White rings", "Usually trapped moisture. On oiled pieces, a little oil rubbed in often clears it. On lacquer, leave it to us."],
      ["Light scratches", "On oiled finishes, rub very lightly along the grain with fine sandpaper (240+), then re-oil. On lacquer, a matching wax filler stick will hide most marks."],
      ["Dents", "Small dents in oiled solid wood can often be lifted with a damp cloth and a warm iron held briefly over the dent. Ask us first if you are unsure."],
      ["Loose handles & hinges", "Tighten gently with the right screwdriver — over-tightening strips the thread in the wood."],
    ]],
  ];
  const main = `
    <section class="c-hero">
      <div class="wrap">
        ${crumbs(root, [["Care guide"]])}
        <p class="label sec-label">Aftercare</p>
        <h1 class="display c-title">Caring for<br>solid <em>wood</em>.</h1>
        <p class="c-lede">Well-made furniture gets better with age. A few simple habits keep it that way — here is everything we tell our clients when we deliver a piece.</p>
        <nav class="c-toc" aria-label="On this page">${sections.map(([id, h]) => `<a href="#${id}">${h}</a>`).join("")}</nav>
      </div>
    </section>
${sections.map(([id, h, items], k) => `
    <section class="c-sec" id="${id}">
      <div class="wrap c-sec-grid">
        <div><p class="label">0${k + 1}</p><h2 class="display c-h">${h}</h2></div>
        <div class="c-items">${items.map(([t, d]) => `
          <article class="c-item"><h3>${t}</h3><p>${d}</p></article>`).join("")}
        </div>
      </div>
    </section>`).join("")}

    <section class="c-help">
      <div class="wrap c-help-inner">
        <h2 class="display">Something <em>not right</em>?</h2>
        <p>If a joint we cut ever fails in normal use, it is covered by our <b><span data-guarantee>10</span>-year joinery guarantee</b>. For everything else — refinishing, repairs, a piece that needs a refresh — send us a photo.</p>
        <a class="btn btn-brass c-wa" data-msg="I need some help caring for a piece of furniture: " href="https://wa.me/2348167993933" target="_blank" rel="noopener" data-cursor="Ask">Send us a photo</a>
      </div>
    </section>`;
  const ld = [
    { "@context": "https://schema.org", "@type": "Article", headline: "Caring for solid wood furniture",
      description: "How to look after oiled, lacquered and painted wood furniture, through dry and rainy seasons.",
      author: { "@type": "Organization", name: "LUX96 Furnitures" } },
    crumbLd(["Home", "Care guide"]),
  ];
  writeFileSync(join(ROOT, "care.html"), page({
    root, title: "Caring for solid wood furniture — LUX96 Furnitures",
    description: "How to look after oiled, lacquered and painted wood furniture: everyday care, Harmattan and rainy-season tips, sun, and simple fixes for rings and scratches.",
    bodyClass: "care-page", main, ld,
  }));
}

/* ---------------- pricing & invoice ---------------- */
{
  const root = "../";
  mkdirSync(join(ROOT, "pricing"), { recursive: true });
  const frag = (name) => readFileSync(join(ROOT, "tools", "pages", name), "utf8").replace(/\{\{ROOT\}\}/g, root);
  writeFileSync(join(ROOT, "pricing", "index.html"), page({
    root, title: "Pricing & estimator — LUX96 Furnitures",
    description: "Starting prices for bespoke solid-wood furniture, a live price estimator and instant personalised invoices from LUX96 Furnitures.",
    bodyClass: "pricing-page",
    main: frag("pricing.main.html").replace("{{CRUMBS}}", crumbs(root, [["Pricing"]])),
    ld: [crumbLd(["Home", "Pricing"])],
    scripts: ["config", "wood", "render", "common", "nigeria-map", "pricing-data", "pricing", "pricing-page", "page", "alive"],
  }));
  writeFileSync(join(ROOT, "pricing", "invoice.html"), page({
    root, title: "Your invoice — LUX96 Furnitures", robots: "noindex",
    description: "Your personalised LUX96 Furnitures invoice.",
    bodyClass: "invoice-page",
    main: frag("invoice.main.html").replace("{{CRUMBS}}", crumbs(root, [["Pricing", "./"], ["Invoice"]])),
    scripts: ["config", "wood", "common", "pricing-data", "pricing", "vendor/qrcode", "invoice", "alive"],
  }));
}

console.log(`Built ${pieces.length} piece pages, ${services.length} service pages, care.html and the pricing pages`);
