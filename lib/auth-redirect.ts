
const STORAGE_KEY = "taskly:redirect-after-sign-in";

const EXCLUDED = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

export function rememberRedirect(path: string): void {
  if (typeof window === "undefined") return;
  if (!path.startsWith("/") || path.startsWith("//")) return;
  if (EXCLUDED.some((route) => path.startsWith(route))) return;

  try {
    sessionStorage.setItem(STORAGE_KEY, path);
  } catch {
  }
}

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
