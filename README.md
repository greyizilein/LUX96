# LUX96 Furnitures — Website

A static website for **LUX96 Furnitures**, a bespoke furniture and joinery workshop. It uses
plain HTML, CSS and JavaScript, with no build step, no frameworks and no external images.

Every visual is generated in the browser:

- **`assets/js/wood.js`** is a WebGL shader that grows figured, lit wood grain for six species
  (walnut, oak, iroko, mahogany, teak and ash). It powers the hero slab you light with the cursor,
  the timber library specimen, the swatches and the footer wordmark.
- **`assets/js/render.js`** draws studio-style renders of the catalogue pieces and the table
  configurator, using those wood textures.
- **`assets/js/main.js`** handles the rest: preloader, cursor, scroll effects, horizontal
  catalogue, timber library, dovetail animation, configurator and contact forms.

All paths are relative, so the site works at a domain root (Cloudflare Pages) and under a
sub-path (GitHub Pages, `…github.io/LUX96/`).

## Page sections

The hero (live walnut slab), the studio manifesto, the growth rings, the horizontal catalogue,
services, the timber library, joinery, **Build a table** (a live configurator that sends the
spec to WhatsApp), the commission process, and contact.

## Preview locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy

**Cloudflare Pages:** go to Workers & Pages → Create → Pages → Connect to Git and pick this
repo. Set the framework preset to **None**, leave the build command **empty**, and set the
output directory to **`/`**. `_headers` adds security and caching headers.

**GitHub Pages:** go to Settings → Pages → Deploy from branch → `main` / root.

## Before launch: replace the placeholders

| What | Where |
|------|-------|
| WhatsApp number and email | `CONTACT` at the top of `assets/js/main.js`. Links on the page update automatically. |
| Phone number shown on the page, address, hours | `#contact` section in `index.html` |
| Instagram / Facebook links | `.socials` in `index.html` |
| JSON-LD business info | `<script type="application/ld+json">` in `index.html` |

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
