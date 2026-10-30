# RG Secure Solutions — website

A single-page website: **`index.html` is the whole site** (CSS and JavaScript are inside it).
There is no build step and no server code. Upload the folder to any static host and it works.

```
index.html              the site
assets/                 logo variants, favicons, og-image, service photos, catalogue (PDF + page images)
site.webmanifest, robots.txt, sitemap.xml
tools/                  scripts that (re)generate images and icons — only needed if you change source images
tests/                  automated tests, screenshots and recordings
README.md, BUILD_NOTES.md
```

---

## 1. Fill in the placeholders first

Open `index.html`, find `const CONFIG = {` near the top of the `<script type="module">` block.

| Field | What to put | What happens while it is empty |
|---|---|---|
| `city` | e.g. `"Casablanca"` | City is hidden in the hero, contact cards, footer and JSON-LD; **no Google Map** is offered |
| `hours` | e.g. `"Lun–Sam, 9 h – 19 h"` | The "Horaires" card is hidden |
| `social.facebook` | full page URL, e.g. `"https://www.facebook.com/..."` | The Facebook card and footer icon are hidden |
| `siteUrl` | the final address, e.g. `"https://www.rgsecuresolutions.ma/"` | The current address is used for share links and JSON-LD |
| `showPrices` | `true` to show "à partir de X MAD" | "Prix sur devis" everywhere |

Also replace **`https://www.example.com/`** with your real address in:
- the `<head>` of `index.html` (canonical, `hreflang`, `og:url`, `og:image`, `twitter:image`),
- `sitemap.xml` and `robots.txt`.

Legal texts: search `legal:` in `index.html` (French) and the second `legal:` (English) and replace the
`[à compléter]` / `[to be completed]` parts (company details, host, warranty and payment terms).

## 2. Editing text

All visible text lives in two dictionaries in `index.html`:

- `const FR = { … }` — French, the source text (catalogue wording, Appendix A verbatim);
- `const EN = { … }` — English. **Every key in FR must exist in EN** (the test suite fails otherwise).
  If a key is missing in EN, the site shows the French text and logs a warning on `localhost`.

Keys are grouped by section: `hero`, `svcSec`, `sheet`, `svc` (the 13 services), `process`, `clients`,
`eq` / `eqi` / `cat` (equipment), `viewer`, `insp`, `quote`, `wa` (WhatsApp message templates), `why`,
`faq`, `contact`, `footer`, `legal`, `settings`, `search`, `err`, `print`.

Tips: keep the quotes (`"…"`); an apostrophe inside French text is fine (`"l'installation"`).
`{n}`, `{name}` etc. are placeholders filled in by the site — keep them.

## 3. Services

- **Text** of each service: `FR.svc["<slug>"]` and `EN.svc["<slug>"]` (title, tagline, 5 features,
  présentation, 10 solutions, 10 prestations, 6 avantages, engagement text + 6 badges).
- **Structure** (catalogue page, group, equipment drawing, feature icons, client types): `SERVICE_META`.
- **Mega-menu groups**: `GROUPS`. **Packs per client type**: `CLIENTS` (+ `clients.types` texts).
- **Cover photo**: `assets/services/<slug>.webp` (1200 px wide) and `<slug>-600.webp` (600 px).
  They are cropped from the catalogue pages by `tools/build-assets.mjs` (see `CROPS`).
  To use your own photo instead, export the two WebP files with the same names (4:3 ratio works best).
- **Autres solutions** (UPS & énergie, matériel informatique, logiciel cabinet médical): `OTHERS` +
  `svcSec.others` texts. They only open a quote request.

## 4. Equipment catalogue (91 equipment types)

Each row of `EQ_ROWS` is one equipment type:

```js
["RG-CAM-01", "cameras", "cam-ip", "dome", ALL, ["Hikvision", "Dahua"], "camera ip dome cctv videosurveillance"],
//  ref        service    category  drawing  usages  brands ("Marques installées")  extra search words
```

Its name, short description and 3 highlights are in `FR.eqi["RG-CAM-01"]` and `EN.eqi["RG-CAM-01"]`.

- **Add an item**: add a row with a new ref, then the `eqi` entry in **both** FR and EN.
- **Categories**: `cat` in FR and EN. **Drawings**: `EQI` (48×48 line drawings; reuse an existing key).
- **"Souvent installé avec"**: `PAIRS` (otherwise items of the same service are suggested).
- **Prices** (optional): after the `const EQ = …` line add e.g. `EQ["RG-CAM-01"].price = 450;`
  and set `CONFIG.showPrices = true`. Items without a price keep "Prix sur devis".
- Brands are only shown as "Marques installées". Do not add brands you do not actually install.

## 5. Réalisations and Avis clients (hidden until you add real items)

Both sections stay hidden while their arrays are empty. Add **real** projects and **real, verifiable** reviews only.

```js
const REALISATIONS = [
  { title: { fr: "Café — 8 caméras et Wi-Fi client", en: "Café — 8 cameras and guest Wi-Fi" }, city: "Rabat",
    services: ["cameras", "wifi-hotspot"],
    before: "assets/realisations/cafe-avant.webp", after: "assets/realisations/cafe-apres.webp",
    alt: { fr: "Salle du café", en: "Café dining room" } }
];
const AVIS = [
  { name: "Prénom N.", city: "Fès", service: "alarme", date: "2026-05",
    text: { fr: "…texte exact de l'avis…", en: "…translation…" } }
];
```

Put the photos in `assets/realisations/` (WebP, about 1200 px wide, same size for "avant" and "après").
Réalisations get a before/after slider and an enlarged view.

## 6. Contact details, WhatsApp and e-mail

`CONFIG.phoneDisplay`, `phoneIntl`, `whatsapp` (international number without `+`), `email`, `social`.
All requests (quote, inspection, contact) open WhatsApp `https://wa.me/<whatsapp>?text=…` with a pre-filled
message in the visitor's language; e-mail (`mailto:`) is offered as a fallback. Message templates: `FR.wa` / `EN.wa`.

## 7. Images, logo, icons

- Logo source: `assets/logo-rg-secure-solutions.jpg`. Re-generate every variant (transparent, white, mark,
  favicons, og-image) and the service crops with:
  ```bash
  npm install
  npm run assets
  ```
- The catalogue: replace `assets/catalogue-rg-secure-solutions.pdf` and `assets/catalogue/page-XX.jpg`,
  then `npm run assets` (it rebuilds the viewer images and thumbnails). Keep 15 pages, or change `PAGES`.
- UI icons are a subset of Lucide embedded in the page. To add one, append its name to the list in
  `tools/build-icons.mjs` and run `npm run icons` (it rewrites the block between `ICONS:BEGIN` and `ICONS:END`).

## 8. Analytics

`function track(event, data)` in `index.html` is a no-op. Uncomment / add your GA4 or Meta Pixel call there.
It is already called on WhatsApp clicks, quote sends, inspection sends, PDF downloads, service and equipment views.

## 9. Preview locally

```bash
npm run serve
```
then open http://localhost:8080 (opening the file directly also works, except the PDF download name).

## 10. Deploy

**GitHub Pages** — push the folder to a repository, then *Settings → Pages → Deploy from a branch → main / root*.

**Netlify** — drag the folder onto https://app.netlify.com/drop, or connect the repository with
build command *empty* and publish directory `.`.

**Own hosting (cPanel, FTP…)** — upload `index.html`, `assets/`, `site.webmanifest`, `robots.txt`, `sitemap.xml`
to the web root. Enable gzip/brotli and long cache headers for `assets/` if your host allows it.

`node_modules/`, `tools/` and `tests/` do not need to be uploaded.

## 11. Tests (optional, for developers)

```bash
npm install
npm i -D playwright@1.63.0 && npx playwright install chromium
npm test                 # 16 test groups (deep links, search, filters, quote, WhatsApp fixtures, i18n, a11y…)
npm run screenshots      # tests/screenshots/
npm run record           # tests/recordings/*.webm
```
The tests serve the site locally and map the CDN libraries to `node_modules` (set `LIVE_CDN=1` to use the real CDN).

## 12. Keyboard shortcuts on the site

`/` or `Ctrl K` search · `d` open the quote · `?` list of shortcuts · `←` `→` previous/next service or catalogue page · `Esc` close.
