// Device screenshots: phone FR/EN, tablet, desktop dark
import { serve, newBrowser, newPage, noIntro, ROOT } from "./helpers.mjs";
const OUT = ROOT + "/tests/screenshots";
const { srv, url } = await serve();
const browser = await newBrowser();
const errors = [];
const go = async (name, opts, q = "", act) => {
  const { page, ctx } = await newPage(browser, { storage: noIntro, errors, ...opts });
  await page.goto(url + q, { waitUntil: "networkidle" }); await page.mouse.move(3, 3); await page.waitForTimeout(2200);
  if (act) await act(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
};
await go("phone-fr", { viewport: { width: 390, height: 844 } });
await go("phone-en", { viewport: { width: 390, height: 844 } }, "?lang=en");
await go("phone-en-services", { viewport: { width: 390, height: 844 } }, "?lang=en", (p) => p.evaluate(() => document.getElementById("services").scrollIntoView()).then(() => p.waitForTimeout(900)));
await go("phone-menu", { viewport: { width: 390, height: 844 } }, "", (p) => p.click('#bottom-bar [data-action="menu"]').then(() => p.waitForTimeout(500)));
await go("tablet", { viewport: { width: 820, height: 1180 } });
await go("tablet-eq", { viewport: { width: 820, height: 1180 } }, "#equipements");
await go("desktop-light", { viewport: { width: 1440, height: 900 } });
await go("desktop-dark", { viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
await go("desktop-dark-sheet", { viewport: { width: 1440, height: 900 }, colorScheme: "dark" }, "#service/wifi-hotspot");
console.log("errors:", errors);
await browser.close(); srv.close();
