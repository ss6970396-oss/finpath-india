"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { isEmailShaped } from "@/lib/auth";
import { useAuth } from "../../providers/AuthProvider";

/**
 * Password reset (§4).
 *
 * TWO HONEST THINGS HAPPEN HERE, and they pull in opposite directions.
 *
 * 1. The response NEVER says whether the address is registered. "If that
 *    address has an account, we have sent a link" is not evasiveness; a
 *    form that says "no such user" hands anyone a way to test a list of
 *    email addresses against this service.
 *
 * 2. On a build with no authentication server there is no mail transport,
 *    so no link is sent, and pretending otherwise would be the one outright
 *    lie in the product. When the device adapter is in force the screen
 *    says plainly that recovery is not possible and what the actual
 *    remedy is.
 *
 * The two coexist: the generic message is what a real deployment returns,
 * and the device notice is what THIS deployment can actually do.
 */
export default function ForgotPasswordPage() {
  const { requestPasswordReset, isDeviceLocal } = useAuth();

  const [email, setEmail] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const emailError =
    touched && !isEmailShaped(email) ? "Enter a valid email address." : undefined;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isEmailShaped(email)) return;
    setSubmitting(true);
    await requestPasswordReset(email);
    setSubmitting(false);
    setSent(true);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="type-display text-ink">Reset your password</h1>
        <p className="type-body text-ink-secondary">
          Enter the email you signed up with.
        </p>
      </div>

      {sent ? (
        <div className="flex flex-col gap-4" aria-live="polite">
          <div className="border border-line-strong bg-surface px-4 py-4">
            <h2 className="type-subhead text-ink">Request received</h2>
            <p className="type-body prose-measure mt-1 text-ink-secondary">
              If an account exists for that address, a reset link is on its
              way. We do not confirm either way — that would let anyone check
              which addresses are registered here.
            </p>
          </div>

          {isDeviceLocal ? (
            <div className="border border-critical bg-critical-wash px-4 py-4">
              <h2 className="type-subhead text-critical">
                On this build, no email can be sent
              </h2>
              <p className="type-body prose-measure mt-1 text-ink">
                This installation has no authentication server and no mail
                transport, so nothing was actually sent. Accounts here live in
                your browser: if the password is lost, create a new account —
                the figures you entered are stored separately and will still
                be there.
              </p>
            </div>
          ) : null}

          <p className="type-body text-ink-secondary">
            <Link
              href="/login"
              className="text-accent underline underline-offset-4"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            error={emailError}
            placeholder="you@example.com"
          />

          <Button type="submit" variant="primary" loading={submitting}>
            Send reset link
          </Button>

          <p className="type-body text-ink-secondary">
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-ink"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
