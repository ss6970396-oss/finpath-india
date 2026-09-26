"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import {
  Button,
  Input,
  Notice,
  PasswordInput,
} from "@/components/ui";
import {
  AuthError,
  MIN_PASSWORD_LENGTH,
  isEmailShaped,
  passwordProblem,
} from "@/lib/auth";
import { useAuth } from "../../providers/AuthProvider";
import { DeviceAccountNote } from "../DeviceAccountNote";

/**
 * Create an account (§4).
 *
 * THE PASSWORD RULE IS A LENGTH RULE. Ten characters, and a refusal of
 * digits alone. No "one uppercase, one symbol" theatre: those rules are
 * well established to push people toward `Password1!` and a sticky note,
 * where length is the property that actually resists guessing. The helper
 * text states the rule before it is broken rather than after.
 *
 * There is no "confirm password" field. The reveal toggle on the field
 * itself solves the typo problem that confirmation was invented for, and
 * does it without doubling the typing on a phone.
 */
export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signUp } = useAuth();
  // B-8: where the student was going before they had an account.
  const next = safeNext(params.get("next"));

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  const nameError =
    touched && name.trim().length === 0
      ? "Tell us what to call you."
      : undefined;
  const emailError =
    touched && !isEmailShaped(email) ? "Enter a valid email address." : undefined;
  const pwProblem = passwordProblem(password);
  const passwordError = touched && pwProblem ? pwProblem : undefined;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFailure(null);
    if (!name.trim() || !isEmailShaped(email) || pwProblem) return;

    setSubmitting(true);
    try {
      await signUp(name, email, password);
      // Straight into onboarding: an account with no figures in it has
      // nothing to show, and /home would be an empty state on arrival.
      router.replace(
        next ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding",
      );
    } catch (err) {
      setFailure(
        err instanceof AuthError
          ? err.message
          : "The account could not be created. Try again in a moment.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="type-display text-ink">Create your account</h1>
        <p className="type-body text-ink-secondary">
          Eight short questions after this, and you will have a plan built
          from your own numbers.
        </p>
      </div>

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {failure ? (
          <Notice tone="critical" announce="alert" title="Account not created">
            {failure}
          </Notice>
        ) : null}

        <Input
          label="Your name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFailure(null);
          }}
          onBlur={() => setTouched(true)}
          error={nameError}
          description="Used to greet you. Nothing else."
          placeholder="Ananya"
        />

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
          autoComplete="new-password"
          value={password}
          onValueChange={(v) => {
            setPassword(v);
            setFailure(null);
          }}
          error={passwordError}
          description={`At least ${MIN_PASSWORD_LENGTH} characters. A short phrase you will remember beats a short password you will not.`}
        />

        <Button type="submit" variant="primary" loading={submitting}>
          Create account
        </Button>

        <p className="type-label text-ink-muted">
          FinPath is an educational tool. It does not hold money, connect to
          your bank, or recommend any named product.
        </p>
      </form>

      <p className="type-body text-ink-secondary">
        Already have an account?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="text-accent underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>

      <DeviceAccountNote />
    </div>
  );
}
