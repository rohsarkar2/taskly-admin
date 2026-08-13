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
      const stored = readTokens();

      if (stored) {
        state.accessToken = stored.accessToken;
        state.refreshToken = stored.refreshToken;
        state.isAuthenticated = true;
      }

      state.isRestored = true;
    },
  },
});

export const { setTokens, clearTokens, restoreTokens } = authSlice.actions;
export default authSlice.reducer;
