// Shared Playwright helpers: local static server + CDN mapping to node_modules
// (the sandbox that built this site had no access to the CDNs; on a normal
// machine the real CDN is used when LIVE_CDN=1).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".pdf": "application/pdf", ".json": "application/json", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };

export function serve(port = 0) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (p.endsWith("/")) p += "index.html";
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
      res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream", "cache-control": "no-cache" });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(port, "127.0.0.1", () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

const CDN = [
  [/cdn\.jsdelivr\.net\/npm\/gsap@3\.13\.0\/dist\/(.+)$/, (m) => `node_modules/gsap/dist/${m[1]}`],
  [/cdn\.jsdelivr\.net\/npm\/lenis@1\.3\.11\/dist\/(.+)$/, (m) => `node_modules/lenis/dist/${m[1]}`]
];
export async function newBrowser() { return chromium.launch(); }
export async function newPage(browser, { viewport = { width: 1440, height: 900 }, colorScheme = "light", reducedMotion = "no-preference", storage = null, locale = "fr-FR", errors = [] } = {}) {
  const ctx = await browser.newContext({ viewport, colorScheme, reducedMotion, locale, deviceScaleFactor: 1, hasTouch: viewport.width < 768, isMobile: viewport.width < 768 });
  if (!process.env.LIVE_CDN) {
    await ctx.route(/cdn\.jsdelivr\.net/, (route) => {
      const u = route.request().url();
      for (const [re, to] of CDN) { const m = u.match(re); if (m) return route.fulfill({ path: path.join(ROOT, to(m)), contentType: "text/javascript" }); }
      return route.abort();
    });
    // Fonts: blocked in the sandbox — the page falls back to system fonts.
    // Google Fonts: fetched with curl (honours the proxy) and cached in tests/.cache
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => {
      const u = r.request().url();
      const dir = path.join(ROOT, "tests/.cache"); fs.mkdirSync(dir, { recursive: true });
      const f = path.join(dir, crypto.createHash("md5").update(u).digest("hex"));
      try {
        if (!fs.existsSync(f)) execFileSync("curl", ["-sSfL", "-A", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/147 Safari/537.36", "-o", f, u]);
        return r.fulfill({ path: f, contentType: u.includes("googleapis") ? "text/css" : "font/woff2" });
      } catch { return r.fulfill({ status: 200, contentType: "text/css", body: "" }); }
    });
  }
  await ctx.route(/wa\.me|maps\.google/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<title>stub</title>" }));
  if (storage) await ctx.addInitScript((s) => { for (const [k, v] of Object.entries(s)) { if (k.startsWith("session:")) sessionStorage.setItem(k.slice(8), v); else localStorage.setItem(k, v); } }, storage);
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  return { ctx, page, errors };
}
export const noIntro = { "session:rg.intro": "1" };
