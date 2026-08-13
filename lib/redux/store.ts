import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import userReducer from "./slices/userSlice";
import badgesReducer from "./slices/badgesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    badges: badgesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
