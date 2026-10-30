# BUILD_NOTES — RG Secure Solutions website

Decision log, kept phase by phase. Owner confirmations needed are marked **[À CONFIRMER]**.

## Inputs and discrepancies

- **Second language — EN, not AR.** `PROMPT-claude-code.md` inside the kit asks for French + **Arabic (RTL)**;
  the brief received in the conversation asks for French + **English**. The site follows the conversation brief
  (FR default + EN). Adding Arabic later means adding an `ar` dictionary, `dir="rtl"` and an Arabic font.
  **[À CONFIRMER]**
- **Appendix A is the source of truth** for service text. `tests/extract-appendix.mjs` parses Appendix A from
  `PROMPT-claude-code.md` into `tests/fixtures/appendix-a.json`, and the test suite compares every service sheet
  against it word for word (title, tagline, features, présentation, solutions, prestations, avantages, badges).
- **Engagement sentences** are not in Appendix A per service; they were read from each catalogue page
  (pp. 02–14). Page 11 (Portes & portails) prints "sécurisécurisée" (typo in the catalogue); the site uses
  "sécurisée". Page 05 (Alarme) reads "Une installation sécurisée, bien configurée…" and page 10
  (Sonorisation) "Une installation soignée, performante…" — kept as printed.
- **"Autres solutions" from the flyers** — UPS & énergie, Matériel informatique & bureautique, logiciel pour
  cabinet médical — are three tiles that only add a quote request. They have no service sheet because the
  catalogue does not describe them. **[À CONFIRMER]** that these offers are current, and their wording.

## Phase 1 — logo, tokens, shell

- `tools/build-assets.mjs` (sharp): background removal with a **soft threshold on distance-from-white**
  (transparent below 10, opaque above 70, smoothstep in between) and **un-premultiplication against white**,
  so antialiased edges keep the logo colour (no light halo). A despeckle pass removes JPEG dust
  (one stray dot above the wordmark). Checked on navy at 2× zoom: no halo → the white-plate fallback is not used
  (`logo-full-plate.webp` is generated anyway).
- Variants: full / mark / name / wordmark (name + tagline) in colour and white, PNG masters + light WebP sizes;
  favicons 32/180/192/512 from the mark (180 on white for iOS); og-image 1200×630 = white logo on navy with a
  faint blueprint grid and the one gradient line.
- **Header logo**: the spec asks for "mark + wordmark, or the full logo above 1100 px". The stacked full logo is
  unreadable at header height, so above 1100 px the header shows the mark + the logo's own wordmark-with-tagline
  crop; below, mark + name. Both are crops of the original artwork (not redrawn, not recoloured).
  Dark mode uses the white variants.
- Gradient budget (max two places): the logo itself, and the 2 px **scroll progress line** under the header.
  The inspection progress bar is solid royal blue. No gradient buttons/text, no glows, no glass.
- Colour contrast: all text pairs ≥ 4.5:1 in both themes (checked with axe-core). The dark-mode accent was
  darkened to `#1F70C8` (white text 5.0:1). WhatsApp buttons use WhatsApp green with dark ink text (7.5:1),
  because white on `#25D366` fails AA.
- Icons: the spec says "Lucide via CDN". The full Lucide UMD bundle is ~400 KB; to keep Lighthouse ≥ 90 the
  89 icons actually used are **embedded** (generated from `lucide-static@0.469.0` by `tools/build-icons.mjs`).
  Brand glyphs (WhatsApp, Instagram, TikTok, Facebook) come from Simple Icons (CC0).
  Equipment drawings (dome, bullet, PTZ, NVR, switch, AP, router, siren, keypad, badge reader, fingerprint,
  intercom, gate motor, ceiling speaker, IP phone, POS, HDMI splitter + ~55 more) are custom 48×48 1.5 px strokes.

## Phase 2 — hero + floor plan + intro

- Floor plan is inline SVG (villa + shop), drawn with 4 merged "pen" paths (walls, inner walls, doors/furniture,
  dimensions) using `pathLength=1` + dash offset — cheap, no plugin. 8 toggles (several can be on):
  camera cones sweep open, Wi-Fi rings expand, sensors blink amber once, access door highlights, intercom
  cable draws, gate slides, speaker waves ripple twice, lights fade on. Caption + "Voir le service →".
  On phones the toggles are a swipeable chip row.
- Intro (first visit per session, Full motion only, never with a deep link): RG mark on a blueprint grid, a sky
  line traces the grid, header slides in, headline unveils line by line. ~1.3 s; skipped by any key/click.
  The headline reveal measures line boxes with a `Range` and animates one `clip-path` (no DOM splitting — it was
  the largest main-thread task in profiling).
- Hero uses the Web Animations API, so it never waits for GSAP.

## Phase 3 — services, sheets, timeline

- Service crops: right part / top of pages 02–14, coordinates per page in `CROPS` (each checked visually; several
  were shifted to keep title letters and icons out of frame). Output 1200 w + 600 w WebP. **The source photos are
  only ~500 px wide in the catalogue images**, so the 1200 w files are upscaled (Lanczos + light sharpening).
  **[À CONFIRMER]** Supplying original photos would improve sharpness on large screens.
- `SERVICES` keeps the required fields (`slug, page, title, tagline, features, presentation, solutions,
  prestations, avantages, engagement, group, clients`) — text fields are getters into `I18N[lang].svc`, so one
  array serves both languages.
- "Clients concernés" per service = the audiences named in that service's présentation sentence.
- Desktop (≥ 1200 px, Full motion): GSAP ScrollTrigger pins the section and scrolls 13 panels horizontally
  (counter + progress line, equipment drawing draws in when a panel becomes active). Tablet: 2-column grid,
  phone: 1 column. Keyboard focus inside the pinned track scrolls the page to the focused panel.
- Detail sheet: full-screen dialog, deep link `#service/<slug>`, shared-element morph with the **View Transitions
  API** (fallback: GSAP clip-path from the panel rect; Reduced: fade; Off: instant). Blocks stagger in, tick marks
  draw. ← → keys and swipe for previous/next. "Voir la page du catalogue" opens the viewer at that page.
- Process timeline: line scrubs with scroll, each step icon snaps in when reached (ScrollTrigger).

## Phase 4 — equipment, search, compare

- 91 equipment *types* (no models, no prices) derived from each service's "Nos solutions", refs `RG-XXX-NN`.
  Brands are shown only as "Marques installées" and only where plausible (e.g. no brand on POS, displays,
  home automation). **[À CONFIRMER]** brand ↔ product pairing.
- Filters: service tree (service → categories) with **faceted counts**, usage, brand; removable chips;
  sort Pertinence / A–Z / Service; grid/list; text filter; state in the URL
  (`#equipements?service=cameras&usage=commerce&sort=az&view=list&item=RG-CAM-01`). GSAP Flip reorders cards.
- **Pagination ("Voir plus")**: 12 cards first, +24 per click. All 91 cards made the section ~10 000 px tall and
  the DOM 6 000 nodes; cards are now built on demand and cached.
- Detail drawer (bottom sheet on phones), quantity stepper, WhatsApp with ref + quantity, copy link,
  "Souvent installé avec" (`PAIRS`), "Récemment consultés" (localStorage), compare up to 3.
- Search overlay (`/`, Ctrl/⌘ K): services + equipment + FAQ, accent-insensitive, hyphen-insensitive ("wifi" =
  "Wi-Fi"), prefix + typo tolerance (Damerau–Levenshtein ≤ 1–2), ↑ ↓ ↵ Esc. Index is rebuilt per language.

## Phase 5 — quote, inspection, WhatsApp / e-mail / print

- Quote cart: services, packs, equipment, other solutions; quantity, note per line, remove with **Undo** toast;
  client form; reference `DV-YYYYMMDD-XXX`; localStorage with schema version `v: 1` (unknown versions reset).
- Message builders are pure functions (`buildQuoteMessage`, `buildInspectionMessage`, `buildContactMessage`)
  and are tested against exact FR + EN fixtures, including URL encoding.
- WhatsApp is opened right after the "Demande envoyée" stamp (< 1 s, within the browser's user-activation
  window); if a popup blocker refuses, the page navigates to the wa.me link instead, and the inspection success
  panel keeps "Ouvrir WhatsApp" / "Envoyer par e-mail" buttons.
- Moroccan phone validation: `05/06/07` + 8 digits, or `+212` / `00212` + 5/6/7 + 8 digits (spaces, dots,
  dashes allowed).
- Print / PDF: letterhead with logo, reference, date, client block, lines table and the engagement sentence
  (`tests/screenshots/quote-print.pdf`).

## Phase 6 — client types, catalogue viewer, trust, FAQ, contact, footer

- Client types: 8 tabs (ARIA tabs, arrow keys), recommended services, 3 needs mapped to services, "Ajouter ce
  pack au devis" (one pack line listing its services; icons fly to the cart in one staggered animation).
- Flipbook: own WAAPI 3D page turn (no StPageFlip dependency), thumbnails, zoom 2.2× with drag-pan (double-tap /
  button / Ctrl-wheel / + −), keyboard, swipe, counter, deep link `#catalogue?page=N`. Viewer and PDF stay French;
  EN shows "Catalogue available in French".
- Réalisations / Avis: built and **hidden while the arrays are empty**. No invented content anywhere.
- Brand marquee: text wordmarks, slow loop, pauses on hover/focus; static wrap when motion is Reduced/Off.
- FAQ: 12 questions answered only with catalogue facts or neutral wording. Two answers avoid inventing facts:
  "Installez-vous dans tout le Maroc ?" (asks for the city) and the power-cut answer (UPS advice).
  **[À CONFIRMER]** service area, and whether the hotspot involves any recurring fee.
- Contact: copy buttons with confirmation; Google Maps iframe is offered only when `CONFIG.city` is set and
  loads only after a click.

## Phase 7 — i18n, SEO, a11y

- `I18N = { fr: FR, en: EN }`; every visible string renders with `data-i18n` keys, so switching language rewrites
  text **in place** (crossfade, no reload): scroll position, open sheet/drawer, cart and form state are kept.
  `<html lang>`, title, description, OG/Twitter, JSON-LD, search index, WhatsApp templates are updated.
  Detection: `?lang=` > saved choice > browser language (`en*` → EN) > FR. Missing EN keys fall back to FR with
  a console warning on localhost; a test fails if any FR key is missing in EN.
- JSON-LD: `LocalBusiness` (+ `OfferCatalog` with the 13 services) and `FAQPage`, regenerated per language.
- Dialogs: focus trap, Escape, focus restore, background made `inert` while a dialog is open.

## Phase 8 — tests, performance, motion polish

- **Motion libraries are loaded on the first interaction** (pointer, key, wheel, touch, page scroll) or 6 s after
  `load`, with ordered non-blocking script tags, and only when Motion = Full. The brief says "load them with
  `defer`": the same pinned URLs are used, but injecting them after first paint removed ~300 ms of main-thread
  blocking on mobile (the hero does not need them). Deep links load them immediately.
- Other performance work: empty section shells hidden until rendered (CLS was 0.89 → 0.005); sections rendered
  one per task after the hero; `content-visibility: auto` on long below-the-fold sections; Lenis only on
  fine-pointer devices (touch scrolling stays native); search index built lazily; `:has()` removed; responsive
  `sizes`; lazy logo variants.
- Lighthouse 12.6 (local static server with gzip, CDN libs served locally, fonts via the network):
  **mobile 91–93 / 100 / 100 / 100**, **desktop 100 / 100 / 100 / 100**. Reports in `tests/lighthouse/`.
- Animation review (recordings in `tests/recordings/`) led to: trace line hidden before it draws, no flash of the
  headline/plan when the intro overlay fades, single toast for packs, dashed plot fence restored.

## Known limitations

- Tested in headless **Chromium only** (Firefox and WebKit were not available in the build environment). Code
  avoids Chromium-only APIs or feature-detects them (View Transitions, `scheduler.yield`, `requestIdleCallback`).
- The build sandbox had no access to jsDelivr; tests map the pinned CDN URLs to identical files from npm.
  Run `LIVE_CDN=1 npm test` once on a normal connection.
- Service photos are upscaled crops of catalogue images (see Phase 3).
- No backend: nothing is stored server-side; WhatsApp/e-mail need the visitor's apps.
