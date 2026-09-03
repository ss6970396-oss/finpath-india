/**
 * The FinPath primitive inventory (§13, §17).
 *
 * Application code imports from `@/components/ui` — never from an
 * individual file — so the inventory stays a single reviewable surface and
 * `/styleguide` can prove it is complete.
 *
 * Every primitive here is built on the fifteen colour tokens and the eight
 * type roles in app/globals.css. None of them owns a colour, a radius or a
 * size of its own.
 */

export { Avatar } from "./avatar";
export { Badge, StatusDot } from "./badge";
export {
  Button,
  ButtonLink,
  ButtonRow,
  buttonClass,
  type ButtonProps,
  type ButtonVariant,
} from "./button";
export { Card, CardBody, CardFooter, CardHeader } from "./card";
export { ChartFrame, type ChartSeries } from "./chart-frame";
export { Checkbox, Choice } from "./choice";
export { Citation, UnverifiedNote } from "./citation";
export { DisclaimerNote, type DisclaimerVariant } from "./disclaimer";
export { DistributionBar, type Slice } from "./distribution";
export { DropZone } from "./drop-zone";
export { SiteFooter } from "./footer";
export { Header, SkipLink, Wordmark } from "./header";
export { ActionCard, Insight } from "./insight";
export { BareInput, Input, type InputProps } from "./input";
export {
  Annotated,
  MarginBody,
  MarginLayout,
  MarginNote,
} from "./margin-note";
export { Menu, MenuAction, MenuHeading, MenuLink, MenuSeparator } from "./menu";
export { Metric, MetricRow } from "./metric";
export { Modal, ModalClose } from "./modal";
export { Money } from "./money";
export { PageHeader, Section } from "./page-header";
export { PasswordInput } from "./password-input";
export { ProgressMeter } from "./progress-meter";
export { Provenance } from "./provenance";
export { ScoreDial } from "./score-dial";
export { Segmented, type Segment } from "./segmented";
export { Select, type SelectItem, type SelectProps } from "./select";
export { Sheet } from "./sheet";
export { MobileNav, Sidebar, type NavItem } from "./sidebar";
export { Slider } from "./slider";
export { SourcePanel, type SourceEntry } from "./source-panel";
export { EmptyState, ErrorState, LoadingState, Skeleton } from "./states";
export { Stepper } from "./stepper";
export { Tab, TabList, TabPanel, Tabs } from "./tabs";
export {
  TBody,
  TD,
  TH,
  THead,
  TR,
  TRowHeader,
  Table,
  TableScroll,
  type SortDirection,
} from "./table";
export { Timeline, TimelineStage, type TimelineStatus } from "./timeline";
export { ToastProvider, useToast } from "./toast";
export { Tooltip, TooltipProvider } from "./tooltip";
