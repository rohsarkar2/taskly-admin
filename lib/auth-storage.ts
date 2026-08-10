/**
 * Owns *where* the session is kept.
 *
 * Without "Remember me" the tokens live in `sessionStorage`, so closing the tab
 * ends the session. With it they move to `localStorage` and survive a browser
 * restart. Only ever one of the two holds tokens — writing to one clears the
 * other, so a restore can never pick up a stale copy from the loser.
 */

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REMEMBER_KEY = "taskly:remember-me";
const REMEMBERED_EMAIL_KEY = "taskly:remembered-email";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

/** Every read/write goes through this — private browsing can refuse both. */
function safely<T>(fn: () => T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Whether the last sign-in asked to be remembered. */
export function isRemembered(): boolean {
  return safely(() => localStorage.getItem(REMEMBER_KEY) === "true", false);
}

/**
 * Writes the tokens to the store `remember` selects.
 *
 * `remember` defaults to the existing preference so background writers — the
 * axios refresh interceptor, above all — cannot silently demote a remembered
 * session back to a tab-scoped one.
 */
export function persistTokens(
  tokens: StoredTokens,
  remember: boolean = isRemembered(),
): void {
  safely(() => {
    const target = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;

    target.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    target.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    other.removeItem(ACCESS_TOKEN_KEY);
    other.removeItem(REFRESH_TOKEN_KEY);

    localStorage.setItem(REMEMBER_KEY, String(remember));
  }, undefined);
}

/** Reads back whichever store holds the session, preferring the durable one. */
export function readTokens(): StoredTokens | null {
  return safely(() => {
    for (const store of [localStorage, sessionStorage]) {
      const accessToken = store.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = store.getItem(REFRESH_TOKEN_KEY);
      if (accessToken && refreshToken) return { accessToken, refreshToken };
    }
    return null;
  }, null);
}

/**
 * Drops the tokens from both stores.
 *
 * The remembered email deliberately survives: prefilling the sign-in form after
 * a sign-out is the part of "Remember me" an admin actually sees.
 */
export function clearStoredTokens(): void {
  safely(() => {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(ACCESS_TOKEN_KEY);
      store.removeItem(REFRESH_TOKEN_KEY);
    }
  }, undefined);
}

/** Keeps the email for the next visit, or forgets it when the box is cleared. */
export function rememberEmail(email: string | null): void {
  safely(() => {
    if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }, undefined);
}

export function getRememberedEmail(): string | null {
  return safely(() => localStorage.getItem(REMEMBERED_EMAIL_KEY), null);
}
