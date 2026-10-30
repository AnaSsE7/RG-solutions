# Build prompt — RG Secure Solutions website (v2)

Unzip `rg-site-kit.zip` into an empty project folder, open Claude Code in that folder, and paste everything below the line.

---

## 1. Role and goal

You are a senior front-end engineer and designer. Build a **single-page website for RG Secure Solutions**, a Moroccan company that sells, installs, configures and maintains security, network and IT equipment. Its signature is "Innover • Connecter • Protéger".

The site must do three jobs well:
1. **Explain the 13 services clearly.** The full content is in Appendix A, transcribed from the company's official catalogue. Use that text and do not invent services.
2. **Act as an equipment catalogue**, in the spirit of 212link.com and karamtech.ma: categories, search, filters, and detail sheets.
3. **Turn visitors into leads.** That means a quote cart, a free site-inspection request, and WhatsApp contact everywhere.

**Files already in this folder**
- `assets/logo-rg-secure-solutions.jpg`: **the official logo; use it.** Section 3 explains how.
- `assets/catalogue-rg-secure-solutions.pdf`: the official catalogue (3 MB web version). Offer it as a download.
- `assets/catalogue/page-01.jpg … page-15.jpg`: the catalogue pages as images. Use them for the catalogue viewer, and crop the photo area at the top of pages 02–14 as service cover images (section 6.3).

**Output**
- `index.html`: one page, with CSS and JS inline in the file. Libraries and fonts load from CDNs. It is hosted online on GitHub Pages, Netlify, or the owner's own host.
- `assets/`: logo variants, service images, favicon set, and an og-image.
- `README.md`: how to edit content, services, products, contact details and images, and how to deploy.

**Rules**
- CDNs, animation libraries and Google Fonts are allowed. Load them with `defer`, and pin exact versions.
- There is no backend. All requests (quote, inspection, contact) go out through a **pre-filled WhatsApp message** (`https://wa.me/212775450796?text=…`), with `mailto:` as a fallback.
- Work in phases. After each phase, check the result in headless Chromium with Playwright, fix problems, and carry on without asking me. Log decisions in `BUILD_NOTES.md`.

## 2. Business data: one CONFIG object at the top of the script

```js
const CONFIG = {
  brand: "RG Secure Solutions",
  tagline: "Sécurité • Réseaux • Solutions IT",
  signature: "Innover • Connecter • Protéger",
  slogan: "Votre sécurité, notre priorité",
  phoneDisplay: "07 75 45 07 96",
  phoneIntl: "+212775450796",
  whatsapp: "212775450796",
  email: "RGsecuresolutions@gmail.com",
  country: "Maroc",
  city: "",            // TO FILL — shown in hero, contact and JSON-LD
  hours: "",           // TO FILL
  social: {
    facebook:  "",     // page "RG Secure Solutions" — TO FILL with URL
    instagram: "https://www.instagram.com/rgsecuresolution/",
    tiktok:    "https://www.tiktok.com/@rgsecuresolutions"
  },
  catalogPdf: "assets/catalogue-rg-secure-solutions.pdf",
  showPrices: false    // true → "à partir de X MAD", false → "Prix sur devis"
};
```

Always write the name as "RG Secure Solutions". When a CONFIG value is empty, hide its UI cleanly rather than showing a blank.

## 3. Logo

The supplied logo is a JPG on a white background: a bold "RG" monogram in a navy → royal blue → sky-blue gradient, with "RG Secure Solutions" in a heavy geometric sans and "SÉCURITÉ • RÉSEAUX • SOLUTIONS IT" spaced out underneath.

Prepare these files with a Node or Python script, and commit the script:
1. `logo-full.png`: transparent background. Remove the near-white background with a soft threshold so the edges stay clean.
2. `logo-mark.png`: the RG monogram only, cropped, with a transparent background.
3. `logo-full-white.png`: an all-white version for the dark footer and dark mode.
4. A favicon set (32, 180 and 512 px, from the mark), plus a 1200×630 `og-image.jpg` with the logo on navy.

Usage:
- Header: the mark plus the wordmark, or the full logo when wider than 1100px.
- Footer: the white version.
- Loader and intro: see section 5.

Don't recolour or redraw the logo. If background removal leaves a halo, fall back to placing the original logo on a white plate with a 6px radius.

## 4. Design: modern and premium, NOT generic AI

The company's current flyers are busy, AI-generated blue posters with glowing shields. The website must look clearly more professional than that while staying true to the brand colours.

**Palette (from the logo)**
- Navy `#1B2F5E`
- Royal blue `#0A5BB5`
- Sky `#36AEE5`
- Ink `#0D1726`
- Paper `#F5F7FA`
- Hairline `#DCE3EC`
- Alert amber `#F2A33A`: used only for alarm and alert states.
- WhatsApp green: used only on WhatsApp buttons.

The logo's navy → sky gradient may appear in **at most two places**: the logo itself and one thin accent line or progress bar. No gradient buttons, no gradient text, no neon glows, no glassmorphism.

Dark mode is a deep navy `#0A1222`, not pure black.

**Type (Google Fonts)**
- Headings: **Sora** 600/700, which echoes the logo's geometric sans.
- Body: **Manrope** 400/500/600.
- References and specs: **JetBrains Mono** 500.
- Use tabular numbers.
- Never use Inter, Poppins or Roboto.

**Visual language: a technical installer**
- Blueprint and floor-plan line drawings, coverage diagrams (camera fields of view, Wi-Fi rings), cable-label tags, monospaced reference codes such as `RG-SRV-03`, and hairline 1px rules.
- Small radii (4–8px).
- Borders more than shadows, with one soft elevation level for floating elements.
- Section labels in small caps with an index number ("03 — CAMÉRAS DE SURVEILLANCE").
- **Icons:** Lucide via CDN for generic UI. Use custom thin-stroke inline SVGs for equipment (dome, bullet and PTZ cameras, NVR, switch, access point, router, siren, keypad, badge reader, fingerprint, intercom panel, gate motor, ceiling speaker, IP phone, POS terminal, HDMI splitter).
- **No emoji** used as icons or headings.

**Copy**
- French, calm and concrete, taken from Appendix A.
- Use the catalogue's slogans where they fit: "Votre partenaire de confiance", "Votre projet, notre engagement !", "Des solutions fiables pour un avenir plus sûr !"
- No marketing fluff, no fake statistics.

**Banned:**
- Stock "smiling call-centre agent" images.
- Floating blobs, sparkles, confetti.
- An identical fade-up on every block.
- Infinite pulsing decorations.
- Pill buttons everywhere.
- Filler text.
- Fake reviews presented as real (see 6.9).

## 5. Motion and interactivity (libraries allowed)

**Stack**
- **GSAP 3 + ScrollTrigger** (and DrawSVGPlugin / MorphSVGPlugin, now free, if useful).
- **Lenis** for smooth scrolling.
- View Transitions API, with a fallback, for opening detail sheets.
- Optionally **Swiper** for carousels.
- Animate only transform, opacity, clip-path and stroke properties. Target 60fps on a mid-range Android phone.

**Signature moments**
1. **Intro (once per session, under 1.4s, skippable).** The RG mark fades in on paper with a blueprint grid; a thin sky-blue line traces the grid. The header slides in and the hero headline reveals line by line. Never repeat it on scroll-back.
2. **Hero "plan interactif".** A line-drawn floor plan (villa + shop/office) draws itself in. Service toggles along the side (Caméras, Alarme, Réseau & Wi-Fi, Accès, Interphone, Portail, Sonorisation, Domotique) light up the matching equipment on the plan:
   - camera cones sweep open;
   - Wi-Fi rings expand;
   - alarm sensors blink amber once;
   - the gate slides;
   - speaker waves ripple;
   - domotique lights fade on.
   Each toggle shows a mini caption plus "Voir le service →". On mobile the toggles become a swipeable chip row.
3. **Services section: horizontal pinned scroll on desktop** (ScrollTrigger pin) through the 13 service panels. On tablet and phone it becomes a normal vertical list. Each panel's equipment line-icon draws in when the panel becomes active.
4. **Service detail.** Clicking a service morphs its panel into a full-screen sheet (shared-element transition). The 4 blocks (Présentation / Nos solutions / Nos prestations / Les avantages) then stagger in, and the solution list ticks draw in as strokes.
5. **Process timeline:** Étude → Devis → Installation → Configuration → Mise en service → Maintenance. The line draws as you scroll, and each step's icon snaps in as the line reaches it.
6. **Add to quote:** the item's icon flies on a curved path into the quote button, and the counter rolls.
7. **Sending:** a "Demande envoyée" stamp presses in, then WhatsApp opens.
8. **Micro-interactions:**
   - magnetic hover on primary buttons (desktop only);
   - press at scale 0.97;
   - focus rings that draw in;
   - animated input underlines;
   - copy-to-clipboard confirmation on the phone number and email.

**Control:** Settings → Motion: Full / Reduced / Off.
- Respect `prefers-reduced-motion`.
- Disable pinning, Lenis and the intro when motion is Reduced or Off.
- Never block input during an animation.

## 6. Sections and features (in page order)

### 6.1 Header (sticky, condenses on scroll)
- Logo, then the anchor nav: Accueil · Services · Solutions · Équipements · Catalogue · FAQ · Contact. The active section is highlighted.
- A **Services mega-menu** listing all 13 services in 3 groups, each with an icon and a one-line description:
  - **Sécurité:** Caméras, Alarme, Contrôle d'accès, Interphones & vidéophones, Portes & portails.
  - **Réseaux & communication:** Réseaux informatiques, Wi-Fi & hotspot, Téléphonie IP.
  - **Solutions IT & confort:** Pointeuses, Affichage & multimédia, Sonorisation, Domotique, Systèmes de caisse.
- **Search** (`/` or Ctrl+K). An overlay searches services, equipment and FAQ. It ignores accents and tolerates typos ("camera" finds Caméras), and it supports keyboard navigation.
- "Mon devis (n)" button, a WhatsApp button, and a theme toggle.
- **Phone:** a compact header plus a **fixed bottom bar**: Appeler · WhatsApp · Devis (n) · Menu.

### 6.2 Hero
- H1, for example: "Sécurité, réseaux et solutions IT — installés proprement, suivis après la mise en service."
- Subtitle from the catalogue: "Des solutions innovantes pour sécuriser, connecter et simplifier votre quotidien."
- Buttons: **"Inspection technique gratuite"** (primary), "Voir nos services", and "Télécharger le catalogue (PDF)".
- The six pillars from catalogue page 01 shown as a small row: Sécurité · Réseaux · Sonorisation · Automatisation · Téléphonie · Systèmes de caisse.
- The interactive floor plan (section 5.2).
- The four promises from page 01 below the hero: **Expertise** (des solutions adaptées à vos besoins), **Qualité** (matériel fiable et performant), **Support** (assistance technique rapide et efficace), **Confiance** (un partenaire de confiance).

### 6.3 Services: the 13 services from Appendix A
- **Overview:** horizontal pinned panels on desktop and a list on mobile. Each panel shows the number, title, the italic tagline from the catalogue, the 5 feature icons, and a cover image.
- **Cover images:** crop the top photo area (roughly the right 55%, top 40%) of catalogue pages 02–14. Run `sharp` with Node and save the results as `assets/services/<slug>.webp` (1200px wide, plus a 600px `srcset`). Check each crop visually and adjust its coordinates per page. Store the crops in a `CROPS` table in the script.
- **Detail sheet** (one per service, deep-linkable via `#service/<slug>`) contains:
  - the hero image and tagline;
  - the 5 feature icons;
  - the **4 blocks**: Présentation, Nos solutions, Nos prestations, Les avantages. Use the exact text from Appendix A;
  - the "Notre engagement" line and its 6 badges;
  - the matching equipment from 6.5;
  - "Clients concernés" chips linking to 6.4;
  - buttons: **"Demander un devis pour ce service"** (adds the service to the quote cart), **"Inspection gratuite"** (pre-fills 6.7), and "Voir la page du catalogue" (opens the viewer in 6.6 at that page);
  - previous / next service navigation (arrow keys and swipe).
- All service content lives in one `SERVICES` array, with fields `slug, page, title, tagline, features[5], presentation, solutions[], prestations[], avantages[], engagement{text, badges[6]}, group, clients[]`.

### 6.4 Solutions by client type
- Chips: Maison & villa · Immeuble / résidence · Commerce · Café & restaurant · Bureau · École · Hôtel · Entreprise / PME. These are the audiences the catalogue names.
- Each client type shows:
  - the recommended services, as linked cards;
  - 3 concrete needs mapped to those services;
  - **"Ajouter ce pack au devis"**, which adds all of those services in one animation.
- Example: Café & restaurant → Wi-Fi & hotspot (portail client), Caméras, Sonorisation (musique d'ambiance), Système de caisse, Affichage dynamique.

### 6.5 Equipment catalogue (212link / karamtech-style)
The catalogue PDF describes **equipment types, not models or prices**. Build the catalogue from the "Nos solutions" lines of each service, so every item is an equipment type.

**Data model:** about 70–90 items, in an `EQUIPMENT` array with fields `ref (RG-CAM-01…), name, service, category, useCases[], short, highlights[3], brands[], tags[]`. Examples:
- Caméras IP / Caméras PTZ / Caméras solaires & 4G / Caméras de lecture de plaques / Enregistreurs NVR-DVR-XVR
- Centrales d'alarme filaires & sans fil / Détecteurs de mouvement / Contacts d'ouverture / Sirènes
- Lecteurs badge, empreinte & reconnaissance faciale / Gâches & ventouses / Lecteurs UHF longue distance
- Points d'accès plafond & muraux / Switchs PoE / Routeurs MikroTik / Baie de brassage
- …and so on for all 13 services.

**Brands** come from the flyer's brand strip and are used only as "Marques installées" tags: Hikvision, Dahua, ZKTeco, Yealink, Aruba, TP-Link, MikroTik, BFT, Nice, FAAC, Ezviz, Phonic.

**Browsing**
- Left filter rail (a bottom sheet on phones):
  - Service, as a tree with counts;
  - Usage / client type;
  - Marque.
- Active filters appear as removable chips, with "Tout effacer".
- Sort by Pertinence, A–Z or Service.
- Grid or list view.
- Filter state is stored in the URL (`#equipements?service=cameras&usage=commerce`).
- Cards reorder with GSAP Flip when filters change.

**Card:** an equipment line-icon, name, mono ref, 3 highlights, the parent service, "Prix sur devis", **"+ Devis"** and a WhatsApp button.

**Detail drawer:** description, highlights, compatible items ("Souvent installé avec"), a quantity stepper, "Ajouter au devis", "Demander sur WhatsApp" (pre-filled with ref and quantity), and copy link.

**Extras**
- Compare up to 3 items side by side.
- A "Récemment consultés" strip, stored in localStorage.

### 6.6 Catalogue viewer
- A section titled "Notre catalogue" showing a 3D tilted cover of page 01 and a "Feuilleter" button.
- The button opens a full-screen **flipbook viewer** built from `assets/catalogue/page-XX.jpg`:
  - page-turn animation (StPageFlip via CDN, or a GSAP 3D flip);
  - thumbnails strip;
  - zoom and pan;
  - keyboard and swipe navigation;
  - page counter.
  - A link from any service detail opens the viewer at that service's page.
- "Télécharger le PDF (3 Mo)" button.
- A WhatsApp share button: "Je partage le catalogue RG Secure Solutions : <url>".

### 6.7 Free technical inspection ("Inspection technique gratuite")
- A 3-step form with a progress bar:
  1. Type of place (from 6.4) and its approximate size.
  2. Services needed (multi-select of the 13).
  3. Name, phone, city, preferred day and time slot, and a message.
- Validate Moroccan phone numbers (`06`, `07`, `05`, or `+212`).
- Submit stamps "Demande envoyée" and opens WhatsApp with a cleanly formatted message. The email fallback is also offered.

### 6.8 Quote cart ("Mon devis")
- A slide-over panel listing services, packs and equipment, with quantity steppers, a note per line, and remove with an undo toast.
- Client form: name, phone, city, client type, desired date, and message.
- Send options:
  - **WhatsApp:** a structured message with a numbered list, a reference `DV-YYYYMMDD-XXX`, and the client details.
  - **Email:** mailto.
  - **Print / PDF:** a print stylesheet styled as an RG letterhead with the logo, reference, date, lines, and the engagement text.
- The cart persists in localStorage with a schema version.

### 6.9 Why RG Secure Solutions + trust
- "Pourquoi choisir RG Secure Solutions ?": Matériel de qualité et certifié · Support technique rapide · Installation professionnelle · Service après-vente assuré · Conseil personnalisé et étude de vos besoins.
- "Notre engagement": *Une installation propre, sécurisée et adaptée à votre environnement, avec accompagnement et assistance après la mise en service.*
- A brand marquee: the 12 brands as monochrome text wordmarks, in a slow loop that pauses on hover.
- **Réalisations and Avis clients.** Build both sections, driven by `REALISATIONS` and `AVIS` arrays that start **empty**. A section stays hidden until it has data, and README.md explains how to add items. Réalisations get a before/after slider and a lightbox. Never ship invented reviews or fake project photos.
- Optional "Instagram" strip that links to the profile; no embed is required.

### 6.10 FAQ
- At least 10 questions answered with catalogue facts. Examples:
  - Est-ce que l'inspection est gratuite ?
  - Puis-je voir mes caméras à distance ?
  - Que se passe-t-il en cas de coupure de courant ?
  - Installez-vous dans tout le Maroc ?
  - Proposez-vous la maintenance ?
  - Peut-on relier alarme, caméras et contrôle d'accès ?
  - Quelle différence entre NVR, DVR et XVR ?
  - Faut-il un abonnement pour le hotspot ?
- Animated accordion with search, plus FAQPage JSON-LD.

### 6.11 Contact (from catalogue page 15)
- Heading "Parlons de votre projet !" with the page-15 text.
- Cards for WhatsApp/phone, email, Facebook, Instagram and TikTok. Each has a click action and a copy button.
- The "Des solutions sur mesure pour votre sécurité" checklist: Étude et conseil personnalisés · Installation professionnelle · Maintenance et support réactifs · Matériel fiable et performant.
- A quick contact form (sends through WhatsApp or mailto).
- A Google Maps embed, lazy-loaded on click and only if `CONFIG.city` is set.

### 6.12 Footer
- White logo, signature line, service links (all 13), quick links, contacts and socials.
- "Mentions légales" and "Conditions" open as modals with editable placeholder text.
- © with an auto-computed year.

### 6.13 Global features
- **Floating WhatsApp button** on desktop, which opens quick messages: "Je veux un devis", "Inspection gratuite", "Panne / SAV", "Question sur un service".
- **Languages:** French by default, plus **Arabic (RTL)**. All UI strings and service content go through an `I18N` object. Translate the Appendix A content into clear Modern Standard Arabic. Load Google Font **IBM Plex Sans Arabic** for Arabic.
- **SEO:**
  - French meta title and description, Open Graph and Twitter cards;
  - `LocalBusiness` JSON-LD (name, phone, email, social `sameAs`, area served Morocco, and the services as `OfferCatalog`);
  - semantic HTML with one H1, descriptive alt texts, and a `sitemap.xml` + `robots.txt`.
- **Settings popover:** theme (light / dark / system), motion (full / reduced / off), language.
- **Accessibility:**
  - keyboard operation everywhere;
  - focus trapping in modals and Escape to close;
  - ARIA for tabs, accordions, dialogs and the mega-menu;
  - AA contrast in both themes.
- **Keyboard shortcuts:** `/` search, `d` quote cart, `?` shortcuts overlay.
- **Analytics hook:** a `track(event, data)` stub that is a no-op by default, ready for GA4 or Meta Pixel. Call it on WhatsApp clicks, quote sends, inspection sends and PDF downloads.

## 7. Layout
- **Desktop (≥1200px):** 12-column grid, max width 1280px, pinned horizontal services.
- **Tablet (768–1199px):** 2-column services and equipment, filters in a drawer.
- **Phone (<768px):** single column, bottom action bar, bottom sheets, and 44px touch targets.
- 16px minimum gutter and no horizontal overflow at any width.

## 8. Code and performance
- One `index.html` with organised inline `<style>` and `<script type="module">` blocks. Group the code as config, i18n, data (SERVICES, EQUIPMENT, CLIENTS, FAQ, REALISATIONS, AVIS), state with pub/sub, router (hash deep links), search, motion, UI components, quote, whatsapp message builder, and forms.
- Escape all user input.
- Lazy-load images, use WebP with `srcset`, preconnect to font and CDN hosts, and defer non-critical libraries.
- Targets: Lighthouse mobile Performance ≥ 90 and Accessibility, Best Practices and SEO ≥ 95. No console errors in Chrome, Firefox or Safari.

## 9. Testing (Playwright)
- Every service deep link opens the correct sheet with the exact Appendix A text.
- Search for "camera", "wifi" and "badge" returns the right services and equipment.
- Filters, sort and URL-hash restore.
- Add to quote → persists after reload → quantity edits → remove + undo.
- The WhatsApp message builder output exactly matches a fixture, including accents and Arabic, and is correctly URL-encoded.
- Inspection form validation.
- The catalogue viewer opens at the right page.
- RTL mirrors the layout correctly.
- Motion Off disables pinning, Lenis and the intro.
- Réalisations and Avis stay hidden while their arrays are empty.
- **Screenshots:** desktop light, desktop dark, tablet, phone, phone in Arabic.
- **Short recordings:** the intro, the floor-plan toggles, the pinned services scroll, the service-sheet morph, add to quote, and the flipbook. Review them for smoothness and against the design bans, then fix any problems.

## 10. Build phases
1. Logo processing, tokens, fonts, layout shell, header with mega-menu, bottom bar, settings, motion setup.
2. Hero with the interactive floor plan, and the intro.
3. Service image crops, the SERVICES data (Appendix A), the pinned services section, the detail sheets, and the process timeline.
4. EQUIPMENT data, catalogue filters, search, the detail drawer, compare.
5. Quote cart, inspection form, the WhatsApp/email/print flows.
6. Client types with packs, the catalogue flipbook, why us, brands, FAQ, contact, footer.
7. Arabic/RTL, SEO and JSON-LD, sitemap, analytics hook, accessibility pass.
8. Tests, screenshots and recordings, a performance pass, a motion polish pass, README.md.

When finished, summarize the files and sizes, key decisions, every placeholder the owner must fill in (city, hours, Facebook URL, réalisations, avis, optional prices), and known limitations.

---

## Appendix A — Service content (from the official catalogue, use verbatim)

Common to every service: *"Nous assurons la vente, l'installation, la configuration et la maintenance…"* Every engagement line follows the pattern *"Une installation propre, [sécurisée / bien organisée / bien configurée…] et adaptée à votre environnement, avec accompagnement et assistance après la mise en service."* Every service's engagement badges include: Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives.

### 01 Réseaux informatiques (page 02) — slug `reseaux`
- **Tagline:** Une infrastructure stable pour une connexion fiable et performante.
- **Features:** Câblage structuré · Réseau sécurisé · Connexion stable · Matériel professionnel · Installation & maintenance
- **Présentation:** Optimisez la connectivité de vos locaux grâce à des solutions de réseaux informatiques fiables et performantes. Nous assurons la vente, l'installation, la configuration et la maintenance d'infrastructures réseau pour les maisons, commerces, cafés, écoles, bureaux, hôtels et entreprises.
- **Nos solutions:** Câblage réseau RJ45 et baie de brassage · Installation de switches, routeurs et points d'accès · Réseaux filaires et sans fil · Solutions PoE pour caméras, téléphones IP et bornes Wi-Fi · Configuration IP, VLAN et adressage réseau · Partage Internet et extension de couverture · Interconnexion des équipements informatiques · Réseau pour bureaux, écoles, commerces et cafés · Organisation et sécurisation de l'infrastructure · Préparation pour vidéosurveillance, téléphonie IP et hotspot
- **Nos prestations:** Étude et inspection du site · Conception de l'architecture réseau · Tirage et organisation des câbles · Installation des prises, switches et routeurs · Configuration des équipements réseau · Tests de connectivité et de débit · Configuration Wi-Fi et accès Internet · Optimisation de la stabilité du réseau · Maintenance préventive et dépannage · Assistance technique et évolution du réseau
- **Les avantages:** Connexion stable et rapide · Réduction des coupures et pertes réseau · Meilleure organisation des équipements · Infrastructure adaptée à vos besoins · Réseau évolutif et facile à maintenir · Base solide pour caméras, Wi-Fi et téléphonie IP
- **Engagement badges:** Performance et stabilité · Câblage soigné · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 02 Wi-Fi & Hotspot (page 03) — slug `wifi-hotspot`
- **Tagline:** Une couverture Wi-Fi performante pour vos clients et vos équipes.
- **Features:** Couverture optimale · Hotspot client · Connexion stable · Gestion du débit · Installation & maintenance
- **Présentation:** Optimisez la connectivité de vos locaux grâce à des solutions Wi-Fi et hotspot fiables et performantes. Nous assurons la vente, l'installation, la configuration et la maintenance de réseaux sans fil pour les cafés, hôtels, écoles, bureaux, commerces et entreprises.
- **Nos solutions:** Points d'accès plafond et muraux · Réseau Wi-Fi pour cafés, hôtels, écoles et bureaux · Hotspot client avec portail d'authentification · Extension de couverture et suppression des zones mortes · Contrôle et partage de la bande passante · Réseaux invités et réseaux internes séparés · Configuration SSID, sécurité et accès Internet · Solutions MikroTik, routeurs et bornes Wi-Fi · Supervision et optimisation des performances · Intégration avec caméras, POS et téléphonie IP
- **Nos prestations:** Étude de couverture sur site · Choix des bornes et de l'architecture · Installation et câblage des points d'accès · Configuration routeur, AP et hotspot · Sécurisation du réseau Wi-Fi · Paramétrage du portail captif · Tests de stabilité et de débit · Optimisation des canaux et de la couverture · Maintenance préventive et dépannage · Assistance et évolution du réseau
- **Les avantages:** Connexion rapide et stable · Meilleure expérience client · Couverture homogène des espaces · Gestion des utilisateurs et du débit · Réseau sécurisé et évolutif · Solution adaptée à votre activité
- **Engagement badges:** Couverture & stabilité · Hotspot professionnel · Expertise réseau · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 03 Caméras de surveillance (page 04) — slug `cameras`
- **Tagline:** Gardez le contrôle, où que vous soyez.
- **Features:** Sécurité renforcée · Accès à distance · Vision nocturne · Détection intelligente · Installation & maintenance
- **Présentation:** Protégez vos locaux, vos équipements et vos collaborateurs grâce à des solutions de vidéosurveillance adaptées à chaque besoin. Nous assurons la vente, l'installation, la configuration et la maintenance de systèmes de surveillance pour les maisons, commerces, cafés, écoles, bureaux, résidences et entreprises.
- **Nos solutions:** Caméras IP et analogiques · Caméras intérieures et extérieures · Caméras fixes, motorisées et PTZ · Vision nocturne et détection intelligente · Caméras solaires, Wi-Fi et 4G · Caméras de lecture de plaques · Enregistreurs NVR, DVR et XVR · Accès depuis téléphone, tablette ou ordinateur · Notifications en cas de mouvement ou d'intrusion · Enregistrement continu ou sur détection
- **Nos prestations:** Étude et inspection du site · Choix des caméras et de l'enregistreur · Installation et câblage · Configuration réseau · Configuration de l'application mobile · Création des utilisateurs et des autorisations · Réglage de la qualité d'image · Configuration des notifications · Test complet du système · Maintenance préventive et dépannage
- **Les avantages:** Surveillance 24 h/24 · Visualisation en direct à distance · Enregistrement et consultation des événements · Réduction des risques de vol et d'intrusion · Meilleur contrôle des accès et des activités · Solutions évolutives selon votre budget
- **Engagement badges:** Sécurité et fiabilité · Matériel de qualité · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 04 Systèmes d'alarme (page 05) — slug `alarme`
- **Tagline:** Sécurisez vos locaux contre l'intrusion, où que vous soyez.
- **Features:** Protection intrusion · Alerte immédiate · Contrôle à distance · Installation pro · Maintenance
- **Présentation:** Protégez vos locaux, vos équipements et vos accès grâce à des systèmes d'alarme fiables et performants. Nous assurons la vente, l'installation, la configuration et la maintenance de solutions anti-intrusion pour les maisons, commerces, bureaux, écoles et entreprises.
- **Nos solutions:** Centrales d'alarme filaires et sans fil · Détecteurs de mouvement · Contacts d'ouverture pour portes et fenêtres · Sirènes intérieures et extérieures · Claviers, télécommandes et badges · Application mobile et notifications · Détection d'intrusion et alertes en temps réel · Création de zones et scénarios d'armement · Intégration avec vidéosurveillance et contrôle d'accès · Maintenance et évolution du système
- **Nos prestations:** Étude et inspection du site · Choix des équipements et de l'architecture · Installation des détecteurs et de la centrale · Configuration des zones et des utilisateurs · Paramétrage des alertes et de l'application mobile · Tests d'armement et de déclenchement · Réglages selon l'environnement · Maintenance préventive et dépannage · Ajout ou remplacement d'accessoires · Assistance technique après installation
- **Les avantages:** Protection renforcée contre l'intrusion · Alerte rapide en cas d'événement · Surveillance et contrôle à distance · Dissuasion efficace · Système évolutif selon vos besoins · Installation fiable et professionnelle
- **Engagement badges:** Protection & fiabilité · Installation soignée · Expertise sécurité · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 05 Contrôle d'accès (page 06) — slug `controle-acces`
- **Tagline:** Gérez et sécurisez l'accès à vos locaux avec précision.
- **Features:** Accès sécurisé · Badge & code · Gestion utilisateurs · Installation pro · Maintenance
- **Présentation:** Contrôlez les accès à vos locaux grâce à des solutions fiables et adaptées à votre activité. Nous assurons la vente, l'installation, la configuration et la maintenance de systèmes de contrôle d'accès pour les bureaux, commerces, écoles, immeubles et entreprises.
- **Nos solutions:** Lecteurs badge, empreinte et reconnaissance faciale · Digicodes et claviers d'accès · Gâches électriques et ventouses · Contrôle d'accès pour portes, portails et bureaux · Gestion des utilisateurs et des autorisations · Historique des accès et événements · Lecteurs UHF et solutions longue distance · Intégration avec interphone, vidéophone et alarme · Solutions pour immeubles, écoles et entreprises · Maintenance et évolution de l'installation
- **Nos prestations:** Étude et inspection du site · Choix du lecteur et du système · Installation des lecteurs et verrouillages · Configuration des utilisateurs et des droits · Paramétrage des horaires et accès · Tests de fonctionnement et de sécurité · Organisation du câblage et finition propre · Maintenance préventive et dépannage · Ajout ou remplacement d'accessoires · Assistance technique après installation
- **Les avantages:** Meilleur contrôle des entrées et sorties · Sécurisation des accès sensibles · Gestion simple des utilisateurs · Historique clair des événements · Solution évolutive selon vos besoins · Installation fiable et professionnelle
- **Engagement badges:** Sécurité & contrôle · Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 06 Pointeuses (page 07) — slug `pointeuses`
- **Tagline:** Simplifiez le suivi des présences et des horaires.
- **Features:** Pointage précis · Badge & empreinte · Gestion RH · Installation pro · Maintenance
- **Présentation:** Optimisez le suivi des présences grâce à des solutions de pointage fiables et adaptées à votre activité. Nous assurons la vente, l'installation, la configuration et la maintenance de systèmes de pointage pour les bureaux, écoles, commerces et entreprises.
- **Nos solutions:** Pointeuses à badge, empreinte et reconnaissance faciale · Gestion des horaires, retards et absences · Logiciel de présence et rapports · Contrôle d'accès simple intégré · Pointage en réseau et centralisation des données · Écrans couleur et interfaces intuitives · Export des données pour la gestion RH · Solutions pour PME, écoles et entreprises · Configuration utilisateurs et départements · Maintenance et évolution du système
- **Nos prestations:** Étude et inspection du besoin · Choix de la pointeuse et de l'architecture · Installation et câblage · Configuration des utilisateurs et horaires · Paramétrage des droits et services · Tests de pointage et de synchronisation · Formation de base à l'utilisation · Maintenance préventive et dépannage · Ajout de nouveaux utilisateurs · Assistance technique après installation
- **Les avantages:** Suivi précis des présences · Réduction des erreurs manuelles · Meilleure organisation RH · Consultation simple des rapports · Solution évolutive selon vos besoins · Installation fiable et professionnelle
- **Engagement badges:** Présence & fiabilité · Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 07 Interphones & Vidéophones (page 08) — slug `interphones`
- **Tagline:** Communiquez et contrôlez l'accès à distance.
- **Features:** Appel visiteur · Vidéo & audio · Accès à distance · Installation pro · Maintenance
- **Présentation:** Améliorez la communication et le contrôle d'accès de vos locaux grâce à des solutions d'interphonie et de vidéophonie fiables. Nous assurons la vente, l'installation, la configuration et la maintenance de systèmes pour les maisons, immeubles, bureaux, écoles et entreprises.
- **Nos solutions:** Interphones audio et vidéophones · Platines de rue et moniteurs intérieurs · Ouverture de porte à distance · Connexion avec gâche et ventouse · Appel sur écran et smartphone · Solutions pour maisons, immeubles et bureaux · Plusieurs écrans et plusieurs postes · Intégration avec contrôle d'accès · Qualité d'image et communication claire · Maintenance et évolution de l'installation
- **Nos prestations:** Étude et inspection du site · Choix du matériel adapté · Installation et câblage · Configuration des moniteurs et de la platine · Paramétrage d'ouverture de porte · Tests audio, vidéo et appel · Organisation du câblage et finition propre · Maintenance préventive et dépannage · Ajout ou remplacement d'équipements · Assistance technique après installation
- **Les avantages:** Communication claire avec les visiteurs · Meilleur contrôle des accès · Ouverture simple et rapide · Surveillance visuelle à l'entrée · Solution pratique et évolutive · Installation fiable et professionnelle
- **Engagement badges:** Communication & sécurité · Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 08 Affichage & Multimédia (page 09) — slug `affichage-multimedia`
- **Tagline:** Des solutions visuelles pour informer, présenter et diffuser efficacement.
- **Features:** Affichage dynamique · Multi-écrans · Distribution HDMI · Installation pro · Maintenance
- **Présentation:** Valorisez vos espaces grâce à des solutions d'affichage et de multimédia adaptées à vos besoins. Nous assurons la vente, l'installation, la configuration et la maintenance d'écrans, systèmes de diffusion et équipements audiovisuels pour les commerces, cafés, écoles, bureaux et entreprises.
- **Nos solutions:** Installation de TV, écrans et supports · Affichage dynamique pour commerces et entreprises · Distribution HDMI et diffusion multi-écrans · Splitters, extenders et matrices HDMI · Équipements pour salles de réunion et d'accueil · Panneaux LED et solutions de présentation · Diffusion d'une source vers plusieurs écrans · Intégration audiovisuelle propre et organisée · Solutions pour publicité, information et présentation · Maintenance et évolution de l'installation
- **Nos prestations:** Étude de l'emplacement et des besoins · Choix des écrans et accessoires · Installation murale et câblage · Configuration des équipements multimédia · Mise en place de splitters et extenders HDMI · Tests d'image et de diffusion · Organisation du câblage et finition propre · Réglages et optimisation de l'affichage · Maintenance préventive et dépannage · Assistance technique après installation
- **Les avantages:** Présentation moderne et professionnelle · Diffusion claire sur un ou plusieurs écrans · Installation adaptée à votre espace · Meilleure communication visuelle · Système évolutif et facile à gérer · Matériel fiable et durable
- **Engagement badges:** Visibilité & impact · Installation soignée · Expertise multimédia · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 09 Sonorisation (page 10) — slug `sonorisation`
- **Tagline:** Une diffusion sonore claire et adaptée à chaque espace.
- **Features:** Son clair · Diffusion uniforme · Matériel fiable · Installation pro · Maintenance
- **Présentation:** Améliorez la diffusion sonore de vos espaces grâce à des solutions de sonorisation fiables et bien adaptées. Nous assurons la vente, l'installation, la configuration et la maintenance de systèmes audio pour les cafés, écoles, bureaux, commerces, salles d'attente et entreprises.
- **Nos solutions:** Haut-parleurs plafonniers et muraux · Amplificateurs et systèmes 100V · Sonorisation pour cafés, écoles et bureaux · Musique d'ambiance et annonces vocales · Microphones et sources audio · Répartition audio par zones · Solutions pour salles de réunion et espaces publics · Câblage et intégration des équipements · Réglages pour une écoute claire et équilibrée · Maintenance et évolution de l'installation
- **Nos prestations:** Étude et inspection du site · Choix des haut-parleurs et de l'amplificateur · Installation et câblage audio · Réglage du volume et des zones · Connexion des sources audio · Tests de couverture et de qualité sonore · Optimisation de la diffusion · Maintenance préventive et dépannage · Remplacement ou ajout d'équipements · Assistance technique après installation
- **Les avantages:** Son clair et homogène · Meilleure ambiance dans vos espaces · Annonces audibles et efficaces · Installation adaptée à votre activité · Système évolutif et facile à utiliser · Matériel fiable et durable
- **Engagement badges:** Qualité sonore · Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 10 Portes & Portails automatiques (page 11) — slug `portails`
- **Tagline:** Automatisez l'ouverture de vos accès en toute sécurité.
- **Features:** Ouverture automatique · Sécurité d'accès · Commandes à distance · Installation pro · Maintenance
- **Présentation:** Facilitez et sécurisez l'accès à vos espaces grâce à des solutions d'automatisme fiables et adaptées. Nous assurons la vente, l'installation, la configuration et la maintenance de portes et portails automatiques pour les maisons, immeubles, bureaux et entreprises.
- **Nos solutions:** Portails coulissants et battants · Portes automatiques et barrières d'accès · Motorisations pour accès résidentiels et professionnels · Télécommandes, boutons et commandes murales · Photocellules et sécurités · Digicode et contrôle d'accès · Ouverture avec badge et smartphone · Réglage des butées et du fonctionnement · Solutions pour garages, immeubles et entreprises · Maintenance et évolution de l'installation
- **Nos prestations:** Étude et inspection du site · Choix du moteur et des accessoires · Installation mécanique et électrique · Câblage des sécurités et commandes · Réglage des fins de course · Tests d'ouverture, fermeture et sécurité · Organisation du câblage et finition propre · Maintenance préventive et dépannage · Ajout ou remplacement d'accessoires · Assistance technique après installation
- **Les avantages:** Confort d'utilisation au quotidien · Meilleure sécurité des accès · Gain de temps à l'ouverture · Solution adaptée à votre environnement · Système évolutif et pratique · Installation fiable et professionnelle
- **Engagement badges:** Confort & sécurité · Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 11 Domotique (page 12) — slug `domotique`
- **Tagline:** Pilotez vos équipements intelligemment et simplement.
- **Features:** Maison connectée · Éclairage intelligent · Scénarios auto · Installation pro · Maintenance
- **Présentation:** Modernisez vos espaces grâce à des solutions domotiques pratiques et évolutives. Nous assurons la vente, l'installation, la configuration et la maintenance de systèmes connectés pour les maisons, bureaux, commerces et entreprises.
- **Nos solutions:** Éclairage connecté et commande intelligente · Contrôle des rideaux, volets et prises · Modules Wi-Fi et automatismes · Scénarios et programmation horaire · Commande depuis smartphone · Capteurs et déclenchements automatiques · Gestion centralisée des équipements · Solutions pour confort, sécurité et économie d'énergie · Intégration avec caméras, alarme et contrôle d'accès · Maintenance et évolution de l'installation
- **Nos prestations:** Étude et inspection du besoin · Choix des équipements adaptés · Installation et câblage · Configuration des modules et applications · Création de scénarios automatiques · Tests de fonctionnement et de commande · Optimisation de l'utilisation · Maintenance préventive et dépannage · Ajout de nouveaux équipements · Assistance technique après installation
- **Les avantages:** Confort au quotidien · Pilotage simple à distance · Automatisation des équipements · Meilleure gestion de l'énergie · Solution moderne et évolutive · Installation fiable et professionnelle
- **Engagement badges:** Confort & contrôle · Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 12 Téléphonie IP (page 13) — slug `telephonie-ip`
- **Tagline:** Des communications modernes et performantes pour vos équipes.
- **Features:** Communication pro · Postes IP · Standard central · Installation pro · Maintenance
- **Présentation:** Optimisez les communications de votre activité grâce à des solutions de téléphonie IP fiables et modernes. Nous assurons la vente, l'installation, la configuration et la maintenance de systèmes de téléphonie pour les bureaux, écoles, commerces et entreprises.
- **Nos solutions:** Téléphones IP de bureau · Standards téléphoniques IP · Extensions internes et appels inter-postes · Transfert, conférence et renvoi d'appel · Messagerie vocale et gestion des appels · Postes pour bureaux, accueil et entreprises · Configuration réseau pour la voix · Intégration avec interphone et sécurité · Solutions pour PME, écoles et établissements · Maintenance et évolution de l'installation
- **Nos prestations:** Étude et inspection du besoin · Choix du standard et des postes · Installation et câblage réseau · Configuration IP et extensions · Paramétrage des utilisateurs et profils · Tests d'appels et de qualité vocale · Organisation du réseau et finition propre · Maintenance préventive et dépannage · Ajout de nouveaux postes · Assistance technique après installation
- **Les avantages:** Communication claire et professionnelle · Meilleure organisation interne · Fonctions avancées d'appel · Solution évolutive selon vos besoins · Intégration simple au réseau · Installation fiable et professionnelle
- **Engagement badges:** Communication & fiabilité · Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### 13 Systèmes de caisse (page 14) — slug `systemes-caisse`
- **Tagline:** Une solution complète pour encaisser efficacement.
- **Features:** Caisse complète · Vente rapide · Gestion magasin · Installation pro · Maintenance
- **Présentation:** Simplifiez vos opérations de vente grâce à des solutions de caisse complètes et professionnelles. Nous assurons la vente, l'installation, la configuration et la maintenance de systèmes de caisse pour les commerces, cafés, restaurants et entreprises.
- **Nos solutions:** Terminaux de vente tactiles · Imprimantes thermiques · Tiroirs-caisses et afficheurs client · Lecteurs codes-barres et accessoires · Solutions pour commerces, cafés et restaurants · Configuration des périphériques · Organisation du poste de vente · Solution de caisse complète et pratique · Installation propre et utilisation simple · Maintenance et évolution de l'installation
- **Nos prestations:** Étude et inspection du besoin · Choix du terminal et des périphériques · Installation et branchement complet · Configuration du poste de caisse · Tests d'impression et de lecture · Organisation de l'espace de vente · Formation de base à l'utilisation · Maintenance préventive et dépannage · Ajout ou remplacement d'accessoires · Assistance technique après installation
- **Les avantages:** Encaissement rapide et fluide · Poste de vente bien organisé · Meilleure expérience client · Solution adaptée à votre activité · Système évolutif et pratique · Installation fiable et professionnelle
- **Engagement badges:** Vente & performance · Installation soignée · Expertise professionnelle · Assistance après-vente · Maintenance rapide et efficace · Solutions évolutives

### Contact (page 15)
- Text: "Une question, un projet ou un besoin spécifique ? Notre équipe est à votre écoute pour vous accompagner avec des solutions fiables et innovantes."
- "Parlons de votre projet !": "Contactez-nous dès aujourd'hui pour une étude, un devis gratuit ou pour planifier l'installation et la maintenance de vos équipements."
- Values: **Sécurité** (protéger ce qui compte pour vous) · **Connectivité** (des réseaux stables et performants) · **Innovation** (des technologies au service de votre efficacité) · **Confiance** (un partenaire engagé à vos côtés).
- WhatsApp / Téléphone 07 75 45 07 96 · Email RGsecuresolutions@gmail.com · Facebook "RG Secure Solutions" · Instagram RG_securesolution · TikTok RGsecuresolutions

### Also from the flyers (not in the catalogue)
The two flyers also list **UPS & énergie**, **Matériel informatique & bureautique**, and a **cabinet médical** software offer. Show these as three short "Autres solutions" tiles that open a quote request only. They don't get full service sheets, because the catalogue doesn't describe them. Flag this in BUILD_NOTES.md so the owner can confirm.
