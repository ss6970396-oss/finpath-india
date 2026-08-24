/**
 * The FinPath primitive inventory (§17).
 *
 * Application code imports from `@/components/ui` — never from an
 * individual file — so the inventory stays a single reviewable surface and
 * `/styleguide` can prove it is complete.
 *
 * Every primitive here is built on the thirteen tokens and the six type
 * roles in app/globals.css. None of them owns a colour, a radius or a size.
 *
 * `components/finpath/` is the pre-rebuild set and is NOT re-exported here.
 * It is deleted in Phase 3 as each page moves across.
 */

export { Avatar } from "./avatar";
export { Badge, StatusDot } from "./badge";
export { Button, ButtonRow, type ButtonProps } from "./button";
export { Card, CardBody, CardFooter, CardHeader } from "./card";
export { Citation, UnverifiedNote } from "./citation";
export { Header, SkipLink, Wordmark } from "./header";
export { BareInput, Input, type InputProps } from "./input";
export {
  Annotated,
  MarginBody,
  MarginLayout,
  MarginNote,
} from "./margin-note";
export { Metric, MetricRow } from "./metric";
export { Modal, ModalClose } from "./modal";
export { Money } from "./money";
export { PageHeader, Section } from "./page-header";
export { ProgressMeter } from "./progress-meter";
export { Select, type SelectItem, type SelectProps } from "./select";
export { Sheet } from "./sheet";
export { MobileNav, Sidebar, type NavItem } from "./sidebar";
export { SourcePanel, type SourceEntry } from "./source-panel";
export { EmptyState, ErrorState, LoadingState, Skeleton } from "./states";
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
export { ToastProvider, useToast } from "./toast";
export { Tooltip, TooltipProvider } from "./tooltip";
