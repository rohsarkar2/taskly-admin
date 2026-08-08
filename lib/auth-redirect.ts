/**
 * Remembers where an admin was heading when their session turned out to be
 * missing, so signing in returns them there instead of the dashboard.
 *
 * Kept in `sessionStorage` rather than a query parameter so `/sign-in` does not
 * need `useSearchParams` (and the Suspense boundary that comes with it).
 */

const STORAGE_KEY = "taskly:redirect-after-sign-in";

/** Routes that would bounce the admin straight back out again. */
const EXCLUDED = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

export function rememberRedirect(path: string): void {
  if (typeof window === "undefined") return;
  // Only same-origin paths — never a caller-supplied absolute URL.
  if (!path.startsWith("/") || path.startsWith("//")) return;
  if (EXCLUDED.some((route) => path.startsWith(route))) return;

  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
    // Private browsing can refuse writes; losing the deep link is acceptable.
  }
}

/** Reads the stored path and clears it, so it is only ever used once. */
export function consumeRedirect(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const path = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}
