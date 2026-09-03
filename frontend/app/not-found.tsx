import { ButtonLink, SiteFooter } from "@/components/ui";
import { PublicHeader } from "./components/PublicHeader";

/**
 * 404 (§22).
 *
 * It names the likely cause and offers the two routes anyone arriving here
 * actually wants. It does not apologise at length, and it does not show a
 * cartoon: a page about somebody's money is not the place to be whimsical
 * about having lost their way.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <main
        id="main"
        className="page-shell flex w-full flex-1 flex-col items-start justify-center gap-8 py-16"
      >
        <div className="flex max-w-2xl flex-col gap-4">
          <p className="type-eyebrow text-ink-muted">Page not found</p>
          <h1 className="type-display text-ink">
            That address doesn&rsquo;t lead anywhere.
          </h1>
          <p className="type-body prose-measure text-ink-secondary">
            Some of FinPath&rsquo;s pages were renamed — the dashboard is now
            Home, the simulator is What-if, and the counsellor is Ask. Old
            links to those still resolve, so this is more likely a typo or a
            page that never existed.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/home" variant="primary">
            Go to Home
          </ButtonLink>
          <ButtonLink href="/">Back to the front page</ButtonLink>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
