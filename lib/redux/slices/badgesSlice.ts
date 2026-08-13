
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface BadgeCounts {
  employeeRequests: number;
  approvals: number;
  notifications: number;
}

export type BadgeKey = keyof BadgeCounts;

interface BadgesState extends BadgeCounts {
  loaded: boolean;
}

const initialState: BadgesState = {
  employeeRequests: 0,
  approvals: 0,
  notifications: 0,
  loaded: false,
};

const badgesSlice = createSlice({
  name: "badges",
  initialState,
  reducers: {
    setBadgeCounts: (state, action: PayloadAction<Partial<BadgeCounts>>) => {
      Object.assign(state, action.payload);
      state.loaded = true;
    },
    setBadgeCount: (
      state,
      action: PayloadAction<{ key: BadgeKey; value: number }>,
    ) => {
      state[action.payload.key] = Math.max(0, action.payload.value);
      state.loaded = true;
    },
    markBadgesLoaded: (state) => {
      state.loaded = true;
    },
    clearBadgeCounts: () => initialState,
  },
});

export const {
  setBadgeCounts,
  setBadgeCount,
  markBadgesLoaded,
  clearBadgeCounts,
} = badgesSlice.actions;
export default badgesSlice.reducer;
