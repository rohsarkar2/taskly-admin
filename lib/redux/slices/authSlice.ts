import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  clearStoredTokens,
  persistTokens,
  readTokens,
} from "@/lib/auth-storage";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /**
   * Whether the session has been read back from browser storage yet.
   *
   * Without this, `isAuthenticated: false` is ambiguous — it means both "signed
   * out" and "not checked yet" — and guards bounce signed-in users off deep
   * links on reload, before the restore effect has run.
   */
  isRestored: boolean;
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isRestored: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        /**
         * Omit to keep the current choice. Callers that are not the sign-in
         * form — the refresh interceptor — must omit it, or a token refresh
         * would quietly downgrade a remembered session to a tab-scoped one.
         */
        remember?: boolean;
      }>,
    ) => {
      const { accessToken, refreshToken, remember } = action.payload;

      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;

      persistTokens({ accessToken, refreshToken }, remember);
    },
    clearTokens: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isRestored = true;

      clearStoredTokens();
    },
    restoreTokens: (state) => {
      // Restore from browser storage on app load
      const stored = readTokens();

      if (stored) {
        state.accessToken = stored.accessToken;
        state.refreshToken = stored.refreshToken;
        state.isAuthenticated = true;
      }

      // Set even when nothing was stored: the check itself is what finished.
      state.isRestored = true;
    },
  },
});

export const { setTokens, clearTokens, restoreTokens } = authSlice.actions;
export default authSlice.reducer;
