import Link from "next/link";
import { Wordmark } from "@/components/ui";

/**
 * The authentication shell (§4) — branding left, form right.
 *
 * The left panel is not decoration and it is not a stock photograph. It
 * carries the three sentences that answer "why would I hand this thing my
 * money data", because that question is answered at the sign-up form or it
 * is not answered at all.
 *
 * Below 1024px the panel is dropped rather than stacked. On a phone the
 * only job of this screen is the form, and a full viewport of brand copy
 * above it is a scroll between a student and the thing they came to do.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-line bg-surface px-12 py-12 lg:flex">
        <Wordmark href="/" />

        <div className="flex flex-col gap-8">
          <p className="type-display prose-measure text-ink">
            Money advice you can check, not just follow.
          </p>

          <ul className="flex flex-col gap-4">
            {[
              {
                title: "Every figure shows its working",
                body: "Each number names the rule behind it and the data it was read from. Nothing is asserted.",
              },
              {
                title: "Answers cite a real document",
                body: "The coach reads RBI, SEBI and NCFE publications and quotes the page. When it cannot, it says so.",
              },
              {
                title: "Your statement stays in your browser",
                body: "Uploaded files are parsed on your own device. They are never sent anywhere.",
              },
            ].map((item) => (
              <li key={item.title} className="border-l-2 border-line-strong pl-4">
                <p className="type-subhead text-ink">{item.title}</p>
                <p className="type-body prose-measure text-ink-secondary">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="type-label text-ink-muted">
          FinPath provides educational and planning information and is not a
          substitute for personalised financial advice.
        </p>
      </aside>

      <main
        id="main"
        className="flex flex-col items-center justify-center px-4 py-12"
      >
        <div className="flex w-full max-w-(--container-form) flex-col gap-8">
          <div className="lg:hidden">
            <Wordmark href="/" />
          </div>
          {children}
          <p className="type-label text-ink-muted">
            <Link
              href="/"
              className="underline underline-offset-4 hover:text-ink"
            >
              Back to the home page
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
