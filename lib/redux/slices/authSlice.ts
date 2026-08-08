import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  /**
   * Whether the session has been read back from `sessionStorage` yet.
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
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;

      // Store in sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.setItem("accessToken", action.payload.accessToken);
        sessionStorage.setItem("refreshToken", action.payload.refreshToken);
      }
    },
    clearTokens: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isRestored = true;

      // Clear from sessionStorage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
      }
    },
    restoreTokens: (state) => {
      // Restore from sessionStorage on app load
      if (typeof window !== "undefined") {
        const accessToken = sessionStorage.getItem("accessToken");
        const refreshToken = sessionStorage.getItem("refreshToken");

        if (accessToken && refreshToken) {
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          state.isAuthenticated = true;
        }
      }

      // Set even when nothing was stored: the check itself is what finished.
      state.isRestored = true;
    },
  },
});

export const { setTokens, clearTokens, restoreTokens } = authSlice.actions;
export default authSlice.reducer;
