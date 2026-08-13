
import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapList, unwrapResponse, type ListResult } from "./response";
import { toApiRole } from "./adapters";
import type {
  ApiEmployee,
  ApiResponse,
  ApproveEmployeeRequest,
  EmployeeData,
  EmployeeDetailData,
  EmployeeListParams,
  EmployeeProjectsData,
  EmployeeStatsData,
  EmptyData,
  RejectEmployeeRequest,
  SuspendEmployeeRequest,
} from "./types";
import type { EmployeeStatus, Role } from "@/lib/types";

export async function listPendingEmployees(): Promise<ListResult<ApiEmployee>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.EMPLOYEES_PENDING);
  return unwrapList<ApiEmployee>(data, "employees");
}

export async function listEmployees(
  params: EmployeeListParams = {},
): Promise<ListResult<ApiEmployee>> {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  if (params.role && params.role !== "all") {
    query.role = toApiRole(params.role as Role);
  }
  if (params.status && params.status !== "all") {
    query.status = params.status.toLowerCase();
  }
  if (params.department) query.department = params.department;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortOrder) query.sortOrder = params.sortOrder;

  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.EMPLOYEES, {
    params: query,
  });
  return unwrapList<ApiEmployee>(data, "employees");
}

export async function getEmployee(
  id: string,
): Promise<ApiResponse<EmployeeDetailData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.EMPLOYEE(id));
  return unwrapResponse<EmployeeDetailData>(data);
}

export async function getEmployeeStats(
  id: string,
): Promise<ApiResponse<EmployeeStatsData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.EMPLOYEE_STATS(id));
  return unwrapResponse<EmployeeStatsData>(data);
}

export async function getEmployeeProjects(
  id: string,
): Promise<ApiResponse<EmployeeProjectsData>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.EMPLOYEE_PROJECTS(id),
  );
  return unwrapResponse<EmployeeProjectsData>(data);
}

export async function getEmployeeTasks(
  id: string,
  params: { status?: string; page?: number; limit?: number } = {},
): Promise<ListResult<unknown>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.EMPLOYEE_TASKS(id), {
    params,
  });
  return unwrapList<unknown>(data, "tasks");
}

export async function approveEmployee(
  id: string,
  payload: ApproveEmployeeRequest,
): Promise<ApiResponse<EmployeeData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.EMPLOYEE_APPROVE(id),
    { role: toApiRole(payload.role as Role) },
  );
  return unwrapResponse<EmployeeData>(data);
}

export async function rejectEmployee(
  id: string,
  payload: RejectEmployeeRequest = {},
): Promise<ApiResponse<EmployeeData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.EMPLOYEE_REJECT(id),
    payload,
  );
  return unwrapResponse<EmployeeData>(data);
}

export async function changeEmployeeRole(
  id: string,
  role: Role,
): Promise<ApiResponse<EmployeeData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.EMPLOYEE_ROLE(id), {
    role: toApiRole(role),
  });
  return unwrapResponse<EmployeeData>(data);
}

export async function suspendEmployee(
  id: string,
  payload: SuspendEmployeeRequest = {},
): Promise<ApiResponse<EmployeeData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.EMPLOYEE_SUSPEND(id),
    payload,
  );
  return unwrapResponse<EmployeeData>(data);
}

export async function activateEmployee(
  id: string,
): Promise<ApiResponse<EmployeeData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.EMPLOYEE_ACTIVATE(id),
  );
  return unwrapResponse<EmployeeData>(data);
}

export async function changeEmployeeStatus(
  id: string,
  status: EmployeeStatus,
  reason?: string,
): Promise<ApiResponse<EmployeeData>> {
  return status === "Active"
    ? activateEmployee(id)
    : suspendEmployee(id, reason ? { reason } : {});
}

export async function removeEmployee(
  id: string,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.delete(ADMIN_ENDPOINTS.EMPLOYEE(id));
  return unwrapResponse<EmptyData>(data);
}

export type {
  ApiEmployee,
  ApproveEmployeeRequest,
  EmployeeDetailData,
  EmployeeListParams,
  EmployeeStats,
  RejectEmployeeRequest,
} from "./types";
