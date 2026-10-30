// Builds tests/fixtures/appendix-a.json from Appendix A of PROMPT-claude-code.md (the source of truth for service text).
import fs from "node:fs";
import { ROOT } from "./helpers.mjs";
const md = fs.readFileSync(ROOT + "/PROMPT-claude-code.md", "utf8").split("## Appendix A")[1];
const out = {};
for (const block of md.split(/\n### /).slice(1)) {
  const head = block.split("\n")[0];
  const m = head.match(/^(\d\d) (.+?) \(page (\d\d)\) — slug `([^`]+)`/);
  if (!m) continue;
  const field = (name) => { const r = block.match(new RegExp(`- \\*\\*${name}:\\*\\* (.+)`)); return r ? r[1].trim() : null; };
  const list = (name) => field(name).split(" · ").map((x) => x.trim());
  out[m[4]] = { n: +m[1], title: m[2], page: +m[3], tagline: field("Tagline"), features: list("Features"), presentation: field("Présentation"), solutions: list("Nos solutions"), prestations: list("Nos prestations"), avantages: list("Les avantages"), badges: list("Engagement badges") };
}
fs.writeFileSync(ROOT + "/tests/fixtures/appendix-a.json", JSON.stringify(out, null, 2));
console.log(Object.keys(out).length, "services extracted");
