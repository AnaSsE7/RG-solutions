// Renders the quote print view (RG letterhead) to tests/screenshots/quote-print.pdf
import { serve, newBrowser, newPage, noIntro, ROOT } from "./helpers.mjs";
const { srv, url } = await serve();
const browser = await newBrowser();
const storage = { ...noIntro, "rg.quote": JSON.stringify({ v: 1, ref: "DV-20261029-042", client: { name: "Salma El Idrissi", phone: "06 12 34 56 78", city: "Fès", type: "cafe", date: "2026-11-15", message: "Accès possible après 15 h." }, lines: [
  { id: "a", kind: "service", key: "cameras", qty: 1, note: "4 caméras extérieures" }, { id: "b", kind: "equipment", key: "RG-WIF-01", qty: 3, note: "" },
  { id: "c", kind: "pack", key: "cafe", qty: 1, note: "" }, { id: "d", kind: "other", key: "ups", qty: 1, note: "" }] }) };
const { page } = await newPage(browser, { storage });
await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(800);
await page.evaluate(() => { window.print = () => {}; });
await page.keyboard.press("d"); await page.waitForSelector("#q-print");
await page.click("#q-print"); await page.waitForTimeout(500);
await page.emulateMedia({ media: "print" });
await page.pdf({ path: ROOT + "/tests/screenshots/quote-print.pdf", format: "A4", printBackground: true });
await page.screenshot({ path: ROOT + "/tests/screenshots/quote-print.png", fullPage: true });
console.log("ok"); await browser.close(); srv.close();
