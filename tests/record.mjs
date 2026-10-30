// Short recordings of the signature animations → tests/recordings/*.webm
import fs from "node:fs";
import path from "node:path";
import { serve, newBrowser, ROOT } from "./helpers.mjs";
import * as H from "./helpers.mjs";
const OUT = ROOT + "/tests/recordings"; fs.mkdirSync(OUT, { recursive: true });
const { srv, url } = await serve();
const browser = await newBrowser();
async function rec(name, storage, fn, viewport = { width: 1280, height: 800 }) {
  const ctx = await browser.newContext({ viewport, recordVideo: { dir: OUT, size: viewport } });
  // reuse the CDN/font mapping from helpers
  const tmp = await H.newPage(browser, {}); await tmp.ctx.close();
  await ctx.route(/cdn\.jsdelivr\.net/, (route) => {
    const u = route.request().url(); const m = u.match(/npm\/(gsap@3\.13\.0|lenis@1\.3\.11)\/dist\/(.+)$/);
    return m ? route.fulfill({ path: path.join(ROOT, "node_modules", m[1].split("@")[0], "dist", m[2]), contentType: "text/javascript" }) : route.abort();
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => { const f = path.join(ROOT, "tests/.cache", (awaitHash(r.request().url()))); return fs.existsSync(f) ? r.fulfill({ path: f, contentType: r.request().url().includes("googleapis") ? "text/css" : "font/woff2" }) : r.fulfill({ body: "", contentType: "text/css" }); });
  await ctx.route(/wa\.me/, (r) => r.fulfill({ body: "<title>wa</title>", contentType: "text/html" }));
  if (storage) await ctx.addInitScript((s) => { for (const [k, v] of Object.entries(s)) k.startsWith("session:") ? sessionStorage.setItem(k.slice(8), v) : localStorage.setItem(k, v); }, storage);
  const page = await ctx.newPage();
  await fn(page);
  const v = page.video(); await ctx.close();
  fs.renameSync(await v.path(), `${OUT}/${name}.webm`);
  console.log("recorded", name);
}
import crypto from "node:crypto";
function awaitHash(u) { return crypto.createHash("md5").update(u).digest("hex"); }
const NI = { "session:rg.intro": "1" };
await rec("1-intro", null, async (p) => { await p.goto(url); await p.waitForTimeout(3200); });
await rec("2-plan-toggles", NI, async (p) => { await p.goto(url); await p.waitForTimeout(2600); for (const k of ["alarme", "reseau", "portail", "sono", "domotique", "acces", "interphone"]) { await p.click(`.ptog[data-k="${k}"]`); await p.waitForTimeout(1300); } });
await rec("3-services-pinned", NI, async (p) => { await p.goto(url); await p.waitForTimeout(1500); for (let i = 0; i < 70; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(60); } await p.waitForTimeout(800); });
await rec("4-sheet-morph", NI, async (p) => { await p.goto(url + "#services"); await p.waitForTimeout(1800); await p.mouse.wheel(0, 300); await p.waitForTimeout(800); await p.click(".svc-panel.is-active .sp-img img", { force: true }).catch(() => p.evaluate(() => document.querySelector(".svc-panel .btn").click())); await p.waitForTimeout(1800); await p.keyboard.press("ArrowRight"); await p.waitForTimeout(1200); });
await rec("5-add-to-quote", NI, async (p) => { await p.goto(url + "#equipements"); await p.waitForTimeout(2200); await p.click('[data-add-eq="RG-RES-04"]'); await p.waitForTimeout(1200); await p.click('[data-add-eq="RG-RES-01"]'); await p.waitForTimeout(1200); await p.evaluate(() => document.getElementById("solutions").scrollIntoView()); await p.waitForTimeout(900); await p.click('[data-add-pack="cafe"]'); await p.waitForTimeout(1600); await p.click(".cart-btn"); await p.waitForTimeout(1000); await p.fill("#qc-name", "Test"); await p.fill("#qc-phone", "0612345678"); await p.evaluate(() => { window.open = () => ({}); }); await p.click("#q-wa"); await p.waitForTimeout(1500); });
await rec("6-flipbook", NI, async (p) => { await p.goto(url + "#catalogue"); await p.waitForTimeout(1800); await p.click(".cover3d button"); await p.waitForTimeout(900); for (let i = 0; i < 4; i++) { await p.keyboard.press("ArrowRight"); await p.waitForTimeout(900); } await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(900); await p.click("#v-zoom"); await p.waitForTimeout(900); });
await browser.close(); srv.close();
