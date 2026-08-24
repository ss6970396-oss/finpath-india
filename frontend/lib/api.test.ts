import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiJson, describeApiFailure } from "./api";

/**
 * These tests exist because the bug being fixed was not a broken request — it
 * was a truthful-looking message that lied. Every case below asserts on what
 * the user is actually told.
 */

const URL_UNDER_TEST = "http://127.0.0.1:8000/api/chat";

function response(body: string, init: ResponseInit) {
  return new Response(body, init);
}

/** Run a call and return the message the user would see. */
async function messageFor(fetchImpl: typeof fetch): Promise<string> {
  vi.stubGlobal("fetch", fetchImpl);
  try {
    await apiFetch(URL_UNDER_TEST, { method: "POST" }, 50);
    throw new Error("expected the call to fail");
  } catch (err) {
    return describeApiFailure(err, URL_UNDER_TEST);
  }
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("HTTP failures", () => {
  it("reports status, statusText and the response body", async () => {
    const msg = await messageFor(async () =>
      response('{"detail":"field required: message"}', {
        status: 422,
        statusText: "Unprocessable Entity",
      }),
    );
    expect(msg).toContain(URL_UNDER_TEST);
    expect(msg).toContain("422");
    expect(msg).toContain("Unprocessable Entity");
    expect(msg).toContain("field required: message");
  });

  it("says so explicitly when the body is empty", async () => {
    const msg = await messageFor(async () =>
      response("", { status: 500, statusText: "Internal Server Error" }),
    );
    expect(msg).toContain("500");
    expect(msg).toContain("response body was empty");
  });

  it("never blames a server that answered", async () => {
    const msg = await messageFor(async () =>
      response("nope", { status: 404, statusText: "Not Found" }),
    );
    // A 404 means the server IS running. Telling the user to start it is the
    // exact lie this whole change exists to remove.
    expect(msg).not.toContain("fastapi dev");
    expect(msg).not.toContain("Could not reach");
  });
});

describe("network failures", () => {
  it("suggests starting the backend only when /health also fails", async () => {
    const msg = await messageFor(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(msg).toContain(URL_UNDER_TEST);
    expect(msg).toContain("TypeError");
    expect(msg).toContain("Failed to fetch");
    expect(msg).toContain("fastapi dev");
    expect(msg).toContain("NEXT_PUBLIC_API_URL");
  });

  it("points at CORS instead when /health answers", async () => {
    // The request failed but the server is demonstrably up: that is the CORS
    // signature, and it is what the old message hid completely.
    const msg = await messageFor(async (input) => {
      if (String(input).endsWith("/health")) return response("{}", { status: 200 });
      throw new TypeError("Failed to fetch");
    });
    expect(msg).toContain("CORS");
    expect(msg).toContain("/health");
    expect(msg).not.toContain("fastapi dev");
  });
});

describe("timeouts", () => {
  it("is reported as a timeout, not as an unreachable server", async () => {
    const msg = await messageFor(
      async (_input, init) =>
        new Promise((_resolve, reject) => {
          // Reject the way the platform does when an AbortSignal fires.
          init?.signal?.addEventListener("abort", () => {
            const e = new Error("aborted");
            e.name = "AbortError";
            reject(e);
          });
        }) as Promise<Response>,
    );
    expect(msg).toContain("did not respond in time");
    expect(msg).toContain("stuck on this request");
    expect(msg).not.toContain("fastapi dev");
  });
});

describe("malformed JSON", () => {
  it("names the URL and the parse failure", async () => {
    vi.stubGlobal("fetch", async () =>
      response("<!doctype html><html>not json</html>", { status: 200 }),
    );
    try {
      await apiJson(URL_UNDER_TEST);
      throw new Error("expected the call to fail");
    } catch (err) {
      const msg = await describeApiFailure(err, URL_UNDER_TEST);
      expect(msg).toContain(URL_UNDER_TEST);
      expect(msg).toContain("not valid JSON");
      expect(msg).not.toContain("fastapi dev");
    }
  });
});

describe("the successful path", () => {
  it("returns the parsed body and does not throw", async () => {
    vi.stubGlobal("fetch", async () =>
      response('{"status":"ok","documents":121}', { status: 200 }),
    );
    await expect(
      apiJson<{ status: string; documents: number }>(URL_UNDER_TEST),
    ).resolves.toEqual({ status: "ok", documents: 121 });
  });
});
