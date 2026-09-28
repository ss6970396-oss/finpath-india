/**
 * The API base — the ONE place it is derived. FinPathProvider re-exports
 * it as `API`, which is what call sites import. It lives in its own module
 * so AuthProvider can read it without importing FinPathProvider, which now
 * reads the session from AuthProvider (a cycle otherwise).
 */
export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
