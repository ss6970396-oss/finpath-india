/**
 * Contrast gate for the token layer.
 *
 * Parses the literal hex values out of app/globals.css (the @theme block for
 * light, the .dark block for dark) and asserts WCAG 2.1 ratios on every pair
 * the product actually renders:
 *
 *   text on its background          >= 4.5:1  (1.4.3 AA)
 *   control borders and focus rings >= 3.0:1  (1.4.11 AA, non-text)
 *
 * Run: node scripts/check-contrast.mjs
 * Exits non-zero on any failure so it can gate a build.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(here, "..", "app", "globals.css"), "utf8");

/* ------------------------------------------------------------------ parse */

/** Pull `--color-x: #hex;` pairs out of one brace-delimited block. */
function tokensIn(block) {
  const out = {};
  for (const m of block.matchAll(/(--color-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

function blockAfter(marker) {
  const start = CSS.indexOf(marker);
  if (start === -1) throw new Error(`could not find block: ${marker}`);
  const open = CSS.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < CSS.length; i++) {
    if (CSS[i] === "{") depth++;
    else if (CSS[i] === "}") {
      depth--;
      if (depth === 0) return CSS.slice(open, i);
    }
  }
  throw new Error(`unterminated block: ${marker}`);
}

const light = tokensIn(blockAfter("@theme {"));
const dark = { ...light, ...tokensIn(blockAfter("\n.dark {")) };

/* --------------------------------------------------------------- contrast */

function toRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ------------------------------------------------------------------ pairs */

const TEXT = 4.5;
const NON_TEXT = 3.0;

/** [foreground, background, minimum, note] */
const PAIRS = [
  // Body and heading text, on every surface it can land on.
  ["--color-ink", "--color-paper", TEXT],
  ["--color-ink", "--color-surface-1", TEXT],
  ["--color-ink", "--color-surface-2", TEXT],
  ["--color-ink", "--color-surface-3", TEXT],
  ["--color-ink-muted", "--color-paper", TEXT],
  ["--color-ink-muted", "--color-surface-1", TEXT],
  ["--color-ink-muted", "--color-surface-2", TEXT],
  ["--color-ink-faint", "--color-paper", TEXT],
  ["--color-ink-faint", "--color-surface-1", TEXT],
  ["--color-ink-faint", "--color-surface-2", TEXT],

  // Brand as text (links, ghost buttons) and as a button ground.
  ["--color-brand", "--color-paper", TEXT],
  ["--color-brand", "--color-surface-1", TEXT],
  ["--color-brand", "--color-surface-2", TEXT],
  ["--color-on-brand", "--color-brand", TEXT],
  ["--color-on-brand", "--color-brand-hover", TEXT],
  ["--color-on-brand", "--color-brand-press", TEXT],
  ["--color-brand", "--color-brand-weak", TEXT, "badge text on its tint"],

  // Status text on paper and on its own tint (the badge pattern).
  ["--color-positive", "--color-paper", TEXT],
  ["--color-positive", "--color-positive-weak", TEXT],
  ["--color-caution", "--color-paper", TEXT],
  ["--color-caution", "--color-surface-2", TEXT],
  ["--color-caution", "--color-caution-weak", TEXT],
  ["--color-critical", "--color-paper", TEXT],
  ["--color-critical", "--color-surface-2", TEXT],
  ["--color-critical", "--color-critical-weak", TEXT],
  ["--color-info", "--color-paper", TEXT],
  ["--color-info", "--color-surface-2", TEXT],
  ["--color-info", "--color-info-weak", TEXT],

  // Chart series must stay legible as strokes AND as inline label text.
  ["--color-data-1", "--color-paper", TEXT],
  ["--color-data-2", "--color-paper", TEXT],
  ["--color-data-3", "--color-paper", TEXT],
  ["--color-data-4", "--color-paper", TEXT],
  ["--color-data-5", "--color-paper", TEXT],
  ["--color-data-6", "--color-paper", TEXT],
  ["--color-data-1", "--color-surface-2", TEXT],
  ["--color-data-2", "--color-surface-2", TEXT],
  ["--color-data-3", "--color-surface-2", TEXT],
  ["--color-data-4", "--color-surface-2", TEXT],
  ["--color-data-5", "--color-surface-2", TEXT],
  ["--color-data-6", "--color-surface-2", TEXT],

  // Non-text: control boundaries and the focus ring (1.4.11).
  ["--color-rule-strong", "--color-paper", NON_TEXT, "control border"],
  ["--color-rule-strong", "--color-surface-1", NON_TEXT, "control border"],
  ["--color-rule-strong", "--color-surface-2", NON_TEXT, "control border"],
  ["--color-brand", "--color-paper", NON_TEXT, "focus ring"],
  ["--color-brand", "--color-surface-1", NON_TEXT, "focus ring"],
  ["--color-brand", "--color-surface-2", NON_TEXT, "focus ring"],
  ["--color-brand", "--color-surface-3", NON_TEXT, "focus ring"],
];

/* ------------------------------------------------------------------- run */

let failed = 0;
const rows = [];

for (const [themeName, tokens] of [
  ["light", light],
  ["dark", dark],
]) {
  for (const [fg, bg, min, note] of PAIRS) {
    const fgHex = tokens[fg];
    const bgHex = tokens[bg];
    if (!fgHex || !bgHex) {
      rows.push({ theme: themeName, pair: `${fg} / ${bg}`, got: "MISSING", min, ok: false, note: note ?? "" });
      failed++;
      continue;
    }
    const r = ratio(fgHex, bgHex);
    const ok = r >= min;
    if (!ok) failed++;
    rows.push({
      theme: themeName,
      pair: `${fg.replace("--color-", "")} / ${bg.replace("--color-", "")}`,
      got: r.toFixed(2),
      min: min.toFixed(1),
      ok,
      note: note ?? "",
    });
  }
}

const width = Math.max(...rows.map((r) => r.pair.length));
let currentTheme = "";
for (const r of rows) {
  if (r.theme !== currentTheme) {
    currentTheme = r.theme;
    console.log(`\n  ${currentTheme.toUpperCase()}`);
    console.log(`  ${"-".repeat(width + 26)}`);
  }
  const mark = r.ok ? "PASS" : "FAIL";
  console.log(
    `  ${mark}  ${r.pair.padEnd(width)}  ${String(r.got).padStart(6)} : 1   (min ${r.min})${r.note ? `  ${r.note}` : ""}`,
  );
}

console.log(
  `\n  ${rows.length - failed}/${rows.length} pairs pass.${failed ? `  ${failed} FAILING.` : ""}\n`,
);
process.exit(failed ? 1 : 0);
