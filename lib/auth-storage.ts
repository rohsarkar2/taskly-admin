
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const REMEMBER_KEY = "taskly:remember-me";
const REMEMBERED_EMAIL_KEY = "taskly:remembered-email";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

function safely<T>(fn: () => T, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function isRemembered(): boolean {
  return safely(() => localStorage.getItem(REMEMBER_KEY) === "true", false);
}

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

export function clearStoredTokens(): void {
  safely(() => {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(ACCESS_TOKEN_KEY);
      store.removeItem(REFRESH_TOKEN_KEY);
    }
  }, undefined);
}

export function rememberEmail(email: string | null): void {
  safely(() => {
    if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }, undefined);
}

export function getRememberedEmail(): string | null {
  return safely(() => localStorage.getItem(REMEMBERED_EMAIL_KEY), null);
}
