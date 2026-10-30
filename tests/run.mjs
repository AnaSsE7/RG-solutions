// RG Secure Solutions — Playwright test suite.  Run: npm test
// Uses headless Chromium, a local static server and the pinned CDN libraries from node_modules.
import fs from "node:fs";
import { serve, newBrowser, newPage, noIntro, ROOT } from "./helpers.mjs";

const APPX = JSON.parse(fs.readFileSync(ROOT + "/tests/fixtures/appendix-a.json", "utf8"));
const { srv, url } = await serve();
const browser = await newBrowser();
const results = [];
const only = process.argv[2];
async function test(name, fn) {
  if (only && !name.toLowerCase().includes(only.toLowerCase())) return;
  const errors = [];
  const ctxs = [];
  const open = async (opts = {}) => { const r = await newPage(browser, { storage: noIntro, errors, ...opts }); ctxs.push(r.ctx); return r.page; };
  const t0 = Date.now();
  try {
    await fn(open);
    const errs = errors.filter((e) => !/favicon/.test(e));
    if (errs.length) throw new Error("console errors: " + errs.join(" | "));
    results.push([true, name, Date.now() - t0]);
    console.log(`  ✓ ${name} (${Date.now() - t0} ms)`);
  } catch (e) {
    results.push([false, name, Date.now() - t0, e]);
    console.log(`  ✗ ${name}\n      ${String(e.message || e).split("\n").join("\n      ")}`);
  } finally { for (const c of ctxs) await c.close(); }
}
const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}\n  expected: ${JSON.stringify(b)}\n  actual:   ${JSON.stringify(a)}`); };
const ok = (v, msg) => { if (!v) throw new Error(msg); };
// A first pointer move, like a real visitor, triggers the (deferred) motion libraries.
const ready = async (page, q = "") => { await page.goto(url + q, { waitUntil: "networkidle" }); await page.waitForFunction(() => window.RG && document.documentElement.dataset.ready); await page.mouse.move(3, 3); await page.waitForTimeout(400); };
const texts = (page, sel) => page.$$eval(sel, (els) => els.map((e) => e.textContent.trim()));

console.log("\nRG Secure Solutions — tests\n");

/* 1. Service deep links → exact Appendix A text */
await test("every #service/<slug> deep link opens the right sheet with the exact Appendix A text", async (open) => {
  const page = await open();
  for (const [slug, a] of Object.entries(APPX)) {
    await ready(page, "#service/" + slug);
    await page.waitForSelector("#sheet #sheet-title");
    const title = await page.textContent("#sheet-title");
    eq(title.trim(), a.title, `${slug}: title`);
    eq((await page.textContent("#sheet .ss-hero .tagline")).trim(), a.tagline, `${slug}: tagline`);
    eq(await texts(page, "#sheet .ss-hero .feat"), a.features, `${slug}: features`);
    eq((await page.textContent("#sheet .pres")).trim(), a.presentation, `${slug}: presentation`);
    const blocks = await page.$$eval("#sheet .block", (bs) => bs.map((b) => [...b.querySelectorAll("li")].map((l) => l.textContent.trim())));
    eq(blocks[1], a.solutions, `${slug}: solutions`);
    eq(blocks[2], a.prestations, `${slug}: prestations`);
    eq(blocks[3], a.avantages, `${slug}: avantages`);
    eq(await texts(page, "#sheet .engage-badges li"), a.badges, `${slug}: badges`);
    const engage = (await page.textContent("#sheet .e-txt")).trim();
    ok(/^Une installation .+ et adaptée à votre environnement, avec accompagnement et assistance après la mise en service\.$/.test(engage), `${slug}: engagement pattern — ${engage}`);
    ok((await page.textContent("#sheet .crumb")).includes(`RG-SRV-${String(a.n).padStart(2, "0")}`), `${slug}: ref`);
    ok(await page.$eval("#sheet", (el) => document.activeElement && el.contains(document.activeElement)), `${slug}: focus inside sheet`);
  }
  // prev/next + Escape
  await ready(page, "#service/cameras");
  await page.waitForSelector("#sheet");
  await page.keyboard.press("ArrowRight"); await page.waitForTimeout(200);
  ok(page.url().endsWith("#service/alarme"), "ArrowRight → next service (alarme): " + page.url());
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  ok(!(await page.$("#sheet")), "Escape closes the sheet");
});

/* 2. Search */
await test("search: 'camera', 'wifi', 'badge' (+ typo, EN) return the right services and equipment", async (open) => {
  const page = await open();
  await ready(page);
  const s = (q) => page.evaluate((q) => window.RG.search(q).map((r) => `${r.type}:${r.id}`), q);
  const cam = await s("camera"); ok(cam[0] === "service:cameras", "camera → first result Caméras: " + cam.slice(0, 3));
  ok(cam.includes("equipment:RG-CAM-01") && cam.includes("equipment:RG-CAM-02"), "camera → camera equipment");
  const wifi = await s("wifi"); ok(wifi[0] === "service:wifi-hotspot", "wifi → Wi-Fi & Hotspot first: " + wifi.slice(0, 3));
  ok(wifi.some((r) => r.startsWith("equipment:RG-WIF")), "wifi → Wi-Fi equipment");
  const badge = await s("badge"); ok(badge.includes("service:controle-acces"), "badge → Contrôle d'accès: " + badge.slice(0, 5));
  ok(badge.includes("equipment:RG-ACC-01") && badge.includes("equipment:RG-PTG-02"), "badge → badge reader + badge time clock");
  ok((await s("camra"))[0] === "service:cameras", "typo 'camra' → Caméras");
  ok((await s("caméra"))[0] === "service:cameras", "accented 'caméra' → Caméras");
  // Keyboard UI: "/" → type → Enter opens the sheet
  await page.keyboard.press("/");
  await page.waitForSelector("#s-in");
  await page.keyboard.type("camera");
  await page.waitForTimeout(150);
  ok((await page.textContent(".sr-item[aria-selected='true'] b")).includes("Caméras"), "first option selected");
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowUp"); await page.keyboard.press("Enter");
  await page.waitForSelector("#sheet #sheet-title");
  eq((await page.textContent("#sheet-title")).trim(), "Caméras de surveillance", "Enter opens the sheet");
  // Ctrl+K opens search too, and English search works
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  await page.evaluate(() => window.RG.setLang("en", { animate: false }));
  const en = await s("camera"); ok(en[0] === "service:cameras", "EN camera → CCTV cameras");
  const enb = await s("badge"); ok(enb.includes("equipment:RG-ACC-01"), "EN badge → badge reader");
  await page.keyboard.press("Control+k"); await page.waitForSelector("#s-in");
});

/* 3. Filters, sort, URL hash restore */
await test("catalogue: filters, sort, view and URL-hash restore", async (open) => {
  const page = await open();
  await ready(page, "#equipements?service=cameras&usage=commerce");
  await page.waitForTimeout(400);
  const visible = () => page.$$eval("#eq-grid .eq-card:not([hidden])", (c) => c.map((x) => x.dataset.ref));
  const v = await visible();
  const expect = await page.evaluate(() => window.RG.EQUIPMENT.filter((e) => e.service === "cameras" && e.useCases.includes("commerce")).map((e) => e.ref));
  eq(v.slice().sort(), expect.slice().sort(), "service=cameras&usage=commerce");
  ok(await page.isChecked('#d-rail input[data-f="service"][value="cameras"]'), "service checkbox restored");
  ok((await page.textContent("#eq-chips")).includes("Commerce"), "active chip shown");
  await page.selectOption("#eq-sort", "az"); await page.waitForTimeout(300);
  const names = await page.$$eval("#eq-grid .eq-card:not([hidden]) h3", (h) => h.map((x) => x.textContent.trim()));
  eq(names, [...names].sort((a, b) => a.localeCompare(b, "fr")), "A–Z sort");
  ok(page.url().includes("sort=az") && page.url().includes("service=cameras"), "state in URL: " + page.url());
  await page.click('[data-view="list"]'); await page.waitForTimeout(200);
  ok(page.url().includes("view=list"), "view in URL");
  // brand filter via rail
  await page.check('#d-rail input[data-f="brand"][value="dahua"]'); await page.waitForTimeout(300);
  ok(page.url().includes("brand=dahua"), "brand in URL");
  await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(500);
  ok(await page.$eval("#eq-grid", (g) => g.classList.contains("is-list")), "list view restored");
  eq(await page.inputValue("#eq-sort"), "az", "sort restored");
  ok(await page.isChecked('#d-rail input[data-f="brand"][value="dahua"]'), "brand restored");
  await page.click("#eq-chips [data-clear]"); await page.waitForTimeout(300);
  eq((await page.textContent("#eq-count")).trim(), "91 équipements", "clear all");
  ok(!(await page.isHidden("#eq-more")), "show-more button when unfiltered");
  await page.click("#eq-more-btn"); await page.waitForTimeout(300);
  eq((await visible()).length, 36, "show more reveals 24 more");
  // text filter
  await page.fill("#eq-q", "switch"); await page.waitForTimeout(500);
  const sw = await visible(); ok(sw.includes("RG-RES-04") && sw.includes("RG-RES-05"), "text filter 'switch'");
  // item deep link opens drawer
  await ready(page, "#equipements?item=RG-CAM-04");
  await page.waitForSelector('.drawer[data-ref="RG-CAM-04"]');
  // compare
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  await page.check('[data-cmp="RG-RES-01"]'); await page.check('[data-cmp="RG-RES-04"]');
  await page.click("#cmp-open"); await page.waitForSelector(".cmp-table");
  eq(await page.$$eval(".cmp-table thead th", (t) => t.length), 2, "compare two items");
});

/* 4. Quote cart */
await test("quote: add → persists after reload → quantity edit → remove + undo", async (open) => {
  const page = await open();
  await ready(page);
  await page.evaluate(() => { document.querySelector('[data-add-svc="cameras"]').click(); document.querySelector('[data-add-eq="RG-RES-01"]').click(); });
  await page.waitForTimeout(900);
  eq((await page.textContent(".cart-btn [data-count]")).trim(), "2", "count after adding 2 lines");
  await page.reload({ waitUntil: "networkidle" }); await page.waitForTimeout(400);
  eq((await page.textContent(".cart-btn [data-count]")).trim(), "2", "count after reload");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("rg.quote")));
  eq(stored.v, 1, "schema version"); ok(/^DV-\d{8}-\d{3}$/.test(stored.ref), "ref format " + stored.ref);
  await page.keyboard.press("d"); await page.waitForSelector("#quote");
  const line = '#quote .q-line:nth-child(1)';
  await page.click(`${line} [data-qd="1"]`); await page.click(`${line} [data-qd="1"]`);
  await page.waitForTimeout(100);
  eq(await page.evaluate(() => JSON.parse(localStorage.getItem("rg.quote")).lines[0].qty), 3, "qty 3 stored");
  await page.fill(`${line} [data-note]`, "4 caméras extérieures"); await page.waitForTimeout(400);
  eq(await page.evaluate(() => JSON.parse(localStorage.getItem("rg.quote")).lines[0].note), "4 caméras extérieures", "note stored");
  await page.click(`${line} [data-rm-line]`); await page.waitForTimeout(150);
  eq(await page.$$eval("#quote .q-line", (l) => l.length), 1, "one line after remove");
  await page.click(".toast button"); await page.waitForTimeout(200);
  const lines = await page.evaluate(() => JSON.parse(localStorage.getItem("rg.quote")).lines.map((l) => [l.kind, l.key, l.qty]));
  eq(lines, [["service", "cameras", 3], ["equipment", "RG-RES-01", 1]], "undo restores the line in place");
  // send without details → validation; with details → WhatsApp URL
  await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return {}; }; });
  await page.click("#q-wa"); await page.waitForTimeout(150);
  ok(await page.$eval("#qc-name", (i) => i.getAttribute("aria-invalid") === "true"), "name required");
  await page.fill("#qc-name", "Youssef A."); await page.fill("#qc-phone", "0612345678");
  await page.click("#q-wa"); await page.waitForTimeout(1600);
  const u = await page.evaluate(() => window.__opened[0]);
  ok(u && u.startsWith("https://wa.me/212775450796?text="), "WhatsApp URL " + u);
  const msg = decodeURIComponent(u.split("text=")[1]);
  ok(msg.includes("1. Service — Caméras de surveillance × 3") && msg.includes("Note : 4 caméras extérieures") && msg.includes("Nom : Youssef A."), "message body:\n" + msg);
  // pack adds one line listing its services
  await page.keyboard.press("Escape");
  await page.click('[data-add-pack="cafe"]'); await page.waitForTimeout(300);
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem("rg.quote")).lines.some((l) => l.kind === "pack" && l.key === "cafe")), "pack line");
});

/* 5. WhatsApp message builder — exact fixtures in FR and EN */
await test("WhatsApp builder output matches fixtures exactly (FR + EN), URL-encoded correctly", async (open) => {
  const page = await open();
  await ready(page);
  const input = {
    lines: [{ kind: "service", key: "cameras", qty: 1, note: "4 caméras extérieures, vision nocturne" }, { kind: "equipment", key: "RG-WIF-01", qty: 3, note: "" }, { kind: "pack", key: "cafe", qty: 1, note: "" }, { kind: "other", key: "ups", qty: 2, note: "" }],
    client: { name: "Salma El Idrissi", phone: "06 12 34 56 78", city: "Fès", type: "cafe", date: "2026-11-15", message: "Accès possible après 15 h." },
    ref: "DV-20261029-042"
  };
  const FR = `*Demande de devis — RG Secure Solutions*
Réf. : DV-20261029-042
Date : 29/10/2026

*Éléments demandés*
1. Service — Caméras de surveillance × 1
   Note : 4 caméras extérieures, vision nocturne
2. Équipement — Point d'accès Wi-Fi plafond (RG-WIF-01) × 3
3. Pack — Café & restaurant — Wi-Fi & hotspot, Caméras, Sonorisation, Systèmes de caisse, Affichage & multimédia × 1
4. Autre solution — UPS & énergie × 2

*Client*
Nom : Salma El Idrissi
Téléphone : 06 12 34 56 78
Ville : Fès
Type de lieu : Café & restaurant
Date souhaitée : 15/11/2026
Message : Accès possible après 15 h.

Envoyé depuis le site RG Secure Solutions.`;
  const EN = `*Quote request — RG Secure Solutions*
Ref.: DV-20261029-042
Date: 29/10/2026

*Requested items*
1. Service — CCTV cameras × 1
   Note: 4 caméras extérieures, vision nocturne
2. Equipment — Ceiling Wi-Fi access point (RG-WIF-01) × 3
3. Bundle — Café & restaurant — Wi-Fi & hotspot, CCTV cameras, Sound systems, POS systems, Displays & multimedia × 1
4. Other solution — UPS & power × 2

*Client*
Name: Salma El Idrissi
Phone: 06 12 34 56 78
City: Fès
Type of premises: Café & restaurant
Preferred date: 15/11/2026
Message: Accès possible après 15 h.

Sent from the RG Secure Solutions website.`;
  const out = await page.evaluate((inp) => ["fr", "en"].map((lang) => window.RG.buildQuoteMessage({ ...inp, lang, date: new Date(2026, 9, 29) })), input);
  eq(out[0], FR, "FR quote message");
  eq(out[1], EN, "EN quote message");
  const link = await page.evaluate((m) => window.RG.waLink(m), FR);
  ok(link.startsWith("https://wa.me/212775450796?text="), "wa.me number");
  const enc = link.split("text=")[1];
  ok(!/[\séÉ—&?#=+]/.test(enc) && /^[A-Za-z0-9\-_.!~*'()%]+$/.test(enc), "only unreserved characters / percent-escapes in the encoded text");
  ok(enc.includes("R%C3%A9f.") && enc.includes("%0A") && enc.includes("%26"), "accents, newlines and & are percent-encoded");
  eq(decodeURIComponent(enc), FR, "round-trip decode");
  // inspection message
  const insp = await page.evaluate(() => ["fr", "en"].map((l) => window.RG.buildInspectionMessage({ place: "commerce", size: "1", services: ["cameras", "alarme"], name: "Karim B.", phone: "+212 6 61 23 45 67", city: "Tanger", day: "2026-11-03", slot: "0", message: "" }, l)));
  eq(insp[0], `*Inspection technique gratuite — demande*

Type de lieu : Commerce
Surface : 100 à 300 m²
Services : Caméras de surveillance, Systèmes d'alarme

Nom : Karim B.
Téléphone : +212 6 61 23 45 67
Ville : Tanger
Jour souhaité : 03/11/2026
Créneau : Matin (9 h – 12 h)

Envoyé depuis le site RG Secure Solutions.`, "FR inspection message");
  eq(insp[1], `*Free site survey — request*

Type of premises: Shop
Size: 100 to 300 m²
Services: CCTV cameras, Alarm systems

Name: Karim B.
Phone: +212 6 61 23 45 67
City: Tanger
Preferred day: 03/11/2026
Time slot: Morning (9 am – 12 pm)

Sent from the RG Secure Solutions website.`, "EN inspection message");
});

/* 6. Inspection form validation */
await test("inspection form: step validation, Moroccan phone check, stamp + WhatsApp", async (open) => {
  const page = await open();
  await ready(page, "#inspection");
  const v = await page.evaluate(() => ["0612345678", "07 75 45 07 96", "05.22.33.44.55", "+212 6 12 34 56 78", "00212712345678", "0812345678", "061234567", "+33612345678", "+2128123456789", "abc"].map((p) => window.RG.validPhone(p)));
  eq(v, [true, true, true, true, true, false, false, false, false, false], "validPhone cases");
  await page.click("#insp-next");
  ok((await page.textContent("#err-place")).includes("type de lieu"), "place required");
  await page.check('input[name="place"][value="commerce"]');
  await page.click("#insp-next");
  ok(await page.isVisible('[data-step="2"]'), "step 2 visible");
  await page.click("#insp-next");
  ok((await page.textContent("#err-services")).includes("au moins un service"), "services required");
  await page.check('input[name="services"][value="cameras"]');
  await page.click("#insp-next");
  await page.fill("#i-name", "Karim B."); await page.fill("#i-phone", "12345"); await page.fill("#i-city", "Tanger");
  await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return {}; }; });
  await page.click("#insp-submit");
  ok((await page.textContent("#i-phone-err")).includes("invalide"), "bad phone rejected");
  ok(await page.$eval("#i-phone", (i) => i.getAttribute("aria-invalid") === "true" && document.activeElement === i), "focus moves to the invalid field");
  await page.fill("#i-phone", "06 61 23 45 67");
  await page.click("#insp-submit");
  await page.waitForSelector("#insp-stamp.is-on", { timeout: 1500 });
  await page.waitForSelector("#insp-success:not([hidden])", { timeout: 3000 });
  const u = await page.evaluate(() => window.__opened[0]);
  const msg = decodeURIComponent(u.split("text=")[1]);
  ok(msg.includes("Type de lieu : Commerce") && msg.includes("Services : Caméras de surveillance"), "message content");
  ok((await page.getAttribute("#insp-mail", "href")).startsWith("mailto:RGsecuresolutions@gmail.com?subject="), "mailto fallback");
  // pre-fill from a service sheet
  await ready(page, "#service/alarme");
  await page.click('#sheet [data-action="inspect"]'); await page.waitForTimeout(500);
  ok(await page.isChecked('input[name="services"][value="alarme"]'), "Inspection gratuite pre-fills the service");
});

/* 7. Catalogue viewer */
await test("catalogue viewer opens at the service's page; keys, thumbnails, zoom", async (open) => {
  const page = await open();
  await ready(page, "#service/sonorisation");
  await page.click("#sheet [data-open-viewer]");
  await page.waitForSelector(".viewer");
  eq((await page.textContent("#v-count")).trim(), "Page 10 / 15", "opens at page 10");
  ok((await page.getAttribute("#v-img", "src")).endsWith("page-10.webp"), "image page-10");
  await page.keyboard.press("ArrowRight"); await page.waitForTimeout(800);
  eq((await page.textContent("#v-count")).trim(), "Page 11 / 15", "→ next page");
  await page.click('.v-thumbs [data-page="2"]'); await page.waitForTimeout(800);
  eq((await page.textContent("#v-count")).trim(), "Page 02 / 15", "thumbnail");
  await page.click("#v-zoom");
  ok((await page.getAttribute("#v-zoom", "aria-pressed")) === "true", "zoom on");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  ok(!(await page.$(".viewer")), "Escape closes the viewer");
  ok(await page.$("#sheet"), "sheet still open under the viewer");
  // deep link
  await ready(page, "#catalogue?page=7");
  await page.waitForSelector(".viewer");
  eq((await page.textContent("#v-count")).trim(), "Page 07 / 15", "#catalogue?page=7");
});

/* 8. Language switch */
function keyShape(o, p = "") {
  if (Array.isArray(o)) return o.flatMap((v, i) => keyShape(v, `${p}[${i}]`));
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => keyShape(v, p ? `${p}.${k}` : k));
  return [p];
}
await test("FR ↔ EN: every visible string, <html lang>, meta tags; keeps the open sheet and cart; ?lang=en; no EN key missing", async (open) => {
  const page = await open();
  await ready(page);
  const { fr, en } = await page.evaluate(() => ({ fr: window.RG.I18N.fr, en: window.RG.I18N.en }));
  const fk = keyShape(fr), ek = new Set(keyShape(en));
  const missing = fk.filter((k) => !ek.has(k));
  eq(missing, [], "EN keys missing");
  const extra = [...ek].filter((k) => !fk.includes(k)); eq(extra, [], "EN keys not in FR");
  await page.evaluate(() => document.querySelector('[data-add-svc="wifi-hotspot"]').click()); await page.waitForTimeout(800);
  await page.evaluate(() => { location.hash = "service/cameras"; }); await page.waitForSelector("#sheet");
  await page.evaluate(() => window.RG.setLang("en"));
  await page.waitForTimeout(500);
  eq(await page.getAttribute("html", "lang"), "en", "html lang");
  eq(await page.title(), en.meta.title, "title");
  eq(await page.getAttribute('meta[name="description"]', "content"), en.meta.description, "meta description");
  eq(await page.getAttribute('meta[property="og:locale"]', "content"), "en_GB", "og:locale");
  eq(await page.getAttribute('meta[property="og:title"]', "content"), en.meta.ogTitle, "og:title");
  ok((await page.textContent("#ld-business")).includes('"inLanguage":"en"'), "JSON-LD updated");
  eq((await page.textContent("#sheet-title")).trim(), "CCTV cameras", "open sheet translated in place");
  ok(page.url().endsWith("#service/cameras"), "sheet still open / hash kept");
  eq((await page.textContent(".cart-btn [data-count]")).trim(), "1", "cart kept");
  // Every [data-i18n] node shows the EN value
  const wrong = await page.evaluate(() => [...document.querySelectorAll("[data-i18n]")].filter((el) => {
    const vars = el.dataset.i18nVars ? JSON.parse(el.dataset.i18nVars) : undefined;
    return el.textContent !== window.RG.t(el.dataset.i18n, vars, "en");
  }).map((el) => el.dataset.i18n));
  eq(wrong, [], "[data-i18n] nodes not in English");
  // No visible French-only UI text left: sample of FR strings that differ in EN must not be visible
  const leftovers = await page.evaluate(() => {
    const frOnly = ["Voir nos services", "Inspection technique gratuite", "Prix sur devis", "Mon devis", "Nos prestations", "Questions fréquentes", "Parlons de votre projet !", "Tout effacer"];
    const body = document.body.innerText;
    return frOnly.filter((s) => body.includes(s));
  });
  eq(leftovers, [], "French strings still visible in EN");
  await page.keyboard.press("Escape");
  // ?lang=en
  const p2 = await open();
  await ready(p2, "?lang=en");
  eq(await p2.getAttribute("html", "lang"), "en", "?lang=en → html lang");
  eq((await p2.textContent("#hero-title")).trim(), en.hero.h1, "?lang=en → English H1");
  const p3 = await open({ locale: "en-GB" });
  await ready(p3);
  eq(await p3.getAttribute("html", "lang"), "en", "browser language en → EN");
  await ready(p3, "?lang=fr");
  eq(await p3.getAttribute("html", "lang"), "fr", "?lang=fr overrides");
  // hreflang
  eq(await p3.$$eval('link[rel="alternate"][hreflang]', (l) => l.map((x) => x.hreflang)), ["fr", "en", "x-default"], "hreflang links");
});

/* 9. Motion settings */
await test("Motion Off disables pinning, Lenis and the intro; Reduced too; prefers-reduced-motion respected", async (open) => {
  for (const motion of ["off", "reduced"]) {
    const page = await open({ storage: { "rg.settings": JSON.stringify({ motion }) } });
    await ready(page);
    await page.waitForTimeout(600);
    eq(await page.getAttribute("html", "data-motion"), motion, "data-motion");
    ok(!(await page.$eval("html", (h) => h.classList.contains("lenis"))), `${motion}: no Lenis`);
    ok(!(await page.$eval("html", (h) => h.classList.contains("is-intro"))), `${motion}: no intro`);
    ok(!(await page.$eval("#services", (s) => s.classList.contains("is-pinnable"))), `${motion}: no pinning`);
    ok(!(await page.$(".pin-spacer")), `${motion}: no pin spacer`);
  }
  const rm = await open({ reducedMotion: "reduce", storage: {} });
  await ready(rm);
  eq(await rm.getAttribute("html", "data-motion"), "reduced", "prefers-reduced-motion → reduced");
  // Full: everything on, then switch to Off live from the settings popover
  const full = await open();
  await ready(full); await full.waitForTimeout(800);
  ok(await full.$eval("html", (h) => h.classList.contains("lenis")), "full: Lenis on");
  ok(await full.$eval("#services", (s) => s.classList.contains("is-pinnable")), "full: services pinned");
  await full.click("#settings-btn"); await full.click('#settings-pop [data-set="motion"][data-v="off"]'); await full.waitForTimeout(300);
  ok(!(await full.$eval("html", (h) => h.classList.contains("lenis"))) && !(await full.$(".pin-spacer")), "switching to Off tears down Lenis + pin");
});

/* 10. Intro once per session */
await test("intro plays once per session (< 1.4 s) and is skippable", async (open) => {
  const page = await open({ storage: {} });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  ok(await page.$eval("html", (h) => h.classList.contains("is-intro")), "intro on first visit");
  await page.waitForFunction(() => !document.documentElement.classList.contains("is-intro"), null, { timeout: 1400 });
  await page.reload({ waitUntil: "domcontentloaded" });
  ok(!(await page.$eval("html", (h) => h.classList.contains("is-intro"))), "no intro on reload");
  const p2 = await open({ storage: {} });
  await p2.goto(url, { waitUntil: "domcontentloaded" });
  await p2.waitForTimeout(150); await p2.keyboard.press("Escape");
  await p2.waitForFunction(() => !document.documentElement.classList.contains("is-intro"), null, { timeout: 600 });
});

/* 11. Réalisations / Avis */
await test("Réalisations and Avis stay hidden while their arrays are empty", async (open) => {
  const page = await open();
  await ready(page);
  eq(await page.evaluate(() => [window.RG.REALISATIONS.length, window.RG.AVIS.length]), [0, 0], "arrays empty");
  ok(await page.$eval("#realisations", (s) => s.hidden && !s.innerHTML.trim()), "réalisations hidden");
  ok(await page.$eval("#avis", (s) => s.hidden && !s.innerHTML.trim()), "avis hidden");
});

/* 12. Empty CONFIG values hide their UI */
await test("empty CONFIG values (city, hours, Facebook) hide their UI; no map without city", async (open) => {
  const page = await open();
  await ready(page);
  ok(!(await page.$("#map-box")), "no map");
  ok(!(await page.$('.c-card a[href*="facebook"]')), "no Facebook card");
  const body = await page.evaluate(() => document.body.innerText);
  ok(!/undefined|null|\{\w+\}/.test(body), "no undefined/null/{placeholder} in the page text");
});

/* 13. Layout: no horizontal overflow, EN text fits buttons/headings */
await test("no horizontal overflow at 320–1920 px; EN text does not overflow buttons or headings", async (open) => {
  for (const w of [320, 375, 390, 768, 820, 1024, 1199, 1200, 1280, 1440, 1920]) {
    for (const lang of ["fr", "en"]) {
      const page = await open({ viewport: { width: w, height: 900 } });
      await ready(page, `?lang=${lang}`);
      const r = await page.evaluate(() => {
        const W = document.documentElement.clientWidth;
        const over = document.documentElement.scrollWidth > W + 1;
        const bad = [...document.querySelectorAll(".btn, .chip, h1, h2, h3, .ptog, .nav a")].filter((el) => {
          if (!el.offsetParent || el.closest(".marquee, .svc-track, .sr-only") || el.classList.contains("sr-only")) return false;
          const cs = getComputedStyle(el);
          return el.scrollWidth > el.clientWidth + 2 && cs.overflow !== "visible" ? true : el.getBoundingClientRect().right > W + 1 && !el.closest(".plan-toggles, .ct-tabs, .recent-row, .v-thumbs");
        }).map((el) => (el.className || el.tagName) + ": " + el.textContent.trim().slice(0, 30));
        return { over, bad };
      });
      ok(!r.over, `${w}px ${lang}: horizontal overflow`);
      eq(r.bad, [], `${w}px ${lang}: overflowing elements`);
    }
  }
});

/* 14. Accessibility basics + JSON-LD */
await test("one H1, labelled controls, dialogs trap focus, JSON-LD valid", async (open) => {
  const page = await open();
  await ready(page);
  eq(await page.$$eval("h1", (h) => h.length), 1, "exactly one h1");
  const unlabelled = await page.evaluate(() => [...document.querySelectorAll("button, a[href], input:not([type=hidden]), select, textarea")].filter((el) => {
    if (!el.offsetParent && el.type !== "checkbox" && el.type !== "radio") return false;
    const name = (el.getAttribute("aria-label") || el.textContent || el.title || el.getAttribute("placeholder") || "").trim();
    const lab = el.id && document.querySelector(`label[for="${el.id}"]`);
    return !name && !lab && !el.closest("label") && !el.getAttribute("aria-labelledby");
  }).map((el) => el.outerHTML.slice(0, 80)));
  eq(unlabelled, [], "controls without accessible name");
  const ld = await page.evaluate(() => [JSON.parse(document.getElementById("ld-business").textContent), JSON.parse(document.getElementById("ld-faq").textContent)]);
  eq(ld[0]["@type"], "LocalBusiness", "LocalBusiness"); eq(ld[0].hasOfferCatalog.itemListElement.length, 13, "OfferCatalog with 13 services");
  eq(ld[0].telephone, "+212775450796", "telephone"); ok(ld[0].sameAs.length === 2, "sameAs (instagram, tiktok)");
  eq(ld[1]["@type"], "FAQPage", "FAQPage"); ok(ld[1].mainEntity.length >= 10, "≥ 10 FAQ");
  // focus trap in quote panel
  await page.keyboard.press("d"); await page.waitForSelector("#quote");
  for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
  ok(await page.evaluate(() => document.getElementById("quote").contains(document.activeElement)), "focus trapped in quote panel");
  await page.keyboard.press("Escape"); await page.waitForTimeout(600);
  ok(await page.evaluate(() => !document.getElementById("quote")), "quote closed by Escape");
  // shortcuts overlay
  await page.keyboard.press("?"); await page.waitForSelector("#kbd");
  // mega menu keyboard
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  await page.focus("#mm-btn"); await page.keyboard.press("ArrowDown"); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.activeElement.classList.contains("mm-item")), "ArrowDown enters mega menu");
  // FAQ accordion
  await page.click("#faq-b-0");
  eq(await page.getAttribute("#faq-b-0", "aria-expanded"), "true", "accordion opens");
  await page.fill("#faq-q", "NVR"); await page.waitForTimeout(250);
  eq(await page.$$eval(".acc-item:not([hidden])", (i) => i.length), 1, "FAQ search filters");
});

/* 15. Plan toggles */
await test("hero floor plan: toggles light up equipment and update the caption link", async (open) => {
  const page = await open();
  await ready(page); await page.waitForTimeout(400);
  for (const [k, slug] of [["alarme", "alarme"], ["reseau", "wifi-hotspot"], ["portail", "portails"], ["sono", "sonorisation"], ["domotique", "domotique"]]) {
    await page.click(`.ptog[data-k="${k}"]`);
    ok(await page.$eval(`#plan [data-g="${k}"]`, (g) => g.classList.contains("on")), `${k}: group on`);
    eq(await page.getAttribute("#plan-link", "href"), "#service/" + slug, `${k}: caption link`);
  }
  await page.click('#plan-link'); await page.waitForSelector("#sheet");
  eq((await page.textContent("#sheet-title")).trim(), "Domotique", "Voir le service opens the sheet");
});

/* 16. axe-core: WCAG 2.x A/AA in light and dark, with dialogs open */
await test("axe-core: no WCAG A/AA violations (light + dark; sheet, drawer, quote, viewer open)", async (open) => {
  const AXE = fs.readFileSync(ROOT + "/node_modules/axe-core/axe.min.js", "utf8");
  const run = async (page, label) => {
    await page.addStyleTag({ content: "* { content-visibility: visible !important; }" }); // rendering optimisation only
    await page.addScriptTag({ content: AXE });
    const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] })).violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ") + " — " + (n.failureSummary || "").split("\n")[1]).join(" | ")}`));
    eq(res, [], label);
  };
  for (const colorScheme of ["light", "dark"]) {
    for (const [q, act] of [["", null], ["#service/cameras", null], ["#equipements?item=RG-CAM-01", null], ["", async (p) => { await p.keyboard.press("d"); await p.waitForSelector("#quote"); }], ["#catalogue?page=4", null]]) {
      const page = await open({ colorScheme, viewport: { width: 1280, height: 900 } });
      await ready(page, q); await page.waitForTimeout(500);
      if (act) await act(page);
      await page.waitForTimeout(500);
      await run(page, `${colorScheme} ${q || "home"}${act ? " + quote" : ""}`);
    }
  }
  const phone = await open({ viewport: { width: 390, height: 844 } });
  await ready(phone, "?lang=en"); await run(phone, "phone EN");
});

const failed = results.filter((r) => !r[0]);
console.log(`\n${results.length - failed.length}/${results.length} passed${failed.length ? ` — ${failed.length} failed` : ""}\n`);
await browser.close(); srv.close();
process.exit(failed.length ? 1 : 0);
