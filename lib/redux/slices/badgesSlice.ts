/**
 * The unread/pending counts on the sidebar nav.
 *
 * These live in the store rather than in `AppSidebar` because the pages that
 * *change* them — approving a request, clearing a notification — are siblings
 * of the sidebar, not children. A page dispatches a refresh after a mutation
 * and the badge follows.
 *
 * Deliberately free of API imports, and no `extraReducers` reaching for the
 * thunks in `../thunks/badges`. `store` imports this file, the API layer
 * imports `store` (the axios interceptor reads tokens from it), so anything
 * this module pulls in from `lib/api` closes a cycle and the store's reducers
 * evaluate as undefined. The fetching lives in `../thunks/badges` instead,
 * which nothing in the store's import graph touches.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface BadgeCounts {
  employeeRequests: number;
  approvals: number;
  notifications: number;
}

export type BadgeKey = keyof BadgeCounts;

interface BadgesState extends BadgeCounts {
  /** False until the first fetch settles, so badges do not flash a stale zero. */
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
    /**
     * Merges whichever counts the caller managed to fetch. Keys left out keep
     * their current value — a failed analytics call should not blank the
     * notification badge.
     */
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
    /**
     * Marks the first fetch as done even though it failed — otherwise the
     * badges stay hidden forever on a backend that does not serve analytics.
     */
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
