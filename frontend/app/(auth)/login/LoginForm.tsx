"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, PasswordInput } from "@/components/ui";
import { AuthError, isEmailShaped } from "@/lib/auth";
import { useAuth } from "../../providers/AuthProvider";
import { useFinPath } from "../../providers/FinPathProvider";
import { DeviceAccountNote } from "../DeviceAccountNote";

/**
 * Sign in (§4).
 *
 * VALIDATION TIMING. Nothing is marked invalid while it is being typed —
 * a field that turns red at the second character is scolding someone for
 * not having finished. Errors appear on submit and on blur-after-touch,
 * and clear as soon as the field is edited.
 *
 * FAILURE WORDING. One message for both a wrong password and an unknown
 * address, because two different messages is an account-enumeration oracle:
 * it tells anyone with a list of emails which ones are registered here.
 * lib/auth.ts does the matching work in both cases so the timing does not
 * leak it either.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useAuth();
  const { onboarded } = useFinPath();

  const next = params.get("next");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  const emailError =
    touched && !isEmailShaped(email) ? "Enter a valid email address." : undefined;
  const passwordError =
    touched && password.length === 0 ? "Enter your password." : undefined;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFailure(null);
    if (!isEmailShaped(email) || password.length === 0) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      // Onboarding is what the app's own guard checks next, so send an
      // unfinished profile straight there rather than through a bounce.
      router.replace(onboarded ? (next ?? "/home") : "/onboarding");
    } catch (err) {
      setFailure(
        err instanceof AuthError
          ? err.message
          : "Sign-in could not be completed. Try again in a moment.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="type-display text-ink">Welcome back</h1>
        <p className="type-body text-ink-secondary">
          Sign in to pick up where you left off.
        </p>
      </div>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {failure ? (
          // role="alert" so the failure is announced without moving focus
          // away from the field the student is about to correct.
          <p
            role="alert"
            className="type-label border border-critical bg-critical-wash px-2 py-2 text-critical"
          >
            {failure}
          </p>
        ) : null}

        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFailure(null);
          }}
          onBlur={() => setTouched(true)}
          error={emailError}
          placeholder="you@example.com"
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          value={password}
          onValueChange={(v) => {
            setPassword(v);
            setFailure(null);
          }}
          error={passwordError}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="type-label text-ink-secondary underline underline-offset-4 hover:text-ink"
          >
            Forgotten your password?
          </Link>
        </div>

        <Button type="submit" variant="primary" loading={submitting}>
          Sign in
        </Button>
      </form>

      <p className="type-body text-ink-secondary">
        New here?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="text-accent underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>

      <DeviceAccountNote />
    </div>
  );
}
