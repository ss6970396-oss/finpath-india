"use client";

import * as React from "react";
import {
  BookOpen,
  Compass,
  FileText,
  LayoutGrid,
  MessageSquare,
  Settings,
  Wallet,
} from "lucide-react";

import {
  ActionCard,
  Annotated,
  Avatar,
  Badge,
  BareInput,
  Button,
  ButtonRow,
  ChartFrame,
  Checkbox,
  Choice,
  DisclaimerNote,
  DistributionBar,
  DropZone,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Citation,
  EmptyState,
  ErrorState,
  Header,
  Input,
  Insight,
  LoadingState,
  MarginBody,
  MarginLayout,
  MarginNote,
  Metric,
  MetricRow,
  MobileNav,
  Modal,
  ModalClose,
  Money,
  PageHeader,
  PasswordInput,
  ProgressMeter,
  Provenance,
  ScoreDial,
  Section,
  Segmented,
  Select,
  Sheet,
  Sidebar,
  Skeleton,
  Slider,
  SourcePanel,
  StatusDot,
  Stepper,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TRowHeader,
  Tab,
  TabList,
  TabPanel,
  Table,
  Tabs,
  Timeline,
  TimelineStage,
  ToastProvider,
  Tooltip,
  TooltipProvider,
  UnverifiedNote,
  useToast,
} from "@/components/ui";

import {
  formatCompactINR,
  formatCount,
  formatDate,
  formatINR,
  formatMonth,
  formatPercent,
} from "@/lib/format";
import { paise, rupees } from "@/lib/money";

/**
 * /styleguide (§18) — the visual source of truth.
 *
 * Every primitive in components/ui/, every token, every type role, in one
 * place. §18 requires default, hover, focus, disabled, loading, empty and
 * error to be shown.
 *
 * Four of those seven are static and are rendered directly below. HOVER and
 * FOCUS are live pseudo-classes and cannot honestly be "rendered" — faking
 * them by copying the hover classes onto a static element would demonstrate
 * a duplicate class string rather than the component. So they are labelled
 * for live exercise instead, and the keyboard path is called out, because
 * tabbing through this page is also the fastest way to check §39's focus
 * requirement across the whole inventory.
 *
 * The colour table reads its values back out of the DOM with
 * getComputedStyle, so it proves what the utilities actually compile to
 * rather than restating what globals.css says.
 */

/* ------------------------------------------------------------- scaffolding */

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-4 last:border-b-0 md:flex-row md:items-start md:gap-8">
      <div className="md:w-48 md:shrink-0">
        <p className="type-label text-ink">{label}</p>
        {hint ? <p className="type-label text-ink-muted">{hint}</p> : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-start gap-4">
        {children}
      </div>
    </div>
  );
}

const LIVE_STATE_NOTE =
  "Hover and focus are live states. Point at these, then tab through them.";

/* ------------------------------------------------------------------ tokens */

const COLOUR_TOKENS = [
  ["canvas", "the page"],
  ["surface", "panels on the page"],
  ["surface-sunken", "wells, inputs"],
  ["ink", "headings, amounts"],
  ["ink-secondary", "supporting text"],
  ["ink-muted", "labels, marginalia"],
  ["ink-disabled", "disabled only"],
  ["line", "dividers — never a control"],
  ["line-strong", "every control boundary"],
  ["accent", "the one brand colour — legible as text"],
  ["accent-wash", "accent ground"],
  ["critical", "a rule has fired"],
  ["critical-wash", "critical ground"],
  ["positive", "on target"],
  ["positive-wash", "positive ground"],
] as const;

/**
 * The resolved token values, read from the DOM.
 *
 * Read through useSyncExternalStore rather than an effect: the stylesheet is
 * an external system, and copying it into state inside an effect both
 * cascades a render and trips the repo's react-hooks/set-state-in-effect
 * rule. getSnapshot has to return a STABLE reference or React re-renders
 * forever, so the read is computed once and cached — which is sound here
 * because the palette has no dark mode and no runtime theming, so these
 * values never change after first paint.
 */
const NO_TOKENS: Record<string, string> = {};
let tokenCache: Record<string, string> | null = null;

function readTokens(): Record<string, string> {
  if (tokenCache) return tokenCache;
  if (typeof document === "undefined") return NO_TOKENS;
  const styles = getComputedStyle(document.documentElement);
  tokenCache = Object.fromEntries(
    COLOUR_TOKENS.map(([name]) => [
      name,
      styles.getPropertyValue(`--color-${name}`).trim(),
    ]),
  );
  return tokenCache;
}

/** Nothing to subscribe to: the values are fixed for the life of the page. */
const subscribeToTokens = () => () => {};

function ColourTable() {
  const resolved = React.useSyncExternalStore(
    subscribeToTokens,
    readTokens,
    () => NO_TOKENS,
  );

  return (
    <Table caption="The fifteen colour tokens and their resolved values">
      <THead>
        <TR>
          <TH>Token</TH>
          <TH>Swatch</TH>
          <TH>Resolved</TH>
          <TH>Job</TH>
        </TR>
      </THead>
      <TBody>
        {COLOUR_TOKENS.map(([name, job]) => (
          <TR key={name}>
            <TRowHeader>
              <code className="type-data text-sm">--{name}</code>
            </TRowHeader>
            <TD>
              <span
                className="block size-8 border border-line-strong"
                style={{ backgroundColor: `var(--color-${name})` }}
              />
            </TD>
            <TD numeric>{resolved[name] || "…"}</TD>
            <TD>{job}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

/* -------------------------------------------------------------------- type */

const TYPE_ROLES = [
  ["type-hero", "Instrument Serif, 44 → 76px", "See where your money is going"],
  ["type-display", "Instrument Serif, 36 → 52px", "Understand your money"],
  ["type-heading", "Instrument Serif, 24px", "This month at a glance"],
  ["type-subhead", "Inter 600, 16px", "Where it went"],
  ["type-body", "Inter 400, 15px", "Your dining spend is above the share you set for it."],
  ["type-label", "Inter 500, 13px", "Monthly allowance"],
  ["type-eyebrow", "Inter 600, 11px, uppercase", "Your biggest opportunity"],
  ["type-data", "Inter 500, tabular, size inherited", "1,24,500"],
] as const;

/* ---------------------------------------------------------------- fixtures */

const SOURCE_FIXTURE = [
  {
    n: 1,
    source: "collegestudents.pdf",
    page: 14,
    authority: "SEBI",
    snippet:
      "A systematic investment plan allows an investor to invest a fixed amount at regular intervals rather than a lump sum, which spreads the entry price over time.",
  },
  {
    n: 2,
    source: "collegestudents.pdf",
    page: 27,
    authority: "SEBI",
    snippet:
      "Investors should verify that any intermediary they deal with is registered with the Board before parting with money.",
  },
];

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: LayoutGrid },
  { href: "/spending", label: "Spending", icon: Wallet },
  { href: "/plan", label: "Plan", icon: BookOpen },
  { href: "/what-if", label: "What-if", icon: Compass },
  { href: "/ask", label: "Ask", icon: MessageSquare },
  { href: "/sources", label: "Sources", icon: FileText },
  { href: "/profile", label: "Profile", icon: Settings },
];

/**
 * The forms §14 forbids, printed verbatim so a reviewer can recognise them
 * on sight. These are the only literal rupee strings in the codebase outside
 * lib/format.ts, and they exist precisely to be shown as wrong.
 */
// design-lint-allow: manual-currency — counter-examples; see above.
const FORBIDDEN = ["₹150,000", "₹150K", "₹1.5M"] as const;

const SELECT_ITEMS = [
  { value: "parents", label: "From parents", detail: "Monthly allowance" },
  { value: "stipend", label: "Internship stipend" },
  { value: "part-time", label: "Part-time work" },
];

/* ================================================================== page */

export default function StyleGuidePage() {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <ToastProvider>
        <main id="main" className="page-shell flex flex-col gap-16 py-16">
          <PageHeader
            title="FinPath style guide"
            purpose="Every design token, type role and primitive in one place. This page is the visual source of truth: check a change here, in the states below, before checking it on a feature page."
          />

          {/* ---------------------------------------------------- colour */}
          <Section
            title="Colour"
            description="Fifteen tokens. No sixteenth — check-contrast fails the build if the palette grows, and every one of these is asserted against a WCAG ratio."
          >
            <Annotated
              note={
                <>
                  Values read from the DOM with getComputedStyle, so this
                  proves what the utilities compile to.
                </>
              }
            >
              <ColourTable />
            </Annotated>

            <div className="flex flex-col gap-2 border border-line bg-surface px-4 py-4">
              <p className="type-subhead text-ink">Two rules that fall out of the measurements</p>
              <p className="type-body prose-measure text-ink-secondary">
                <strong>--line is 1.24:1 against canvas.</strong> That is below
                the 3:1 WCAG 2.2 SC 1.4.11 requires of a UI component
                boundary, and it is fine, because 1.4.11 exempts decorative
                boundaries. So --line draws dividers, table rules and card
                edges, and never the border of a control. Controls take
                --line-strong at 13.92:1.
              </p>
              <p className="type-body prose-measure text-ink-secondary">
                <strong>--positive and --critical sit 1.21:1 apart.</strong>{" "}
                They are near-identical in luminance, so they are never used
                as two ends of a scale, never adjacent, and never the sole
                carrier of meaning. Each always travels with a word or a
                glyph — which is why every toned Badge below has an icon.
              </p>
            </div>
          </Section>

          {/* ------------------------------------------------ typography */}
          <Section
            title="Typography"
            description="Eight roles. A component may use nothing else; an arbitrary size is a design-lint failure."
          >
            <div className="flex w-full flex-col">
              {TYPE_ROLES.map(([role, spec, sample]) => (
                <Row key={role} label={role} hint={spec}>
                  <span className={role}>{sample}</span>
                </Row>
              ))}
              <Row
                label="type-data"
                hint="Inter 500, tabular, inherits size"
              >
                <div className="flex flex-col gap-1">
                  <span className="type-data">1,08,240</span>
                  <span className="type-data">4,280</span>
                  <span className="type-data">119</span>
                  <span className="type-label text-ink-muted">
                    Tabular: the digits align in a column. Every numeral in
                    the product carries this.
                  </span>
                </div>
              </Row>
            </div>
          </Section>

          {/* ------------------------------------------------ formatting */}
          <Section
            title="Formatting"
            description="lib/format.ts is the only place a number becomes a string. Amounts are integer paise."
          >
            <Table caption="Formatting utilities and their output">
              <THead>
                <TR>
                  <TH>Function</TH>
                  <TH>Input</TH>
                  <TH numeric>Output</TH>
                </TR>
              </THead>
              <TBody>
                <TR>
                  <TRowHeader><code className="type-data text-sm">formatINR</code></TRowHeader>
                  <TD>rupees(150000)</TD>
                  <TD numeric>{formatINR(rupees(150000))}</TD>
                </TR>
                <TR>
                  <TRowHeader><code className="type-data text-sm">formatINR</code></TRowHeader>
                  <TD>rupees(75000)</TD>
                  <TD numeric>{formatINR(rupees(75000))}</TD>
                </TR>
                <TR>
                  <TRowHeader><code className="type-data text-sm">formatCompactINR</code></TRowHeader>
                  <TD>rupees(150000)</TD>
                  <TD numeric>{formatCompactINR(rupees(150000))}</TD>
                </TR>
                <TR>
                  <TRowHeader><code className="type-data text-sm">formatCompactINR</code></TRowHeader>
                  <TD>rupees(12000000)</TD>
                  <TD numeric>{formatCompactINR(rupees(12000000))}</TD>
                </TR>
                <TR>
                  <TRowHeader><code className="type-data text-sm">formatPercent</code></TRowHeader>
                  <TD>0.042, signed</TD>
                  <TD numeric>{formatPercent(0.042, { signed: true })}</TD>
                </TR>
                <TR>
                  <TRowHeader><code className="type-data text-sm">formatDate</code></TRowHeader>
                  <TD>&quot;2026-08-04&quot;</TD>
                  <TD numeric>{formatDate("2026-08-04")}</TD>
                </TR>
                <TR>
                  <TRowHeader><code className="type-data text-sm">formatMonth</code></TRowHeader>
                  <TD>&quot;2026-08-04&quot;</TD>
                  <TD numeric>{formatMonth("2026-08-04")}</TD>
                </TR>
                <TR>
                  <TRowHeader><code className="type-data text-sm">formatCount</code></TRowHeader>
                  <TD>1204</TD>
                  <TD numeric>{formatCount(1204)}</TD>
                </TR>
              </TBody>
            </Table>

            <div className="flex flex-col gap-2 border border-critical bg-critical-wash px-4 py-4">
              <p className="type-subhead text-critical">Never produced</p>
              <ul className="type-body flex flex-col gap-1 text-ink">
                <li>
                  <span className="type-data">{FORBIDDEN[0]}</span> — Western
                  grouping. The Indian reader parses lakhs by comma position.
                </li>
                <li>
                  <span className="type-data">{FORBIDDEN[1]}</span> and{" "}
                  <span className="type-data">{FORBIDDEN[2]}</span> — not
                  Indian units. Only L and Cr, and only on a chart axis.
                </li>
              </ul>
            </div>
          </Section>

          {/* -------------------------------------------------- geometry */}
          <Section
            title="Geometry"
            description="Radius zero, no shadows. Depth is a border and a surface step."
          >
            <div className="flex w-full flex-col">
              <Row label="Surfaces" hint="the three grounds">
                <span className="flex size-24 items-center justify-center border border-line bg-canvas type-label text-ink-muted">canvas</span>
                <span className="flex size-24 items-center justify-center border border-line bg-surface type-label text-ink-muted">surface</span>
                <span className="flex size-24 items-center justify-center bg-surface-sunken type-label text-ink-muted">sunken</span>
              </Row>
              <Row
                label="Avatar"
                hint="the only circle in the product"
              >
                <div className="flex items-center gap-4">
                  <Avatar name="Priya Sharma" />
                  <Avatar name="Aditya Rao" size="sm" />
                  <p className="type-label prose-measure text-ink-muted">
                    Uses the <code className="type-data">avatar</code>{" "}
                    utility, not a Tailwind class — every radius token is
                    pinned to zero, so the exception is one named thing the
                    linter can point at.
                  </p>
                </div>
              </Row>
              <Row label="Ledger hairline" hint="the signature, at row level">
                <div className="w-full max-w-sm">
                  <Metric
                    label="Dining this month"
                    amount={rupees(4280)}
                    note={`34% of ${formatINR(rupees(12500))} — above your 30% target`}
                    tone="critical"
                  />
                </div>
              </Row>
            </div>
          </Section>

          {/* ------------------------------------------------ marginalia */}
          <Section
            title="The marginalia system"
            description="FinPath's signature element. Annotations sit beside what they annotate, not beneath it."
          >
            <MarginLayout className="w-full">
              <MarginNote>
                SEBI · collegestudents.pdf · p. 14
              </MarginNote>
              <MarginBody>
                <p className="type-body prose-measure text-ink">
                  A systematic investment plan spreads your entry price over
                  time rather than committing everything at one price. It is
                  a schedule, not a product — the thing you buy on that
                  schedule is a separate decision.
                </p>
              </MarginBody>
            </MarginLayout>

            <MarginLayout className="w-full">
              <MarginNote>{`30% of ${formatINR(rupees(15000))}`}</MarginNote>
              <MarginBody>
                <ProgressMeter
                  label="Wants"
                  value={0.34}
                  target={0.3}
                  detail={<Money amount={rupees(5100)} size="sm" />}
                  status="Above your target for this month"
                />
              </MarginBody>
            </MarginLayout>

            <MarginLayout className="w-full">
              <MarginNote />
              <MarginBody>
                <p className="type-body prose-measure text-ink-secondary">
                  An empty margin is correct. The device earns its meaning by
                  being uncommon: a page where every paragraph carries a
                  marginal note is a page where the margin means nothing.
                </p>
              </MarginBody>
            </MarginLayout>
          </Section>

          {/* --------------------------------------------------- buttons */}
          <Section title="Button" description={LIVE_STATE_NOTE}>
            <div className="flex w-full flex-col">
              <Row label="Default" hint="one primary per page">
                <Button variant="primary">Import transactions</Button>
                <Button variant="secondary">Add a transaction</Button>
                <Button variant="quiet">Skip for now</Button>
                <Button variant="critical">Delete account</Button>
              </Row>
              <Row label="Small">
                <Button size="sm" variant="primary">Save</Button>
                <Button size="sm" variant="secondary">Cancel</Button>
              </Row>
              <Row label="Disabled">
                <Button variant="primary" disabled>Import transactions</Button>
                <Button variant="secondary" disabled>Add a transaction</Button>
                <Button variant="quiet" disabled>Skip for now</Button>
                <Button variant="critical" disabled>Delete account</Button>
              </Row>
              <Row label="Loading" hint="width holds; label stays as the name">
                <Button variant="primary" loading>Import transactions</Button>
                <Button variant="secondary" loading loadingLabel="Parsing…">
                  Parse statement
                </Button>
              </Row>
            </div>
          </Section>

          {/* ----------------------------------------------------- input */}
          <Section title="Input and Select" description={LIVE_STATE_NOTE}>
            <div className="grid w-full gap-8 md:grid-cols-2">
              <Input label="Monthly allowance" placeholder="15000" numeric />
              <Input
                label="Email"
                type="email"
                description="We use this to sign you in. Nothing else."
                placeholder="you@example.com"
              />
              <Input
                label="Monthly allowance"
                defaultValue="-200"
                numeric
                error="Enter an amount above zero."
              />
              <Input label="Email" placeholder="you@example.com" disabled />
              <Select label="Where your money comes from" items={SELECT_ITEMS} />
              <Select
                label="Where your money comes from"
                items={SELECT_ITEMS}
                error="Choose one so we can label your income correctly."
              />
              <Select label="Where your money comes from" items={SELECT_ITEMS} disabled />
              <div className="flex flex-col gap-1">
                <span className="type-label text-ink">Bare input</span>
                <BareInput placeholder="Filter merchants" aria-label="Filter merchants" />
                <span className="type-label text-ink-muted">
                  For a composed control that already has its own label.
                </span>
              </div>
            </div>
          </Section>

          {/* ---------------------------------------------------- card */}
          <Section title="Card" description="Used sparingly — a card is for something that genuinely is an object.">
            <div className="grid w-full gap-4 md:grid-cols-3">
              <Card variant="outlined">
                <CardHeader title="Outlined" description="Recedes into the page" />
                <CardBody>
                  <p className="type-body text-ink-secondary">The default.</p>
                </CardBody>
                <CardFooter>
                  <span className="type-label text-ink-muted">Footer</span>
                </CardFooter>
              </Card>
              <Card variant="filled">
                <CardHeader title="Filled" description="Groups without shouting" />
                <CardBody>
                  <p className="type-body text-ink-secondary">Surface ground.</p>
                </CardBody>
              </Card>
              <Card variant="sunken">
                <CardBody>
                  <p className="type-subhead text-ink">Sunken</p>
                  <p className="type-body text-ink-secondary">
                    A well inside another surface.
                  </p>
                </CardBody>
              </Card>
            </div>
          </Section>

          {/* ---------------------------------------------------- badge */}
          <Section title="Badge and status" description="Status is never colour alone — every tone carries a glyph.">
            <div className="flex w-full flex-col">
              <Row label="Badge">
                <Badge>Uncategorised</Badge>
                <Badge tone="positive">On target</Badge>
                <Badge tone="critical">Above target</Badge>
              </Row>
              <Row label="StatusDot" hint="for a crowded table row">
                <StatusDot label="On target" tone="positive" />
                <StatusDot label="Above target" tone="critical" />
                <StatusDot label="No target set" />
              </Row>
              <Row label="Greyscale check" hint="print this — the glyphs still read">
                <p className="type-body prose-measure text-ink-secondary">
                  Because --positive and --critical are 1.21:1 apart, these
                  two badges are nearly identical without their icons. That is
                  the palette enforcing §39 rather than a shortcoming of it.
                </p>
              </Row>
            </div>
          </Section>

          {/* --------------------------------------------------- metric */}
          <Section title="Metric" description="One figure, the ledger hairline, and its provenance.">
            <MetricRow className="w-full">
              <Metric
                label="Financial health"
                value="72"
                note="Savings 28 · Wants 24 · Needs 12 · Buffer 8"
              />
              <Metric
                label="Guilt-free remaining"
                amount={rupees(2340)}
                note={`${formatINR(rupees(78))} a day for the 30 days left`}
              />
              <Metric
                label="Above your dining target"
                amount={rupees(1280)}
                note={`30% of ${formatINR(rupees(15000))} is ${formatINR(rupees(4500))}`}
                tone="critical"
              />
            </MetricRow>
          </Section>

          {/* ------------------------------------------------ money */}
          <Section title="Money" description="The render boundary for every rupee figure. Takes integer paise.">
            <div className="flex w-full flex-col">
              <Row label="Sizes">
                <Money amount={rupees(150000)} size="xl" />
                <Money amount={rupees(150000)} size="lg" />
                <Money amount={rupees(150000)} />
                <Money amount={rupees(150000)} size="sm" />
              </Row>
              <Row label="Tones" hint="critical only when a rule has fired">
                <Money amount={rupees(4280)} />
                <Money amount={rupees(4280)} tone="muted" />
                <Money amount={rupees(4280)} tone="positive" />
                <Money amount={rupees(4280)} tone="critical" />
              </Row>
              <Row label="Variants">
                <Money amount={paise(123456)} withPaise />
                <Money amount={rupees(1250000)} compact />
                <span className="type-label prose-measure text-ink-muted">
                  Compact is for chart axes only. The spoken label stays
                  exact either way — a screen-reader user is never given the
                  abbreviated figure.
                </span>
              </Row>
            </div>
          </Section>

          {/* ---------------------------------------------------- table */}
          <Section title="Table" description="Real table semantics: caption, scoped headers, aria-sort.">
            <Table caption="Recent transactions" showCaption>
              <THead>
                <TR>
                  <TH>Merchant</TH>
                  <TH sort="descending" onSort={() => {}}>Date</TH>
                  <TH numeric sort="none" onSort={() => {}}>Amount</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                <TR>
                  <TRowHeader>Swiggy</TRowHeader>
                  <TD numeric>{formatDate("2026-08-18")}</TD>
                  <TD numeric><Money amount={rupees(380)} size="sm" /></TD>
                  <TD><StatusDot label="Above target" tone="critical" /></TD>
                </TR>
                <TR>
                  <TRowHeader>Hostel Mess Fee</TRowHeader>
                  <TD numeric>{formatDate("2026-08-02")}</TD>
                  <TD numeric><Money amount={rupees(3000)} size="sm" /></TD>
                  <TD><StatusDot label="On target" tone="positive" /></TD>
                </TR>
                <TR>
                  <TRowHeader>PAYTM*QR9F82K</TRowHeader>
                  <TD numeric>{formatDate("2026-08-15")}</TD>
                  <TD numeric><Money amount={rupees(750)} size="sm" /></TD>
                  <TD><Badge>Uncategorised</Badge></TD>
                </TR>
              </TBody>
            </Table>
            <p className="type-label prose-measure text-ink-muted">
              Below 768px transactions stack instead of scrolling sideways
              (§29). That layout belongs to the ledger page, not to this
              primitive — a table you have to drag is a table you cannot read.
            </p>
          </Section>

          {/* --------------------------------------------------- meters */}
          <Section title="ProgressMeter" description="A bar with a target on it. Rendered as a meter, not a progressbar.">
            <div className="flex w-full max-w-xl flex-col gap-6">
              <ProgressMeter
                label="Needs"
                value={0.42}
                target={0.5}
                detail={<Money amount={rupees(6300)} size="sm" />}
                status="Below your target"
              />
              <ProgressMeter
                label="Wants"
                value={0.34}
                target={0.3}
                detail={<Money amount={rupees(5100)} size="sm" />}
                status="Above your target for this month"
              />
              <ProgressMeter
                label="Savings"
                value={0.08}
                target={0.2}
                detail={<Money amount={rupees(1200)} size="sm" />}
                status="Below your target"
              />
            </div>
          </Section>

          {/* --------------------------------------------------- states */}
          <Section title="Empty, loading and error" description="Every data surface has all three. A blank screen is an omission, not a state.">
            <div className="grid w-full gap-4 lg:grid-cols-3">
              <EmptyState
                title="No transactions yet"
                description="FinPath needs a month of spending before it can tell you anything true about it."
                action={
                  <>
                    <Button variant="primary" size="sm">Import transactions</Button>
                    <Button variant="secondary" size="sm">Add one</Button>
                  </>
                }
              />
              <div className="border border-line bg-surface px-4 py-8">
                <LoadingState lines={4} />
                <p className="type-label mt-4 text-ink-muted">
                  Static blocks. No shimmer — an animated placeholder fakes
                  activity, and it has to stop under reduced motion anyway.
                </p>
              </div>
              <ErrorState
                detail="http://127.0.0.1:8000/api/spending returned 500 Internal Server Error. The response body was empty."
                onRetry={<Button variant="secondary" size="sm">Try again</Button>}
              />
            </div>
            <Row label="Skeleton" hint="one block, sized by the caller">
              <div className="flex w-full max-w-sm flex-col gap-2">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton />
                <Skeleton className="w-3/4" />
              </div>
            </Row>
          </Section>

          {/* --------------------------------------------------- overlays */}
          <Section title="Modal, Sheet, Tooltip" description="Overlays are bounded by --line-strong: there is no shadow to lift them.">
            <div className="flex w-full flex-wrap gap-4">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>
                Open modal
              </Button>
              <Modal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title="Delete your account?"
                description="This removes your profile, your transactions and your plan. It cannot be undone."
                footer={
                  <ButtonRow>
                    <ModalClose />
                    <Button variant="critical">Delete everything</Button>
                  </ButtonRow>
                }
              >
                <p className="type-body text-ink-secondary">
                  You can export your data first — it downloads as JSON or CSV.
                </p>
              </Modal>

              <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                Open sheet
              </Button>
              <Sheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                title="Filter transactions"
                description="Applies to the ledger below."
              >
                <div className="flex flex-col gap-4">
                  <Select label="Category" items={SELECT_ITEMS} />
                  <Input label="Merchant contains" placeholder="Swiggy" />
                </div>
              </Sheet>

              <Tooltip label="Registered with SEBI">
                <Button variant="quiet">Hover or focus me</Button>
              </Tooltip>
            </div>
            <p className="type-label prose-measure text-ink-muted">
              A tooltip may only hold a label for something already visible.
              Provenance, rules and qualifications go in the margin — that is
              what the marginalia system is for.
            </p>
          </Section>

          {/* ----------------------------------------------------- tabs */}
          <Section title="Tabs" description="Second-level navigation. Active state is a rule plus weight, never colour.">
            <Tabs defaultValue="ledger" label="Spending views" className="w-full">
              <TabList>
                <Tab value="overview">Overview</Tab>
                <Tab value="ledger">Ledger</Tab>
                <Tab value="import">Import</Tab>
              </TabList>
              <TabPanel value="overview">
                <p className="type-body text-ink-secondary">Overview panel.</p>
              </TabPanel>
              <TabPanel value="ledger">
                <p className="type-body text-ink-secondary">Ledger panel.</p>
              </TabPanel>
              <TabPanel value="import">
                <p className="type-body text-ink-secondary">Import panel.</p>
              </TabPanel>
            </Tabs>
          </Section>

          {/* ------------------------------------------------- citations */}
          <Section title="Citation and SourcePanel" description="No citation, no substantive regulatory claim.">
            <div className="grid w-full gap-8 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <p className="type-body prose-measure text-ink">
                  A systematic investment plan spreads your entry price over
                  time <Citation n={1} source="collegestudents.pdf" page={14} active />
                  , and any intermediary you deal with should be registered
                  with the regulator before you part with money{" "}
                  <Citation n={2} source="collegestudents.pdf" page={27} />.
                </p>
                <UnverifiedNote />
              </div>
              <SourcePanel entries={SOURCE_FIXTURE} activeN={1} />
            </div>
            <p className="type-label prose-measure text-ink-muted">
              Both entries show &ldquo;not stated in the document&rdquo; for
              their dates. The index stores source, page, content and
              embedding — no date among them — and inventing one under a
              regulator&rsquo;s name is precisely the failure the citation
              rule exists to prevent.
            </p>
          </Section>

          {/* ---------------------------------------------------- toast */}
          <Section title="Toast" description="For confirming what already happened — never for an error the user must act on.">
            <ToastDemo />
          </Section>

          {/* ---------------------------------------------------- shell */}
          <Section title="Header, Sidebar and navigation" description="Text labels at every width; icons support, never replace.">
            <div className="w-full border border-line">
              <Header
                user={{ name: "Priya Sharma" }}
                actions={<Button size="sm" variant="quiet">Sign out</Button>}
              />
              <div className="flex">
                <Sidebar
                  items={NAV_ITEMS}
                  currentPath="/app/spending"
                  className="hidden md:flex"
                />
                <div className="flex-1 px-4 py-8">
                  <p className="type-body text-ink-secondary">
                    Content area. The sidebar is one level deep — second-level
                    routes are Tabs under the page header, so the reader always
                    knows which of two hierarchies they are moving in.
                  </p>
                </div>
              </div>
              <div className="relative h-16 md:hidden">
                <MobileNav
                  items={NAV_ITEMS.slice(0, 5)}
                  currentPath="/app/spending"
                  className="absolute"
                />
              </div>
            </div>
          </Section>

          <Section
            title="ScoreDial"
            description="The one dominant figure on /home. An open arc, so the score reads as a position on a scale rather than a percentage complete."
          >
            <ScoreDial
              score={62}
              band="Stable"
              caption="Savings are on target. Discretionary spending is over the 30% line."
            />
          </Section>

          <Section
            title="DistributionBar"
            description="A stacked band, not a pie: lengths against a shared baseline are read accurately, angles are not. The legend is the data table."
          >
            <DistributionBar
              total={24000}
              slices={[
                {
                  key: "needs",
                  label: "Essentials",
                  value: 11400,
                  display: <Money amount={rupees(11400)} size="sm" />,
                },
                {
                  key: "wants",
                  label: "Discretionary",
                  value: 8600,
                  flagged: true,
                  display: <Money amount={rupees(8600)} size="sm" />,
                },
                {
                  key: "savings",
                  label: "Set aside",
                  value: 4000,
                  display: <Money amount={rupees(4000)} size="sm" />,
                },
              ]}
            />
          </Section>

          <Section
            title="Insight and ActionCard"
            description="One finding with a figure and one route to the fix. Never a list of five — a page with five opportunities has named none."
          >
            <Insight
              title="Discretionary spending is above your target"
              detail="That is the largest amount you could redirect this month without earning a rupee more."
              tone="critical"
              amount={<Money amount={rupees(1400)} size="xl" />}
              amountLabel="Worked out from your own figures, not a rule of thumb."
              action={<Button variant="primary">Review spending</Button>}
            />
            <ActionCard
              n={1}
              title="Set up a monthly instruction for your savings target"
              why="Investing after spending is investing with whatever is left. Dating the instruction to the day after income arrives reverses that."
            />
          </Section>

          <Section
            title="Timeline"
            description="Vertical, because the stages take wildly different lengths of time and exactly one is ever live."
          >
            <Timeline>
              <TimelineStage
                n={1}
                title="Clear what you owe at the highest rate"
                purpose="No balance rolling over on a card or a pay-later plan."
                status="complete"
              />
              <TimelineStage
                n={2}
                title="Build three months of breathing room"
                purpose="Enough cash to cover your essentials if income stops."
                status="attention"
              >
                <ProgressMeter
                  label="Buffer progress"
                  value={0.42}
                  detail="42%"
                  status="Measured against three months of the essentials you declared."
                />
              </TimelineStage>
              <TimelineStage
                n={3}
                title="Let it compound"
                purpose="Contributions that rise with income, reviewed once a year."
                status="upcoming"
                last
              />
            </Timeline>
          </Section>

          <Section
            title="Slider, Segmented and Stepper"
            description={LIVE_STATE_NOTE}
          >
            <StyleguideControls />
          </Section>

          <Section
            title="Choice, Checkbox and PasswordInput"
            description="All three wrap a real native input: the space bar, the form value and the platform touch target come free and cannot be reimplemented."
          >
            <StyleguideForms />
          </Section>

          <Section
            title="ChartFrame"
            description="Everything that has to be true around a chart: one insight in words, the assumptions, and the data as a real table for screen readers."
          >
            <ChartFrame
              title="What this becomes"
              insight="The gap between the two lines is what a small annual increase is worth. It opens slowly and then does not stop."
              assumptions="Illustrative compounding at 12% a year over 10 years. Real returns vary and are not guaranteed."
              rowHeader="Year"
              rowLabels={["0", "5", "10"]}
              series={[
                {
                  label: "Rising 10% a year",
                  values: [
                    formatINR(rupees(0)),
                    formatINR(rupees(230000)),
                    formatINR(rupees(640000)),
                  ],
                },
              ]}
            >
              <div className="flex h-32 items-end gap-1 border-b border-line">
                {[8, 18, 30, 46, 68, 100].map((h) => (
                  <span
                    key={h}
                    className="flex-1 bg-accent"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </ChartFrame>
          </Section>

          <Section
            title="DropZone and Provenance"
            description="Where a file comes in, and where every figure says what it was built from."
          >
            <Provenance source="The figures you entered" />
            <Provenance source="An example month" illustrative />
            <DropZone
              label="Drop your statement here, or choose a file"
              hint="A CSV export from your bank."
              privacyNote="Your file stays in your browser. It is parsed on this device and never uploaded."
              onFile={() => {}}
            />
          </Section>

          <Section
            title="DisclaimerNote"
            description="The compliance copy lives in one file. Never retyped at a call site, so a wording change is one edit and an audit is one grep."
          >
            <div className="flex flex-col gap-2">
              <DisclaimerNote variant="advice" />
              <DisclaimerNote variant="projection" />
              <DisclaimerNote variant="example" />
            </div>
          </Section>

          <footer className="border-t border-line pt-8">
            <p className="type-label prose-measure text-ink-muted">
              The complete inventory. Every application page is built from
              exactly these primitives, and{" "}
              <code className="type-data">npm run design-lint</code> reports a
              baseline of zero — nothing outside app/globals.css introduces a
              colour, a radius, a shadow or an arbitrary size.
            </p>
          </footer>
        </main>
      </ToastProvider>
    </TooltipProvider>
  );
}

function ToastDemo() {
  const toast = useToast();
  return (
    <ButtonRow align="start">
      <Button
        variant="secondary"
        onClick={() =>
          toast.add({
            title: "Transactions imported",
            description: "42 rows imported, 3 skipped. The skip report is ready to download.",
          })
        }
      >
        Show a toast
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.add({
            title: "Profile saved",
            description: `Your allowance is now ${formatINR(rupees(15000))} a month.`,
          })
        }
      >
        Show another
      </Button>
    </ButtonRow>
  );
}

/** Live controls. Kept out of the page body so their state stays local. */
function StyleguideControls() {
  const [monthly, setMonthly] = React.useState(4000);
  const [horizon, setHorizon] = React.useState("10");

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <Stepper current={3} total={8} label="What must you pay?" />
      <Slider
        label="Invested each month"
        value={monthly}
        onValueChange={setMonthly}
        min={500}
        max={20000}
        step={500}
        display={formatINR(rupees(monthly))}
        bounds={[formatINR(rupees(500)), formatINR(rupees(20000))]}
        description="The value is always rendered as text. A slider whose position is the only readout cannot be checked."
      />
      <Segmented
        label="Time horizon"
        value={horizon}
        onValueChange={setHorizon}
        segments={[
          { value: "10", label: "10 years" },
          { value: "20", label: "20 years" },
          { value: "30", label: "30 years" },
        ]}
      />
    </div>
  );
}

function StyleguideForms() {
  const [password, setPassword] = React.useState("");
  const [checked, setChecked] = React.useState(true);
  const [choice, setChoice] = React.useState(true);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <PasswordInput
        label="Password"
        autoComplete="new-password"
        value={password}
        onValueChange={setPassword}
        description="At least 10 characters. The reveal toggle is a security feature: it makes a long passphrase typeable."
      />
      <Checkbox
        label="Pay the full statement balance"
        description="Not the minimum."
        checked={checked}
        onCheckedChange={setChecked}
      />
      <Choice
        label="Safety first"
        description="Clear debt and build a cash buffer before anything else."
        checked={choice}
        onSelect={setChoice}
      />
    </div>
  );
}
