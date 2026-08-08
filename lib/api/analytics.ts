/**
 * Organization analytics.
 *
 * Every figure the dashboard and analytics pages show is computed server-side;
 * nothing here derives numbers from a task list on the client.
 */

import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapResponse } from "./response";
import type {
  AnalyticsOverviewData,
  ApiResponse,
  EmployeeAnalyticsData,
  EmployeeCounts,
  ProjectAnalyticsData,
  TaskAnalyticsData,
  TeamAnalyticsData,
  TrendsData,
} from "./types";

/** One call for the whole dashboard header. */
export async function getAnalyticsOverview(): Promise<
  ApiResponse<AnalyticsOverviewData>
> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ANALYTICS_OVERVIEW);
  return unwrapResponse<AnalyticsOverviewData>(data);
}

/** The employee block on its own. */
export async function getOrganizationAnalytics(): Promise<
  ApiResponse<EmployeeCounts>
> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.ANALYTICS_ORGANIZATION,
  );
  return unwrapResponse<EmployeeCounts>(data);
}

export async function getProjectAnalytics(
  params: { limit?: number } = {},
): Promise<ApiResponse<ProjectAnalyticsData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ANALYTICS_PROJECTS, {
    params,
  });
  return unwrapResponse<ProjectAnalyticsData>(data);
}

/** Summary plus a daily created/completed trend. `days` maxes out at 180. */
export async function getTaskAnalytics(
  params: { projectId?: string; days?: number } = {},
): Promise<ApiResponse<TaskAnalyticsData>> {
  const query: Record<string, string | number> = {};
  if (params.projectId && params.projectId !== "all")
    query.projectId = params.projectId;
  if (params.days) query.days = params.days;

  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ANALYTICS_TASKS, {
    params: query,
  });
  return unwrapResponse<TaskAnalyticsData>(data);
}

export async function getEmployeeAnalytics(
  params: { limit?: number } = {},
): Promise<ApiResponse<EmployeeAnalyticsData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ANALYTICS_EMPLOYEES, {
    params,
  });
  return unwrapResponse<EmployeeAnalyticsData>(data);
}

/** Per-project team breakdown. Omit `projectId` for every project. */
export async function getTeamAnalytics(
  params: { projectId?: string } = {},
): Promise<ApiResponse<TeamAnalyticsData>> {
  const query: Record<string, string> = {};
  if (params.projectId && params.projectId !== "all")
    query.projectId = params.projectId;

  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ANALYTICS_TEAMS, {
    params: query,
  });
  return unwrapResponse<TeamAnalyticsData>(data);
}

export async function getTaskTrends(
  params: { days?: number } = {},
): Promise<ApiResponse<TrendsData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ANALYTICS_TRENDS, {
    params,
  });
  return unwrapResponse<TrendsData>(data);
}

export type {
  AnalyticsOverviewData,
  EmployeeAnalyticsRow,
  ProjectAnalyticsRow,
  TeamAnalyticsRow,
  TrendPoint,
} from "./types";
