
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getAnalyticsOverview } from "@/lib/api/analytics";
import { getUnreadCount } from "@/lib/api/notifications";
import {
  markBadgesLoaded,
  setBadgeCount,
  setBadgeCounts,
  type BadgeCounts,
} from "@/lib/redux/slices/badgesSlice";

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

    if (Object.keys(counts).length === 0) dispatch(markBadgesLoaded());
    else dispatch(setBadgeCounts(counts));
  },
);

export const refreshUnreadNotifications = createAsyncThunk(
  "badges/refreshUnread",
  async (_: void, { dispatch }) => {
    try {
      const count = await getUnreadCount();
      dispatch(setBadgeCount({ key: "notifications", value: count }));
    } catch {
    }
  },
);
