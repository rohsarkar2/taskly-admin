"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import { useEffect } from "react";
import { restoreTokens } from "./slices/authSlice";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Restore tokens from sessionStorage on app load
    store.dispatch(restoreTokens());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
