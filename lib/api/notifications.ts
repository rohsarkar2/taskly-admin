
import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapList, unwrapResponse, type ListResult } from "./response";
import type {
  ApiNotification,
  ApiResponse,
  EmptyData,
  NotificationListParams,
  UnreadCountData,
} from "./types";

export async function listNotifications(
  params: NotificationListParams = {},
): Promise<ListResult<ApiNotification>> {
  const query: Record<string, string | number | boolean> = {};
  if (params.isRead !== undefined) query.isRead = params.isRead;
  if (params.type && params.type !== "all") query.type = params.type;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.NOTIFICATIONS, {
    params: query,
  });
  return unwrapList<ApiNotification>(data, "notifications");
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT,
  );
  const payload = unwrapResponse<UnreadCountData | number>(data).data;

  if (typeof payload === "number") return payload;
  return payload?.count ?? payload?.unreadCount ?? 0;
}

export async function markNotificationRead(
  id: string,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.NOTIFICATION_READ(id),
  );
  return unwrapResponse<EmptyData>(data);
}

export async function markAllNotificationsRead(): Promise<
  ApiResponse<EmptyData>
> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.NOTIFICATIONS_READ_ALL,
  );
  return unwrapResponse<EmptyData>(data);
}

export async function deleteNotification(
  id: string,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.delete(ADMIN_ENDPOINTS.NOTIFICATION(id));
  return unwrapResponse<EmptyData>(data);
}

export async function clearReadNotifications(): Promise<
  ApiResponse<EmptyData>
> {
  const { data } = await axiosPrivate.delete(
    ADMIN_ENDPOINTS.NOTIFICATIONS_CLEAR_READ,
  );
  return unwrapResponse<EmptyData>(data);
}

export type { ApiNotification, NotificationListParams } from "./types";
