# LUX96 Furnitures — Website

A static website for **LUX96 Furnitures**, a bespoke furniture and joinery workshop. It uses
plain HTML, CSS and JavaScript, with no build step, no frameworks and no external images.

Every visual is generated in the browser:

- **`assets/js/wood.js`** is a WebGL shader that grows figured, lit wood grain for six species
  (walnut, oak, iroko, mahogany, teak and ash). It powers the hero slab you light with the cursor,
  the timber library specimen, the swatches and the footer wordmark.
- **`assets/js/render.js`** draws studio-style renders of the catalogue pieces and the table
  configurator, using those wood textures.
- **`assets/js/alive.js`** is the motion layer: magnetic buttons, tap ripples, shimmer, word-by-word
  headings, card tilt, scroll-reactive marquee and more. It is skipped for reduced-motion users.
- **`assets/js/main.js`** handles the rest: preloader, cursor, scroll effects, horizontal
  catalogue, timber library, dovetail animation, configurator and contact forms.

All paths are relative, so the site works at a domain root (Cloudflare Pages) and under a
sub-path (GitHub Pages, `…github.io/LUX96/`).

## Page sections

The hero (live walnut slab), the studio manifesto, the growth rings, the horizontal catalogue,
services, the timber library, joinery, **Build a table** (a live configurator that sends the
spec to WhatsApp), the commission process, and contact.

## Pages

| Page | File | Notes |
|------|------|-------|
| Home | `index.html` | Hand-written. Its header, menu and footer (between the `<!-- chrome:… -->` markers) are reused by every generated page. |
| Pieces | `pieces/*.html` | One page per catalogue piece, with a live render you can switch between timbers. |
| Services | `services/*.html` | One page per service, with a live lit wood slab behind the title. |
| Ideas board | `ideas.html` | Furniture inspiration from around the web; each picture opens WhatsApp asking for one like it. Source: `tools/pages/ideas.main.html`. |
| FAQ | `faq.html` | Questions and how a commission works, with FAQ data for search engines. Source: `tools/pages/faq.main.html`. |
| Delivery | `delivery.html` | The "Where we deliver" map. Source: `tools/pages/delivery.main.html`. |
| Care guide | `care.html` | Everyday care, care by finish, Harmattan and rainy-season advice, small fixes. |
| Pricing | `pricing/index.html` | Price guide, cost breakdown, the estimator, project tray and checkout. |
| Invoice | `pricing/invoice.html` | A personalised invoice, carried entirely inside its link (`#i=…`). |
| Offline | `offline.html` | Shown by the service worker when there's no connection. |

The piece, service and care pages are **generated**. Edit `tools/content.mjs` (or the header and footer in
`index.html`), then run:

```bash
node tools/build-pages.mjs
```

That needs Node 18+ and nothing else. Commit the generated files: the site itself still has no build step.

**Run it after any CSS or JS change too.** It stamps every page (home included) with
`main.css?v=<hash>` / `file.js?v=<hash>`, so phones and the CDN always fetch the new file instead of a cached
old one. Without this, a visitor can see a new page with an old stylesheet.

## Settings (`assets/js/config.js`)

Business details and terms live in one file. Values marked **CONFIRM** are sensible defaults to check:

| Setting | Used for |
|---------|----------|
| `whatsapp`, `email` | Every WhatsApp and email link. Never displayed on the page. |
| `leadTime`, `depositPercent`, `guaranteeYears` | FAQ answers, piece specs, the guarantee seal and the footer |
| `deliveryStates`, `installStates` | The delivery map: `"all"` or a list of state ids |
| `hours` | Workshop opening days and hours (Lagos time) for the live "open / closed" clock on the opening screen |
| `greetings` | The rotating welcome on the opening screen, and the greeting at the start of WhatsApp messages (English, Yorùbá, Igbo, Hausa) |

## Pricing & invoices (`assets/js/pricing-data.js`)

Every price on the site comes from one file. **All figures are placeholders for the workshop to set.**

| Setting | What it controls |
|---------|------------------|
| `bank` | Bank name, account number and account name. **Shown only on a personalised invoice**, when someone is ready to pay. |
| `items` | Each piece's size inputs, base and timber cost, and extras |
| `timbers`, `finishes` | Price multipliers |
| `workshopState`, `delivery`, `installation` | Delivery is priced by distance from the workshop's state; installation is a percentage with a minimum |
| `quoteValidDays`, `fullPaymentDiscount`, `breakdown` | Invoice validity, the pay-in-full discount, and the "where every naira goes" chart |

How it works:

1. The customer builds a project in the estimator and fills in their details.
2. An invoice is generated in the browser with a unique number (`LUX-YYMMDD-XXXX`). It shows the bank details, the amount due now, a payment reference, a QR code and "I've paid" / "Send to workshop" WhatsApp buttons.
3. The invoice lives in its own link, so nothing is stored on a server and the workshop sees exactly what the customer sees. A checksum flags links that were edited after creation.
4. **Always check an invoice against your prices before accepting payment.**

## Features

- **Daylight theme:** a sun/moon toggle in the header. The choice is remembered.
- **Sound:** synthesized woodshop sounds (a knock, a chisel tap, a plane stroke) on interactions. Off by default; a speaker toggle turns it on. No audio files.
- **Page transitions:** a walnut-dark curtain slides between pages.
- **Offline and install:** `manifest.webmanifest` and `sw.js` make the site installable ("Add to home screen") and usable offline once visited. Files are always fetched fresh when online, so deploys show up immediately with nothing to bump.
- **Delivery map:** the Nigeria state outlines come from [svg-maps](https://github.com/VictorCazanave/svg-maps) (based on MapSVG), CC BY 4.0. The credit is shown under the map.
- **FAQ and structured data:** FAQPage, Product, Service, Article and Breadcrumb JSON-LD for search engines.

## Preview locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

**Cloudflare Pages:** go to Workers & Pages → Create → Pages → Connect to Git and pick this
repo. Set the framework preset to **None**, leave the build command **empty**, and set the
output directory to **`/`**. `_headers` adds security and caching headers.

**GitHub Pages:** go to Settings → Pages → Deploy from branch → `main` / root.

## Videos

Short clips live in `assets/video/`. Each one has three files: `name.mp4` (H.264), `name.webm`
(fallback) and `name.jpg` (the still shown before it plays). Use them anywhere as:

```html
<video class="reel-video" muted loop playsinline preload="none"
       poster="assets/video/name.jpg" data-src="assets/video/name"></video>
```

`common.js` loads a clip only when it nears the screen, plays it muted while it's visible, and
pauses it otherwise. Visitors with reduced motion or data saver only see the still.
Service-page films are listed in `films` in `tools/content.mjs`.

To add a clip, compress it to 540×960 with no sound, for example:

```sh
ffmpeg -i in.mp4 -an -vf scale=540:960 -c:v libx264 -crf 28 -preset slow -movflags +faststart name.mp4
ffmpeg -i name.mp4 -c:v libvpx-vp9 -b:v 0 -crf 40 name.webm
ffmpeg -i name.mp4 -frames:v 1 name.jpg
```

Captions say where a clip comes from: "Concept" for the AI-generated riverstone clip, and a film credit for
clips by other makers. Replace these with the workshop's own footage when you have it.

## Before launch: replace the placeholders

| What | Where |
|------|-------|
| WhatsApp number (set) and email | `CONTACT` at the top of `assets/js/main.js`. WhatsApp links open with a ready-to-send introduction (`INTRO`). |
| Address, hours | `#contact` section in `index.html` |
| Instagram / Facebook links | `.socials` in `index.html` |
| JSON-LD business info | `<script type="application/ld+json">` in `index.html` |

Contact details are **never displayed** on the site. Visitors reach the business through
WhatsApp and email buttons only, and the number and address live solely inside those links.

## Adding real photos

Each catalogue item renders a piece by default. To show a real photo instead, add it to
`assets/img/work/` (about 1200×1000, `.jpg` or `.webp`) and point the canvas at it:

```html
<canvas data-piece="table" data-species="walnut" data-photo="assets/img/work/dining-table.jpg"></canvas>
```

The photo replaces the render once it loads. If the file is missing, the render stays.
To add a new catalogue item, copy an `<article class="piece">` block. `data-piece` can be
`table`, `sideboard`, `wardrobe`, `bed`, `chair`, `shelf`, `desk` or `door`, and
`data-species` can be any of the six timbers.

## Browser support

WebGL is used where available. Without it, the slabs fall back to a CSS gradient and the
textures to a simple 2D canvas drawing. If a visitor's system is set to reduce motion, the
animations are switched off.
