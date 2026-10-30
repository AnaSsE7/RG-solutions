import { serve, newBrowser, newPage, noIntro } from "./helpers.mjs";
const { srv, url } = await serve();
const browser = await newBrowser();
for (const w of [320]) {
  const { page } = await newPage(browser, { storage: noIntro, viewport: { width: w, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth, out = [];
    for (const el of document.querySelectorAll("body *")) {
      const b = el.getBoundingClientRect();
      if (b.right > W + 1 && b.width > 0 && !el.closest(".marquee, .plan-toggles, .ct-tabs")) out.push([el.tagName + "." + [...el.classList].join("."), Math.round(b.right)]);
    }
    return { W, sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, out: out.slice(0, 12) };
  });
  console.log(w, JSON.stringify(r));
}
await browser.close(); srv.close();
