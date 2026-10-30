// RG Secure Solutions — asset pipeline.
// Run: npm run assets   (needs `sharp`, installed with `npm i`)
//
// Produces, from assets/logo-rg-secure-solutions.jpg and assets/catalogue/page-XX.jpg:
//   assets/logo/logo-full.png, logo-full-white.png, logo-mark.png, logo-mark-white.png,
//   logo-wordmark.png (+ -white), logo-name.png (+ -white)
//   assets/favicon/favicon-32.png, apple-touch-icon.png (180), icon-512.png
//   assets/og-image.jpg (1200×630)
//   assets/services/<slug>.webp (1200w) and <slug>-600.webp
//   assets/catalogue/web/page-XX.webp (viewer) and assets/catalogue/thumbs/page-XX.webp
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const A = (...p) => path.join(ROOT, "assets", ...p);
const SRC_LOGO = A("logo-rg-secure-solutions.jpg");

// ---------------------------------------------------------------------------
// Service cover crops — [left, top, width, height] in catalogue-page pixels
// (pages are 1075×1521). Each one was checked visually; the photo sits in the
// top-right of every page, the title text on the left must stay out of frame.
// ---------------------------------------------------------------------------
export const CROPS = {
  "reseaux":              { page: 2,  box: [600, 0,   470, 352] },
  "wifi-hotspot":         { page: 3,  box: [555, 20,  515, 386] },
  "cameras":              { page: 4,  box: [592, 10,  480, 360] },
  "alarme":               { page: 5,  box: [568, 70,  500, 375] },
  "controle-acces":       { page: 6,  box: [522, 40,  520, 390] },
  "pointeuses":           { page: 7,  box: [545, 112, 500, 375] },
  "interphones":          { page: 8,  box: [575, 40,  495, 371] },
  "affichage-multimedia": { page: 9,  box: [580, 50,  490, 368] },
  "sonorisation":         { page: 10, box: [628, 20,  440, 330] },
  "portails":             { page: 11, box: [540, 0,   520, 390] },
  "domotique":            { page: 12, box: [540, 0,   520, 390] },
  "telephonie-ip":        { page: 13, box: [560, 30,  510, 382] },
  "systemes-caisse":      { page: 14, box: [532, 60,  520, 390] }
};

// Soft threshold on "distance from white" (0 = pure white). Pixels below LO are
// fully transparent, above HI fully opaque; in between the colour is
// un-premultiplied against white so antialiased edges keep the logo's hue
// instead of leaving a light halo.
const LO = 10, HI = 70;

async function rgba(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function knockOutWhite({ data, w, h }) {
  const out = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const d = 255 - Math.min(r, g, b);
    let a = (d - LO) / (HI - LO);
    a = a <= 0 ? 0 : a >= 1 ? 1 : a * a * (3 - 2 * a); // smoothstep
    let R = r, G = g, B = b;
    if (a > 0 && a < 1) {
      const un = (c) => Math.max(0, Math.min(255, Math.round((c - (1 - a) * 255) / a)));
      R = un(r); G = un(g); B = un(b);
    }
    out[i * 4] = R; out[i * 4 + 1] = G; out[i * 4 + 2] = B; out[i * 4 + 3] = Math.round(a * 255);
  }
  return { data: out, w, h };
}

// Drop isolated specks (JPEG dust in the source) — components smaller than `min` px.
function despeckle(img, min = 60) {
  const { data, w, h } = img, seen = new Uint8Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (seen[s] || data[s * 4 + 3] < 8) continue;
    const stack = [s], comp = []; seen[s] = 1;
    while (stack.length) {
      const p = stack.pop(); comp.push(p);
      const x = p % w, y = (p / w) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (!seen[q] && data[q * 4 + 3] >= 8) { seen[q] = 1; stack.push(q); }
      }
    }
    if (comp.length < min) for (const p of comp) data[p * 4 + 3] = 0;
  }
  return img;
}

function whiten({ data, w, h }) {
  const out = Buffer.from(data);
  for (let i = 0; i < w * h; i++) { out[i * 4] = 255; out[i * 4 + 1] = 255; out[i * 4 + 2] = 255; }
  return { data: out, w, h };
}

// Bounding box of non-transparent pixels inside a region.
function bbox({ data, w }, x0, y0, x1, y1, minA = 24) {
  let L = x1, T = y1, R = x0, B = y0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    if (data[(y * w + x) * 4 + 3] > minA) { if (x < L) L = x; if (x > R) R = x; if (y < T) T = y; if (y > B) B = y; }
  }
  return { left: L, top: T, width: R - L + 1, height: B - T + 1 };
}

const toSharp = ({ data, w, h }) => sharp(data, { raw: { width: w, height: h, channels: 4 } });
const pad = (box, p, W, H) => {
  const left = Math.max(0, box.left - p), top = Math.max(0, box.top - p);
  return { left, top, width: Math.min(W - left, box.width + 2 * p), height: Math.min(H - top, box.height + 2 * p) };
};

async function logos() {
  await fs.mkdir(A("logo"), { recursive: true });
  await fs.mkdir(A("favicon"), { recursive: true });
  const src = await rgba(SRC_LOGO);
  const clear = despeckle(knockOutWhite(src));
  const white = whiten(clear);
  const { w, h } = clear;

  // Regions in the 1334×1336 source: monogram above y≈820, name y≈860–980, tagline y≈990–1070.
  const full = pad(bbox(clear, 0, 0, w, h), 8, w, h);
  const mark = pad(bbox(clear, 0, 0, w, 830), 6, w, h);
  const name = pad(bbox(clear, 0, 840, w, 985), 6, w, h);
  const word = pad(bbox(clear, 0, 840, w, h), 6, w, h);

  const variants = [
    ["logo-full", full, 1000], ["logo-mark", mark, 512], ["logo-name", name, 900], ["logo-wordmark", word, 900]
  ];
  for (const [base, box, width] of variants) {
    await toSharp(clear).extract(box).resize({ width: Math.min(width, box.width) }).png({ compressionLevel: 9, palette: false }).toFile(A("logo", base + ".png"));
    await toSharp(white).extract(box).resize({ width: Math.min(width, box.width) }).png({ compressionLevel: 9 }).toFile(A("logo", base + "-white.png"));
  }
  // Light WebP variants actually used by the page (PNG masters above stay for print / owner use).
  const web = [["logo-mark", mark, { height: 112 }], ["logo-mark", mark, { height: 240 }, "-240"], ["logo-name", name, { height: 44 }],
    ["logo-wordmark", word, { height: 72 }], ["logo-full", full, { width: 480 }]];
  for (const [base, box, size, suffix = ""] of web) {
    for (const [img, tag] of [[clear, ""], [white, "-white"]]) {
      await toSharp(img).extract(box).resize(size).webp({ quality: 90, alphaQuality: 100 }).toFile(A("logo", `${base}${tag}${suffix}.webp`));
    }
  }
  // Fallback plate (original JPG pixels, used only if a halo shows up).
  await sharp(SRC_LOGO).extract(full).resize({ width: 600 }).webp({ quality: 88 }).toFile(A("logo", "logo-full-plate.webp"));

  // Favicons from the mark — square canvas, mark centred.
  const markBuf = await toSharp(clear).extract(mark).png().toBuffer();
  const square = async (size, padRatio, bg) => {
    const inner = Math.round(size * (1 - padRatio * 2));
    const m = await sharp(markBuf).resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: bg } }).composite([{ input: m, gravity: "center" }]).png();
  };
  const T = { r: 0, g: 0, b: 0, alpha: 0 }, W = { r: 255, g: 255, b: 255, alpha: 1 };
  await (await square(32, 0.02, T)).toFile(A("favicon", "favicon-32.png"));
  await (await square(180, 0.14, W)).toFile(A("favicon", "apple-touch-icon.png"));
  await (await square(512, 0.1, T)).toFile(A("favicon", "icon-512.png"));
  await (await square(192, 0.12, W)).toFile(A("favicon", "icon-192.png"));

  // OG image: white logo on navy with a faint blueprint grid and one thin accent line.
  const grid = [];
  for (let x = 0; x <= 1200; x += 40) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="630" stroke="#ffffff" stroke-opacity="${x % 200 ? 0.04 : 0.08}"/>`);
  for (let y = 0; y <= 630; y += 40) grid.push(`<line x1="0" y1="${y}" x2="1200" y2="${y}" stroke="#ffffff" stroke-opacity="${y % 200 ? 0.04 : 0.08}"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#1B2F5E"/>${grid.join("")}
    <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#0A5BB5"/><stop offset="1" stop-color="#36AEE5"/></linearGradient></defs>
    <rect x="0" y="622" width="1200" height="8" fill="url(#g)"/></svg>`;
  const logoW = await toSharp(white).extract(full).resize({ height: 430 }).png().toBuffer();
  await sharp(Buffer.from(svg)).composite([{ input: logoW, gravity: "center" }]).jpeg({ quality: 86, mozjpeg: true }).toFile(A("og-image.jpg"));
  console.log("logos ok", { full, mark, name, word });
}

async function services() {
  await fs.mkdir(A("services"), { recursive: true });
  for (const [slug, { page, box }] of Object.entries(CROPS)) {
    const [left, top, width, height] = box;
    const file = A("catalogue", `page-${String(page).padStart(2, "0")}.jpg`);
    const base = sharp(file).extract({ left, top, width, height });
    // Source photos are ~520px wide; the 1200w file is a gentle Lanczos upscale with light sharpening.
    await base.clone().resize({ width: 1200, kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).webp({ quality: 74 }).toFile(A("services", `${slug}.webp`));
    await base.clone().resize({ width: 600 }).webp({ quality: 76 }).toFile(A("services", `${slug}-600.webp`));
  }
  console.log("service crops ok");
}

async function catalogue() {
  await fs.mkdir(A("catalogue", "web"), { recursive: true });
  await fs.mkdir(A("catalogue", "thumbs"), { recursive: true });
  for (let i = 1; i <= 15; i++) {
    const n = String(i).padStart(2, "0");
    const f = A("catalogue", `page-${n}.jpg`);
    await sharp(f).webp({ quality: 80 }).toFile(A("catalogue", "web", `page-${n}.webp`));
    await sharp(f).resize({ width: 150 }).webp({ quality: 70 }).toFile(A("catalogue", "thumbs", `page-${n}.webp`));
  }
  await sharp(A("catalogue", "page-01.jpg")).resize({ width: 520 }).webp({ quality: 78 }).toFile(A("catalogue", "cover-520.webp"));
  console.log("catalogue ok");
}

const only = process.argv[2];
if (!only || only === "logos") await logos();
if (!only || only === "services") await services();
if (!only || only === "catalogue") await catalogue();
