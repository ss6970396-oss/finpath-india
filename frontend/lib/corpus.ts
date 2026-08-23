/**
 * Corpus metadata for the Regulatory Vault and the Citation Inspector.
 *
 * INTEGRITY RULE — read before extending this file.
 *
 * The RAG index stores exactly four columns: source (the PDF filename), page,
 * content, embedding. It holds no circular number, no gazette date, no clause
 * identifier and no revision status. Those fields are therefore NOT invented
 * here. Anything this module cannot establish from the filename or from the
 * API is reported as unavailable, and the UI renders it as such.
 *
 * Fabricating a circular number under a regulator's name would be the exact
 * failure mode the counselor's citation rule exists to prevent.
 */

export type Issuer = "SEBI" | "RBI" | "NCFE" | "Unattributed";

export type Category =
  | "Capital Markets"
  | "Banking"
  | "Consumer Rights"
  | "Financial Education";

export type DocMeta = {
  file: string;
  title: string;
  issuer: Issuer;
  /** How the issuer was established — shown in the UI, never hidden. */
  attribution: "stated in document" | "inferred from filename" | "unknown";
  category: Category;
  note?: string;
};

/**
 * Attributions verified by reading each document's own front matter during
 * corpus review. `collegestudents.pdf` states on its opening page that the
 * content was developed by MCX Stock Exchange and FTKMC under the guidance of
 * the Advisory Committee for the Investor Protection and Education Fund of
 * the Securities and Exchange Board of India.
 */
const KNOWN: Record<string, Omit<DocMeta, "file">> = {
  "collegestudents.pdf": {
    title: "Financial Education for College Students",
    issuer: "SEBI",
    attribution: "stated in document",
    category: "Capital Markets",
    note: "Developed by MCX Stock Exchange and FTKMC under the guidance of the SEBI Investor Protection and Education Fund advisory committee.",
  },
  "SM Booklet_English_SEBI - Final_8ap 2022_low.pdf": {
    title: "Securities Market Booklet",
    issuer: "SEBI",
    attribution: "inferred from filename",
    category: "Capital Markets",
  },
  "FE_Handbook_Eng.pdf": {
    title: "Financial Education Handbook",
    issuer: "NCFE",
    attribution: "inferred from filename",
    category: "Financial Education",
  },
  "FE-Handbook-for-New-Entrants-at-Workplace.pdf": {
    title: "Financial Education Handbook for New Entrants at the Workplace",
    issuer: "NCFE",
    attribution: "inferred from filename",
    category: "Financial Education",
  },
  "Financial-Education-Part-A.pdf": {
    title: "Financial Education, Part A",
    issuer: "NCFE",
    attribution: "inferred from filename",
    category: "Financial Education",
  },
  "Financial Education Booklet - English.pdf": {
    title: "Financial Education Booklet",
    issuer: "RBI",
    attribution: "inferred from filename",
    category: "Consumer Rights",
  },
};

const ISSUER_HINTS: [RegExp, Issuer][] = [
  [/sebi|securities/i, "SEBI"],
  [/\brbi\b|reserve bank/i, "RBI"],
  [/ncfe|national centre/i, "NCFE"],
];

/** Title-cases a bare filename when nothing better is known. */
function titleFromFile(file: string): string {
  return file
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function metaFor(file: string): DocMeta {
  const known = KNOWN[file];
  if (known) return { file, ...known };

  for (const [re, issuer] of ISSUER_HINTS) {
    if (re.test(file)) {
      return {
        file,
        title: titleFromFile(file),
        issuer,
        attribution: "inferred from filename",
        category: "Financial Education",
      };
    }
  }
  return {
    file,
    title: titleFromFile(file),
    issuer: "Unattributed",
    attribution: "unknown",
    category: "Financial Education",
  };
}

/** Fields the index genuinely does not carry. Rendered as "not recorded". */
export const UNRECORDED_FIELDS = [
  "Circular / reference number",
  "Publication date",
  "Clause or section identifier",
  "Amendment status",
] as const;

export const ISSUER_TONE: Record<Issuer, "sage" | "neutral"> = {
  SEBI: "sage",
  RBI: "sage",
  NCFE: "sage",
  Unattributed: "neutral",
};
