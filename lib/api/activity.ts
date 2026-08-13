
import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapList, unwrapResponse, type ListResult } from "./response";
import type {
  ActivityActionsData,
  ActivityLogParams,
  ApiActivityLog,
  ApiResponse,
} from "./types";

export async function listActivityLogs(
  params: ActivityLogParams = {},
): Promise<ListResult<ApiActivityLog>> {
  const query: Record<string, string | number> = {};
  if (params.action && params.action !== "all") query.action = params.action;
  if (params.entityType && params.entityType !== "all")
    query.entityType = params.entityType;
  if (params.entityId) query.entityId = params.entityId;
  if (params.actorId) query.actorId = params.actorId;
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.search) query.search = params.search;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ACTIVITY_LOGS, {
    params: query,
  });
  return unwrapList<ApiActivityLog>(data, "logs");
}

export async function listActivityActions(): Promise<
  ApiResponse<ActivityActionsData>
> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.ACTIVITY_LOG_ACTIONS,
  );
  return unwrapResponse<ActivityActionsData>(data);
}

export async function listRecentActivity(
  params: { limit?: number } = {},
): Promise<ListResult<ApiActivityLog>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.ACTIVITY_LOGS_RECENT,
    { params },
  );
  return unwrapList<ApiActivityLog>(data, "logs");
}

export type { ActivityLogParams, ApiActivityLog } from "./types";
