/**
 * Fetching for the sidebar badge counts.
 *
 * Split out of `../slices/badgesSlice` on purpose: this module imports the API
 * layer, which imports `store`, which imports the slice. Keeping the calls here
 * means the store's import graph never reaches axios, so the cycle never forms.
 * Only components and pages import this file.
 *
 * These dispatch plain slice actions rather than being wired up through
 * `extraReducers` — that would make the slice import this module and put the
 * cycle straight back.
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAnalyticsOverview } from "@/lib/api/analytics";
import { getUnreadCount } from "@/lib/api/notifications";
import {
  markBadgesLoaded,
  setBadgeCount,
  setBadgeCounts,
  type BadgeCounts,
} from "@/lib/redux/slices/badgesSlice";

/**
 * Two requests cover all three counts: the analytics overview carries both
 * pending figures, and notifications have a dedicated unread-count endpoint.
 *
 * `allSettled`, not `all` — the endpoints are independent, and letting a
 * failing analytics call blank out the notification badge would be worse than
 * leaving one count at its last known value.
 */
export const fetchBadgeCounts = createAsyncThunk(
  "badges/fetch",
  async (_: void, { dispatch }) => {
    const [overview, unread] = await Promise.allSettled([
      getAnalyticsOverview(),
      getUnreadCount(),
    ]);

    const counts: Partial<BadgeCounts> = {};

    if (overview.status === "fulfilled") {
      const { employees, tasks } = overview.value.data ?? {};
      if (typeof employees?.pendingEmployees === "number") {
        counts.employeeRequests = employees.pendingEmployees;
      }
      if (typeof tasks?.pendingApproval === "number") {
        counts.approvals = tasks.pendingApproval;
      }
    }

    if (unread.status === "fulfilled" && typeof unread.value === "number") {
      counts.notifications = unread.value;
    }

    // Both failing still counts as "checked", so the badges stop waiting.
    if (Object.keys(counts).length === 0) dispatch(markBadgesLoaded());
    else dispatch(setBadgeCounts(counts));
  },
);

/**
 * Just the notification count. Reading or deleting a notification cannot move
 * the other two badges, and firing the full refresh on every click would hit
 * the analytics endpoint for nothing.
 */
export const refreshUnreadNotifications = createAsyncThunk(
  "badges/refreshUnread",
  async (_: void, { dispatch }) => {
    try {
      const count = await getUnreadCount();
      dispatch(setBadgeCount({ key: "notifications", value: count }));
    } catch {
      // Leave the badge on its last known value; the next full fetch corrects it.
    }
  },
);
