// Visual tour: viewport screenshots of key states → tests/screenshots/tour-*.png
import { serve, newBrowser, newPage, noIntro, ROOT } from "./helpers.mjs";
import fs from "node:fs";
const OUT = ROOT + "/tests/screenshots"; fs.mkdirSync(OUT, { recursive: true });
const { srv, url } = await serve();
const browser = await newBrowser();
const errors = [];
const { page } = await newPage(browser, { storage: noIntro, errors });
const shot = (n) => page.screenshot({ path: `${OUT}/tour-${n}.png` });
await page.goto(url, { waitUntil: "networkidle" }); await page.mouse.move(3, 3); await page.waitForTimeout(2600);
// pinned services, mid scroll
const st = await page.evaluate(() => { const s = document.querySelector(".svc-pin").getBoundingClientRect().top + scrollY; return s; });
await page.evaluate((y) => window.scrollTo(0, y + 1600), st); await page.waitForTimeout(1500); await shot("services-pinned");
// mega menu
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
await page.click("#mm-btn"); await page.waitForTimeout(500); await shot("mega"); await page.keyboard.press("Escape");
// sheet
await page.evaluate(() => { location.hash = "service/cameras"; }); await page.waitForTimeout(1500); await shot("sheet");
await page.evaluate(() => document.querySelector(".sheet-body").scrollTo(0, 700)); await page.waitForTimeout(500); await shot("sheet-blocks");
await page.keyboard.press("Escape"); await page.waitForTimeout(400);
// equipment drawer + add
await page.evaluate(() => { location.hash = "equipements?service=cameras&usage=commerce"; }); await page.waitForTimeout(1500); await shot("catalog-filtered");
await page.click('[data-open-eq="RG-CAM-01"]'); await page.waitForTimeout(800); await shot("drawer");
await page.click("#eqd-add"); await page.waitForTimeout(900); await page.keyboard.press("Escape"); await page.waitForTimeout(400);
// quote
await page.click('.cart-btn'); await page.waitForTimeout(700); await shot("quote"); await page.keyboard.press("Escape"); await page.waitForTimeout(300);
// search
await page.keyboard.press("/"); await page.waitForTimeout(300); await page.keyboard.type("camera"); await page.waitForTimeout(400); await shot("search"); await page.keyboard.press("Escape");
// viewer
await page.evaluate(() => window.RG.openViewer(4)); await page.waitForTimeout(900); await shot("viewer"); await page.keyboard.press("Escape");
// catalogue + inspection section
await page.evaluate(() => document.getElementById("catalogue").scrollIntoView()); await page.waitForTimeout(1500); await shot("catalogue");
await page.evaluate(() => document.getElementById("contact").scrollIntoView()); await page.waitForTimeout(1200); await shot("contact");
await page.evaluate(() => document.getElementById("footer").scrollIntoView()); await page.waitForTimeout(1200); await shot("footer");
console.log("errors:", errors);
await browser.close(); srv.close();
