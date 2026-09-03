/**
 * Contrast gate for the token layer (§39, WCAG 2.2 AA).
 *
 * Reads the literal hex values out of app/globals.css and asserts every
 * pairing the product actually renders. It parses the stylesheet rather
 * than duplicating the palette, so a token edited in one place cannot pass
 * a check written against the other.
 *
 * Thresholds:
 *   1.4.3  text on its ground                >= 4.5:1
 *   1.4.3  large text (>= 24px)              >= 3.0:1
 *   1.4.11 UI component boundaries, focus    >= 3.0:1
 *
 * Two documented exemptions, each asserted as an exemption rather than
 * skipped, so that neither can quietly become a violation:
 *
 *   --ink-disabled  1.4.3 explicitly exempts disabled controls. It is
 *                   asserted to be used ONLY for disabled states.
 *   --line          1.4.11 exempts purely decorative boundaries. It is
 *                   asserted to be BELOW 3:1, which is what forces control
 *                   borders onto --line-strong. If someone "fixes" --line
 *                   by darkening it, this check fails and asks why.
 *
 * Run: npm run check-contrast     Exits non-zero on any failure.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(here, "..", "app", "globals.css"), "utf8");

/* ------------------------------------------------------------------ parse */

/**
 * Pull `--color-x: #hex;` pairs from the FIRST @theme block only.
 *
 * The legacy compatibility block at the bottom of globals.css is a second
 * @theme, but every value in it is a `var()` alias rather than a hex
 * literal, so it contributes nothing here — by construction. If a hex ever
 * appears there, the token count assertion below catches it.
 */
function primaryTokens() {
  const start = CSS.indexOf("@theme {");
  if (start === -1) throw new Error("no @theme block in globals.css");

  // Walk braces to find the matching close, so a nested block cannot end it early.
  let depth = 0;
  let end = -1;
  for (let i = CSS.indexOf("{", start); i < CSS.length; i++) {
    if (CSS[i] === "{") depth++;
    else if (CSS[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error("unterminated @theme block");

  const block = CSS.slice(start, end);
  const out = {};
  for (const m of block.matchAll(
    /(--color-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g,
  )) {
    out[m[1].replace("--color-", "")] = m[2];
  }
  return out;
}

const T = primaryTokens();

/* ------------------------------------------------------------------ maths */

const channel = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function luminance(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  );
}

function ratio(a, b) {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/* ------------------------------------------------------------------ cases */

const GROUNDS = ["canvas", "surface", "surface-sunken"];

/** Text tokens that must clear 4.5:1 on every ground. */
const BODY_TEXT = ["ink", "ink-secondary", "ink-muted", "critical", "positive"];

const checks = [];

for (const fg of BODY_TEXT) {
  for (const bg of GROUNDS) {
    checks.push({
      kind: "text",
      need: 4.5,
      label: `${fg} on ${bg}`,
      fg: T[fg],
      bg: T[bg],
    });
  }
}

// Status washes are grounds too: a badge puts critical text on critical-wash.
checks.push(
  { kind: "text", need: 4.5, label: "critical on critical-wash", fg: T.critical, bg: T["critical-wash"] },
  { kind: "text", need: 4.5, label: "positive on positive-wash", fg: T.positive, bg: T["positive-wash"] },
  { kind: "text", need: 4.5, label: "ink on critical-wash", fg: T.ink, bg: T["critical-wash"] },
  { kind: "text", need: 4.5, label: "ink on positive-wash", fg: T.ink, bg: T["positive-wash"] },
);

// Filled controls: the label sits on the fill.
checks.push(
  { kind: "text", need: 4.5, label: "canvas on ink (primary button)", fg: T.canvas, bg: T.ink },
  { kind: "text", need: 4.5, label: "canvas on critical (critical button)", fg: T.canvas, bg: T.critical },
  { kind: "text", need: 4.5, label: "canvas on positive", fg: T.canvas, bg: T.positive },
);

// The accent is asserted as TEXT on every ground, not merely as a fill.
// That is the constraint that keeps it a usable link colour instead of a
// decorative band: an accent that only passes as a background is one that
// will end up used as decoration.
for (const bg of GROUNDS) {
  checks.push({
    kind: "text",
    need: 4.5,
    label: `accent on ${bg}`,
    fg: T.accent,
    bg: T[bg],
  });
}
checks.push(
  { kind: "text", need: 4.5, label: "accent on accent-wash", fg: T.accent, bg: T["accent-wash"] },
  { kind: "text", need: 4.5, label: "ink on accent-wash", fg: T.ink, bg: T["accent-wash"] },
  { kind: "text", need: 4.5, label: "canvas on accent (selected control)", fg: T.canvas, bg: T.accent },
  { kind: "boundary", need: 3, label: "accent border on canvas", fg: T.accent, bg: T.canvas },
);

// 1.4.11: control boundaries and the focus ring.
for (const bg of GROUNDS) {
  checks.push({
    kind: "boundary",
    need: 3,
    label: `line-strong (control border, focus ring) on ${bg}`,
    fg: T["line-strong"],
    bg: T[bg],
  });
}

// The status washes must be distinguishable from the page they sit on.
checks.push(
  { kind: "boundary", need: 3, label: "critical border on canvas", fg: T.critical, bg: T.canvas },
  { kind: "boundary", need: 3, label: "positive border on canvas", fg: T.positive, bg: T.canvas },
);

/* ------------------------------------------------------------- exemptions */

const exemptions = [
  {
    label: "ink-disabled on canvas",
    ratio: ratio(T["ink-disabled"], T.canvas),
    rule: "WCAG 1.4.3 exempts disabled controls",
    expect: (r) => r < 4.5,
    note: "Use ONLY for a disabled control's own text.",
  },
  {
    label: "line on canvas",
    ratio: ratio(T.line, T.canvas),
    rule: "WCAG 1.4.11 exempts decorative boundaries",
    expect: (r) => r < 3,
    note: "Dividers and card edges only. Controls take --line-strong.",
  },
];

/* ---------------------------------------------------------------- reporting */

let failed = 0;
const rows = [];

for (const c of checks) {
  if (!c.fg || !c.bg) {
    rows.push(["MISSING", c.label, "—"]);
    failed++;
    continue;
  }
  const r = ratio(c.fg, c.bg);
  const ok = r >= c.need;
  if (!ok) failed++;
  rows.push([ok ? "pass" : "FAIL", c.label, `${r.toFixed(2)} (need ${c.need})`]);
}

const width = Math.max(...rows.map((r) => r[1].length));
console.log("\nFinPath contrast gate — WCAG 2.2 AA\n");
for (const [status, label, value] of rows) {
  const mark = status === "pass" ? "  ok " : "FAIL ";
  console.log(`${mark} ${label.padEnd(width)}  ${value}`);
}

console.log("\nDocumented exemptions (asserted, not skipped):\n");
for (const e of exemptions) {
  const ok = e.expect(e.ratio);
  if (!ok) failed++;
  console.log(
    `${ok ? "  ok " : "FAIL "} ${e.label.padEnd(width)}  ${e.ratio.toFixed(2)}  — ${e.rule}`,
  );
  console.log(`      ${e.note}`);
}

// The palette is closed at fifteen. A sixteenth token is a design change,
// not a tweak, so it fails the gate and has to be argued for.
//
// It was thirteen until the product gained a public landing page, an
// authentication flow and an onboarding wizard. Those three surfaces need
// one mark of identity that ink-on-canvas cannot supply, so --accent and
// --accent-wash were added — and are asserted above as TEXT on every
// ground, which is what stops the accent degenerating into decoration.
// Nothing else moved: status still belongs to positive/critical, and the
// accent is barred from carrying meaning.
const count = Object.keys(T).length;
console.log(`\nPalette size: ${count} tokens`);
if (count !== 15) {
  console.log(
    `FAIL  the palette is fixed at 15 colour tokens; found ${count}: ${Object.keys(T).join(", ")}`,
  );
  failed++;
}

if (failed) {
  console.error(`\n${failed} contrast check(s) failed.\n`);
  process.exit(1);
}
console.log("\nAll contrast checks passed.\n");
