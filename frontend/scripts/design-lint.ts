/**
 * Design lint (§12).
 *
 * Mechanically enforces the parts of the design system that a human review
 * will always eventually miss: colours outside the token file, radius,
 * shadow, dark-mode variants, arbitrary type sizes, ungoverned fetches,
 * hand-rolled currency formatting, and mock data in a production path.
 *
 * Run: npm run design-lint
 *
 * ── WHY THERE IS A LEXER IN HERE ───────────────────────────────────────
 *
 * The first version matched rule words against raw lines, and every file
 * in components/ui/ failed — on the sentence "Square, bordered, no shadow"
 * inside the comment explaining why there are no shadows. A linter that
 * fires on prose describing the rule is a linter that gets switched off.
 *
 * So the source is lexed first. Comments are blanked (line numbers kept),
 * and each rule declares where it applies:
 *
 *   scope "strings"  class-shaped rules — rounded, shadow, dark:, arbitrary
 *                    sizes and colours. Class names live in string literals
 *                    essentially without exception, so this is both precise
 *                    and immune to prose.
 *   scope "code"     everything else — fetch(, Intl., toFixed(, ₹ — which
 *                    can appear as JSX text as well as in a literal, but
 *                    never legitimately in a comment.
 *
 * ── HOW FAILURE WORKS ──────────────────────────────────────────────────
 *
 * design-lint.baseline.json records violations per rule per file for the
 * NOT-YET-REBUILT pages. The lint fails when:
 *
 *   - any file exceeds its recorded baseline, or
 *   - a violation appears in a file with no baseline entry
 *
 * It does not fail on the recorded legacy debt itself. That is not the rule
 * being weakened: the baseline can only ever shrink, the total is printed
 * on every run, and §53 requires it to reach zero before the rebuild is
 * done. Failing on it today would leave the gate red for the whole of
 * Phase 3, which is how gates come to be ignored.
 *
 * Refresh with `npm run design-lint -- --update`, ONLY after deleting
 * violations. The diff on that file is the evidence.
 *
 * ── SUPPRESSIONS ───────────────────────────────────────────────────────
 *
 *     // design-lint-allow: <rule> — <reason>
 *
 * on the offending line or the one above. The reason is mandatory; a bare
 * allow is itself a failure. For permanent, argued exceptions — never debt.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_PATH = join(ROOT, "design-lint.baseline.json");

const SCAN_DIRS = ["app", "components", "lib"];
const SKIP_DIRS = new Set(["node_modules", ".next", "__fixtures__"]);
const SKIP_FILE = /\.test\.tsx?$/;

/* ------------------------------------------------------------------ lex */

type Lexed = {
  /** Per line: source with comment characters blanked out. */
  code: string[];
  /** Per line: each string literal on that line, kept separate so a rule
   *  can judge one literal at a time. */
  strings: string[][];
  /** Per line: comment text only, for reading suppression pragmas. */
  comments: string[];
};

/**
 * Regex-literal detection.
 *
 * This is not optional pedantry. lib/csv.ts contains
 *
 *     return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
 *
 * and without it the `"` inside that character class opens a string, the
 * quotes interleave, an unbalanced backtick is consumed, and the lexer
 * spends the REST OF THE FILE believing it is inside a template literal.
 * Every comment after that point silently stops being a comment — which is
 * exactly how the first version of this scanner lost a suppression pragma.
 *
 * The standard heuristic: a `/` begins a regex when the previous
 * significant token cannot end an expression. After an identifier, a
 * number, `)` or `]`, a slash is division; after an operator, a bracket, or
 * one of the keywords below, it is a regex.
 */
const REGEX_OK_KEYWORD =
  /\b(?:return|typeof|instanceof|in|of|new|delete|void|do|else|case|yield|await)$/;

function startsRegex(codeSoFar: string): boolean {
  const trimmed = codeSoFar.replace(/\s+$/, "");
  if (trimmed === "") return true;
  if (REGEX_OK_KEYWORD.test(trimmed)) return true;
  return !/[\w$)\]]$/.test(trimmed);
}

/**
 * A deliberately small scanner. It tracks line comments, block comments,
 * the three string forms and regex literals, which is enough to separate
 * prose from code in TS/TSX. Template literals are treated as one string
 * throughout, including their `${}` holes — a class name interpolated into
 * a template is still a class name, so scanning the whole thing is the
 * behaviour we want.
 */
function lex(src: string): Lexed {
  const lines = src.split(/\r?\n/);
  const code = lines.map(() => "");
  const strings: string[][] = lines.map(() => []);
  const comments = lines.map(() => "");

  type State =
    | "normal"
    | "line"
    | "block"
    | "single"
    | "double"
    | "template"
    | "regex";
  let state: State = "normal";
  /** True while inside a `[...]` class, where `/` does not end the regex. */
  let inCharClass = false;
  /** The literal currently being read, flushed to `strings` when it closes. */
  let buffer = "";

  const flush = (ln: number) => {
    if (buffer) strings[ln].push(buffer);
    buffer = "";
  };

  for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln];

    // A line comment ends at the newline, and so does a regex literal or a
    // quoted string — an unterminated one is a syntax error, so recovering
    // to `normal` keeps one bad line from poisoning the rest of the file.
    if (
      state === "line" ||
      state === "single" ||
      state === "double" ||
      state === "regex"
    ) {
      if (state === "single" || state === "double") flush(ln - 1 < 0 ? 0 : ln - 1);
      state = "normal";
      inCharClass = false;
    }

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const next = line[i + 1];

      switch (state) {
        case "normal":
          if (c === "/" && next === "/") {
            state = "line";
            comments[ln] += line.slice(i);
            code[ln] += " ".repeat(line.length - i);
            i = line.length;
          } else if (c === "/" && next === "*") {
            state = "block";
            code[ln] += "  ";
            comments[ln] += "/*";
            i++;
          } else if (c === "/" && startsRegex(code[ln])) {
            // A regex body is neither code nor string: blanked, so nothing
            // inside it can be mistaken for a class name or a quote.
            state = "regex";
            inCharClass = false;
            code[ln] += " ";
          } else if (c === "'" || c === '"' || c === "`") {
            state = c === "'" ? "single" : c === '"' ? "double" : "template";
            code[ln] += c;
          } else {
            code[ln] += c;
          }
          break;

        case "regex":
          code[ln] += " ";
          if (c === "\\") {
            code[ln] += " ";
            i++;
          } else if (c === "[") {
            inCharClass = true;
          } else if (c === "]") {
            inCharClass = false;
          } else if (c === "/" && !inCharClass) {
            state = "normal";
          }
          break;

        case "block":
          if (c === "*" && next === "/") {
            state = "normal";
            code[ln] += "  ";
            comments[ln] += "*/";
            i++;
          } else {
            code[ln] += " ";
            comments[ln] += c;
          }
          break;

        case "single":
        case "double":
        case "template": {
          const quote = state === "single" ? "'" : state === "double" ? '"' : "`";
          if (c === "\\") {
            buffer += c + (next ?? "");
            code[ln] += "  ";
            i++;
          } else if (c === quote) {
            state = "normal";
            code[ln] += c;
            flush(ln);
          } else {
            buffer += c;
            code[ln] += c;
          }
          break;
        }

        case "line":
          break;
      }
    }
  }

  // A template literal left open at end of line still contributed text to
  // this line; record it so a class list broken across lines is not lost.
  // (The buffer keeps accumulating, so the full literal lands on its last
  // line too — deliberate: either half may hold the offending token.)
  return { code, strings, comments };
}

/* ----------------------------------------------------------------- rules */

type Scope = "code" | "strings";

type Rule = {
  id: string;
  /** One line, imperative: what to do instead. */
  message: string;
  scope: Scope;
  test: RegExp;
  /** Files exempt by design — the rule's own home. */
  exempt?: (path: string) => boolean;
  /**
   * Restrict a string-scope rule to strings that read as a class list.
   *
   * `rounded` and `shadow` are ordinary English words, so scanning every
   * string literal for them flags prose in a JSX prop — a `description` that
   * says "there is no shadow to lift them" is not a shadow. The other
   * string rules have unambiguous shapes (`dark:`, `text-[13px]`, `#a34a45`)
   * and need no gate.
   */
  classLike?: boolean;
};

/**
 * A class list never contains sentence punctuation: no comma-space, no
 * period-space, no dash, no terminal full stop. Prose almost always does.
 * Cheap, and wrong only for a string that is simultaneously a class list and
 * a sentence, which does not occur.
 */
function looksLikeClassList(s: string): boolean {
  return !/[.,;?!—]\s|\s—|\.$/.test(s);
}

const isFormatter = (p: string) =>
  p === join("lib", "format.ts") || p === join("lib", "money.ts");

const RULES: Rule[] = [
  {
    id: "raw-hex",
    scope: "strings",
    message:
      "raw hex colour. Every colour lives in app/globals.css; use a token class.",
    test: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z])/g,
  },
  {
    id: "arbitrary-color",
    scope: "strings",
    message:
      "arbitrary colour value. Use a token class (bg-surface, text-ink-muted, …).",
    test: /\b(?:bg|text|border|fill|stroke|ring|outline|decoration|from|to|via|accent|caret|divide)-\[[^\]]*(?:#|rgba?\(|hsla?\(|oklch\(|color\()[^\]]*\]/g,
  },
  {
    id: "rounded",
    scope: "strings",
    message:
      "rounded corner. §15 sets radius to zero; the only circle is the user avatar, via the `avatar` utility.",
    classLike: true,
    test: /(?<![\w-])rounded(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|4xl|full|t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee)(?:-[a-z0-9]+)?)?(?![\w-])/g,
  },
  {
    id: "shadow",
    scope: "strings",
    message: "shadow. §15 forbids shadows; use a border or a surface step.",
    classLike: true,
    test: /(?<![\w-])(?:drop-)?shadow(?:-[a-z0-9-]+)?(?![\w-])/g,
  },
  {
    id: "dark-variant",
    scope: "strings",
    message: "dark-mode variant. §11: there is no dark mode.",
    test: /\bdark:/g,
  },
  {
    id: "arbitrary-font-size",
    scope: "strings",
    message:
      "arbitrary font size. Use a type role: type-display/heading/subhead/body/label/data.",
    test: /\btext-\[[^\]]*(?:\d(?:px|rem|em|pt|ch|vw|vh)|clamp\(|calc\()[^\]]*\]/g,
  },
  {
    id: "direct-fetch",
    scope: "code",
    message: "direct fetch(). All requests go through lib/api.ts.",
    test: /(?<![\w.])fetch\s*\(/g,
    exempt: (p) => p === join("lib", "api.ts"),
  },
  {
    id: "manual-currency",
    scope: "code",
    message:
      "hand-written rupee string. Format money with formatINR/formatCompactINR from lib/format.ts.",
    test: /₹/g,
    exempt: isFormatter,
  },
  {
    id: "manual-format",
    scope: "code",
    message:
      "direct Intl use. lib/format.ts is the only place a number becomes a string.",
    test: /\bIntl\.(?:NumberFormat|DateTimeFormat)\b/g,
    exempt: isFormatter,
  },
  {
    id: "inline-tofixed",
    scope: "code",
    message:
      "inline toFixed(). §14 forbids it for figures; use formatPercent or formatCompactINR.",
    test: /\.toFixed\s*\(/g,
    exempt: isFormatter,
  },
  {
    id: "mock-data",
    scope: "code",
    message:
      "mock/synthetic data in a production path. §53: no production mock data.",
    test: /\b(?:const|let|var|function)\s+(?:MOCK|FAKE|DUMMY|STUB|DEMO|SEED|PLACEHOLDER|SAMPLE)_?[A-Za-z]|\bMath\.random\s*\(/g,
  },
];

/* ------------------------------------------------------------------ scan */

type Violation = { file: string; line: number; rule: string; text: string };

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(name) && !SKIP_FILE.test(name)) out.push(full);
  }
  return out;
}

/** `design-lint-allow: rule — reason`. The reason is mandatory. */
function suppression(text: string): { rule: string; reason: string } | null {
  const m = /design-lint-allow:\s*([a-z-]+)\s*[—-]\s*(\S.*)$/.exec(text);
  return m ? { rule: m[1], reason: m[2].trim() } : null;
}

const violations: Violation[] = [];
const badSuppressions: Violation[] = [];

for (const dir of SCAN_DIRS) {
  for (const abs of walk(join(ROOT, dir))) {
    const file = relative(ROOT, abs);
    const raw = readFileSync(abs, "utf8");
    const { code, strings, comments } = lex(raw);
    const rawLines = raw.split(/\r?\n/);

    for (let i = 0; i < rawLines.length; i++) {
      const pragma = comments[i];
      if (/design-lint-allow:/.test(pragma) && !suppression(pragma)) {
        badSuppressions.push({
          file,
          line: i + 1,
          rule: "suppression-without-reason",
          text: rawLines[i].trim(),
        });
      }

      // The pragma may sit on the offending line, or anywhere in the
      // contiguous comment block immediately above it. Walking the whole
      // block matters: the reason is mandatory, so reasons run to several
      // lines, and only checking the line directly above would mean the
      // pragma had to be the LAST thing written rather than the first.
      const allowed = new Set<string>();
      for (let j = i; j >= 0; j--) {
        const s = suppression(comments[j]);
        if (s) allowed.add(s.rule);
        // Stop at the first line that carries real code: that ends the block.
        if (j < i && code[j].trim() !== "") break;
      }

      for (const rule of RULES) {
        if (rule.exempt?.(file) || allowed.has(rule.id)) continue;

        const haystacks =
          rule.scope === "code"
            ? [code[i]]
            : rule.classLike
              ? strings[i].filter(looksLikeClassList)
              : strings[i];

        let count = 0;
        for (const haystack of haystacks) {
          if (!haystack) continue;
          rule.test.lastIndex = 0;
          count += haystack.match(rule.test)?.length ?? 0;
        }
        if (!count) continue;
        for (let k = 0; k < count; k++) {
          violations.push({
            file,
            line: i + 1,
            rule: rule.id,
            text: rawLines[i].trim().slice(0, 110),
          });
        }
      }
    }
  }
}

/* -------------------------------------------------------------- baseline */

type Baseline = { note: string; counts: Record<string, Record<string, number>> };

function readBaseline(): Baseline {
  try {
    return JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
  } catch {
    return { note: "", counts: {} };
  }
}

/** Baseline keys use forward slashes so the file is identical on any OS. */
const keyOf = (file: string) => file.split(sep).join("/");

function tally(list: Violation[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const v of list) {
    const key = keyOf(v.file);
    out[key] ??= {};
    out[key][v.rule] = (out[key][v.rule] ?? 0) + 1;
  }
  return out;
}

const current = tally(violations);

if (process.argv.includes("--update")) {
  const next: Baseline = {
    note:
      "Legacy design-system debt in the not-yet-rebuilt pages. This file may " +
      "only ever shrink, and must be empty before the rebuild is complete " +
      "(§53). Regenerate with `npm run design-lint -- --update` only after " +
      "deleting violations.",
    counts: Object.fromEntries(
      Object.entries(current)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([f, rules]) => [
          f,
          Object.fromEntries(
            Object.entries(rules).sort(([a], [b]) => a.localeCompare(b)),
          ),
        ]),
    ),
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");
  console.log(
    `Baseline written: ${violations.length} violation(s) across ${Object.keys(current).length} file(s).`,
  );
  process.exit(0);
}

const baseline = readBaseline();

/* ------------------------------------------------------------- reporting */

const regressions: string[] = [];
for (const [file, rules] of Object.entries(current)) {
  for (const [rule, count] of Object.entries(rules)) {
    const allowed = baseline.counts[file]?.[rule] ?? 0;
    if (count > allowed) {
      regressions.push(
        allowed === 0
          ? `${file}: ${count} × ${rule} (no baseline — new violation)`
          : `${file}: ${count} × ${rule}, baseline allows ${allowed}`,
      );
    }
  }
}

const unbaselined = violations.filter(
  (v) => (baseline.counts[keyOf(v.file)]?.[v.rule] ?? 0) === 0,
);

console.log("\nFinPath design lint\n");

if (unbaselined.length) {
  console.log("Violations outside the baseline:\n");
  for (const v of unbaselined) {
    const rule = RULES.find((r) => r.id === v.rule);
    console.log(`  ${v.file}:${v.line}`);
    console.log(`    ${v.rule} — ${rule?.message ?? ""}`);
    console.log(`    > ${v.text}`);
  }
  console.log("");
}

for (const b of badSuppressions) {
  console.log(`  ${b.file}:${b.line}`);
  console.log(
    "    suppression-without-reason — `design-lint-allow` needs `: rule — reason`.",
  );
}

const debtByRule: Record<string, number> = {};
for (const rules of Object.values(baseline.counts)) {
  for (const [rule, n] of Object.entries(rules)) {
    debtByRule[rule] = (debtByRule[rule] ?? 0) + n;
  }
}
const debtTotal = Object.values(debtByRule).reduce((a, b) => a + b, 0);

if (debtTotal) {
  console.log(
    `Legacy debt: ${debtTotal} violation(s) in ${Object.keys(baseline.counts).length} not-yet-rebuilt file(s).`,
  );
  for (const [rule, n] of Object.entries(debtByRule).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${rule}`);
  }
  console.log("  This must reach zero before the rebuild is complete (§53).\n");
}

if (regressions.length || badSuppressions.length) {
  console.error("Design lint FAILED:\n");
  for (const r of regressions) console.error(`  ${r}`);
  if (badSuppressions.length) {
    console.error(`  ${badSuppressions.length} suppression(s) without a reason`);
  }
  console.error("");
  process.exit(1);
}

console.log("Design lint passed: no new violations.\n");
