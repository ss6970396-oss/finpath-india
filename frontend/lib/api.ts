/**
 * One honest reporter for every backend call.
 *
 * The old code printed "Could not reach the API on port 8000. Start it with
 * `fastapi dev main.py`" from a bare `.catch()`, so it fired on CORS
 * rejections, 500s, timeouts, 404s and JSON parse errors alike — every one of
 * which it then blamed on a server that was usually running fine. That message
 * cost more debugging time than the bugs it was hiding.
 *
 * The rules here:
 *   - say the URL that was actually attempted, always
 *   - a response that came back reports status, statusText and its body
 *   - a network-level failure reports err.name and err.message verbatim
 *   - a timeout says so, and says how long it waited
 *   - "start the backend" is only ever suggested when the failure was a
 *     network error AND a health probe also fails
 */

/** Requests hang forever without this; a hung chat looks identical to a dead one. */
export const DEFAULT_TIMEOUT_MS = 20_000;

export type FailureKind = "http" | "network" | "timeout" | "parse";

export class ApiError extends Error {
  readonly url: string;
  readonly kind: FailureKind;
  readonly status?: number;
  readonly statusText?: string;
  readonly bodyText?: string;
  readonly cause?: unknown;

  constructor(init: {
    url: string;
    kind: FailureKind;
    message: string;
    status?: number;
    statusText?: string;
    bodyText?: string;
    cause?: unknown;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.url = init.url;
    this.kind = init.kind;
    this.status = init.status;
    this.statusText = init.statusText;
    this.bodyText = init.bodyText;
    this.cause = init.cause;
  }
}

/** The origin of the API, derived from the URL actually being called. */
function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Is the backend answering at all?
 *
 * Deliberately a separate, short-timeout request: it is the only thing that
 * can distinguish "the server is down" from "the server is up and rejected
 * this particular request". Any answer at all — even a 500 — proves the
 * process is listening, so only a thrown error counts as unreachable.
 */
export async function backendReachable(origin: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      await fetch(`${origin}/health`, { signal: controller.signal });
      return true;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

/**
 * fetch() that throws a described ApiError instead of returning a non-ok
 * Response or a bare TypeError. Logs the URL with every failure.
 */
export async function apiFetch(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[finpath] ${init?.method ?? "GET"} ${url}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    const e = err as Error;
    // An aborted request is our own timeout firing, not a server fault.
    const kind: FailureKind = e.name === "AbortError" ? "timeout" : "network";
    const message =
      kind === "timeout"
        ? `Request timed out after ${Math.round(timeoutMs / 1000)}s.`
        : `${e.name}: ${e.message}`;
    console.error(`[finpath] ${kind} failure on ${url} —`, e);
    throw new ApiError({ url, kind, message, cause: err });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    // Read the body: FastAPI puts the useful part (validation detail, the
    // traceback summary) in there, and it is discarded by a bare status check.
    let bodyText = "";
    try {
      bodyText = (await res.text()).trim();
    } catch {
      bodyText = "";
    }
    console.error(
      `[finpath] HTTP ${res.status} ${res.statusText} on ${url}`,
      bodyText || "(empty body)",
    );
    throw new ApiError({
      url,
      kind: "http",
      status: res.status,
      statusText: res.statusText,
      bodyText,
      message: `HTTP ${res.status} ${res.statusText}`,
    });
  }

  return res;
}

/** apiFetch + JSON decode, with a parse failure reported as such. */
export async function apiJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs?: number,
): Promise<T> {
  const res = await apiFetch(url, init, timeoutMs);
  try {
    return (await res.json()) as T;
  } catch (err) {
    const e = err as Error;
    console.error(`[finpath] could not parse JSON from ${url} —`, e);
    throw new ApiError({
      url,
      kind: "parse",
      message: `The response from ${url} was not valid JSON (${e.message}).`,
      cause: err,
    });
  }
}

const TRUNCATE = 300;

function shortBody(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > TRUNCATE ? `${clean.slice(0, TRUNCATE)}…` : clean;
}

/**
 * Turn a failure into something a human can act on.
 *
 * Async because the "is it even running?" question can only be answered by
 * asking, and that answer is what decides whether to mention starting the
 * backend at all.
 */
export async function describeApiFailure(
  err: unknown,
  fallbackUrl: string,
): Promise<string> {
  if (!(err instanceof ApiError)) {
    const e = err as Error;
    return `Unexpected failure calling ${fallbackUrl} — ${e?.name ?? "Error"}: ${
      e?.message ?? String(err)
    }`;
  }

  if (err.kind === "http") {
    const body = shortBody(err.bodyText ?? "");
    return (
      `${err.url} returned ${err.status} ${err.statusText}.` +
      (body ? ` Response body: ${body}` : " The response body was empty.")
    );
  }

  if (err.kind === "parse") return err.message;

  if (err.kind === "timeout") {
    return `${err.url} did not respond in time. ${err.message} The server may be reachable but stuck on this request.`;
  }

  // Network-level. Only here is "is it running?" a sensible question, and only
  // here do we get to blame the server.
  const origin = originOf(err.url);

  // When the call that failed IS the health probe, re-probing would just
  // restate the same failure and the message would name the URL twice.
  const isHealthProbe = err.url.endsWith("/health");
  const reachable =
    !isHealthProbe && origin ? await backendReachable(origin) : false;

  if (reachable) {
    return (
      `${err.url} failed at the network layer (${err.message}), but ${origin}/health ` +
      `answered — so the server is running and something rejected this specific ` +
      `request. The usual cause is CORS: check that the backend allows this page's origin.`
    );
  }

  const alsoHealth = isHealthProbe
    ? ""
    : ` ${origin ?? "The API"}/health did not answer either.`;

  return (
    `Could not reach ${err.url} (${err.message}).${alsoHealth} Start the backend ` +
    `with \`fastapi dev main.py\` from backend/, or set NEXT_PUBLIC_API_URL if it ` +
    `is running somewhere else.`
  );
}

/* ------------------------------------------------------- health indicator */

export type HealthState =
  | { status: "checking" }
  | { status: "ok"; documents: number | null }
  | { status: "degraded"; detail: string; documents: number | null }
  | { status: "down"; detail: string };

type HealthPayload = {
  status?: string;
  documents?: number | null;
  detail?: string;
};

/**
 * Ask the backend how it is, for the connection indicator. Never throws —
 * an indicator that crashes the page it is reporting on is worse than useless.
 */
export async function checkHealth(origin: string): Promise<HealthState> {
  const url = `${origin}/health`;
  try {
    const payload = await apiJson<HealthPayload>(url, undefined, 6000);
    if (payload.status === "ok") {
      return { status: "ok", documents: payload.documents ?? null };
    }
    return {
      status: "degraded",
      detail: payload.detail ?? `Backend reported "${payload.status}".`,
      documents: payload.documents ?? null,
    };
  } catch (err) {
    return { status: "down", detail: await describeApiFailure(err, url) };
  }
}
