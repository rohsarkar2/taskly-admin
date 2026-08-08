/**
 * Employee registration approval and management API.
 *
 * One function per endpoint in the Employee API spec. List responses go
 * through `unwrapList` so pagination survives; single-entity responses go
 * through `unwrapResponse`. Both accept the enveloped and flat shapes.
 */

import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapList, unwrapResponse, type ListResult } from "./response";
import { toApiRole, toApiStatus } from "./adapters";
import type {
  ApiEmployee,
  ApiResponse,
  ApproveEmployeeRequest,
  EmployeeData,
  EmployeeDetailData,
  EmployeeListParams,
  EmptyData,
  RejectEmployeeRequest,
} from "./types";
import type { EmployeeStatus, Role } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

/** Registrations from the mobile app awaiting an approve/reject decision. */
export async function listPendingEmployees(): Promise<ListResult<ApiEmployee>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.EMPLOYEES_PENDING);
  return unwrapList<ApiEmployee>(data, "employees");
}

/** Filtering happens server-side; blank values are omitted from the query. */
export async function listEmployees(
  params: EmployeeListParams = {},
): Promise<ListResult<ApiEmployee>> {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  if (params.role && params.role !== "all") {
    query.role = toApiRole(params.role as Role);
  }
  if (params.status && params.status !== "all") {
    query.status = toApiStatus(params.status as EmployeeStatus);
  }
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

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

/* -------------------------------------------------------------------------- */
/* Approval                                                                   */
/* -------------------------------------------------------------------------- */

/** Assigns the role and flips the employee to Active. */
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

/** The reason is optional and is shown to the employee. */
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

/* -------------------------------------------------------------------------- */
/* Management                                                                 */
/* -------------------------------------------------------------------------- */

export async function changeEmployeeRole(
  id: string,
  role: Role,
): Promise<ApiResponse<EmployeeData>> {
  const { data } = await axiosPrivate.patch(ADMIN_ENDPOINTS.EMPLOYEE_ROLE(id), {
    role: toApiRole(role),
  });
  return unwrapResponse<EmployeeData>(data);
}

/** `Suspended` blocks sign-in and revokes the employee's active sessions. */
export async function changeEmployeeStatus(
  id: string,
  status: EmployeeStatus,
): Promise<ApiResponse<EmployeeData>> {
  const { data } = await axiosPrivate.patch(
    ADMIN_ENDPOINTS.EMPLOYEE_STATUS(id),
    { status: toApiStatus(status) },
  );
  return unwrapResponse<EmployeeData>(data);
}

/**
 * Soft-deletes the employee. Their tasks stay in the system and become
 * unassigned, so anything in flight should be reassigned first.
 */
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
