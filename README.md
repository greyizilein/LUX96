# LUX96 Furnitures — Website

Static marketing site for **LUX96 Furnitures**, a woodworking and custom furniture business.
Plain HTML, CSS and JavaScript — no build step, no dependencies.

## Structure

```
index.html            Home page (hero, about, services, portfolio, process, materials, contact)
404.html              Not-found page (Cloudflare Pages serves it automatically)
_headers              Security & caching headers for Cloudflare Pages
robots.txt, sitemap.xml
assets/css/styles.css All styles — colours/fonts are CSS variables at the top
assets/js/main.js     Menu, scroll effects, gallery filter, quote form
assets/img/           Logo, favicon and placeholder furniture illustrations
```

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on Cloudflare Pages

1. In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Select this repository and the production branch (e.g. `main`).
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
4. Save and deploy. Add a custom domain under **Custom domains** once it's live.

Alternatively, with Wrangler: `npx wrangler pages deploy . --project-name lux96`.

## Before going live — replace placeholders

| What | Where |
|------|-------|
| Phone number / WhatsApp | `index.html` (contact section, `tel:` and `wa.me` links, JSON-LD) and `CONTACT.whatsapp` in `assets/js/main.js` |
| Email address | `index.html` (contact section, JSON-LD) and `CONTACT.email` in `assets/js/main.js` |
| Workshop address & hours | `index.html` contact section |
| Instagram / Facebook links | `index.html` `.socials` |
| Domain (`lux96furnitures.com`) | `index.html` (`canonical`, `og:*`, JSON-LD), `robots.txt`, `sitemap.xml` |
| Portfolio images | Swap the SVGs in `assets/img/` for real photos (e.g. `.jpg`/`.webp`, ~1200×900, 4:3) and update the `src`/`alt`/captions in the `#work` gallery |

### How the quote form works

There's no server: the form builds a pre-filled message and opens **WhatsApp** (`wa.me`) or the
visitor's **email app** (`mailto:`). If you later want submissions delivered directly, point the form
at a service such as Formspree, or add a Cloudflare Pages Function.

### Adding a portfolio item

Copy a `<li class="tile">` block in the `#work` section. Set `data-cat` to one of
`living`, `bedroom`, `kitchen`, `office` so the filter buttons pick it up.
