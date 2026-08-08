/**
 * Task management and the approval centre.
 *
 * One function per endpoint in the Task API spec. Lists go through
 * `unwrapList` so pagination survives; single-entity responses through
 * `unwrapResponse`.
 */

import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapList, unwrapResponse, type ListResult } from "./response";
import { toApiPriority, toApiTaskStatus } from "./adapters";
import type { Priority, TaskStatus } from "@/lib/types";
import type {
  ApiResponse,
  ApiTask,
  CreateTaskRequest,
  EmptyData,
  TaskApproversData,
  TaskData,
  TaskDecisionRequest,
  TaskListParams,
  TaskTimelineData,
  UpdateTaskRequest,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

/** Organization-wide search. `status` and `priority` accept comma-separated lists. */
export async function listTasks(
  params: TaskListParams = {},
): Promise<ListResult<ApiTask>> {
  const query: Record<string, string | number | boolean> = {};

  if (params.search) query.search = params.search;
  if (params.status && params.status !== "all") query.status = params.status;
  if (params.priority && params.priority !== "all")
    query.priority = params.priority;
  if (params.projectId && params.projectId !== "all")
    query.projectId = params.projectId;
  if (params.assignee && params.assignee !== "all")
    query.assignee = params.assignee;
  if (params.unassigned) query.unassigned = true;
  if (params.createdBy) query.createdBy = params.createdBy;
  if (params.tag) query.tag = params.tag;
  if (params.dueBefore) query.dueBefore = params.dueBefore;
  if (params.dueAfter) query.dueAfter = params.dueAfter;
  if (params.overdue) query.overdue = true;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortOrder) query.sortOrder = params.sortOrder;

  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.TASKS, {
    params: query,
  });
  return unwrapList<ApiTask>(data, "tasks");
}

/** Includes the full timeline and populated approvers. */
export async function getTask(id: string): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.TASK(id));
  return unwrapResponse<TaskData>(data);
}

/** Newest first. */
export async function getTaskTimeline(
  id: string,
): Promise<ApiResponse<TaskTimelineData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.TASK_TIMELINE(id));
  return unwrapResponse<TaskTimelineData>(data);
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Only `title` and `projectId` are required — approval and default priority
 * are inherited from the project's effective workflow.
 */
export async function createTask(
  payload: CreateTaskRequest,
): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.post(ADMIN_ENDPOINTS.TASKS, payload);
  return unwrapResponse<TaskData>(data);
}

/** Partial update. An admin may set `status` directly, bypassing approval. */
export async function updateTask(
  id: string,
  payload: UpdateTaskRequest,
): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.TASK(id), payload);
  return unwrapResponse<TaskData>(data);
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<ApiResponse<TaskData>> {
  return updateTask(id, { status: toApiTaskStatus(status) });
}

export async function updateTaskPriority(
  id: string,
  priority: Priority,
): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.TASK_PRIORITY(id), {
    priority: toApiPriority(priority),
  });
  return unwrapResponse<TaskData>(data);
}

/** Notifies the assignee. Pass `null` to clear the date. */
export async function updateTaskDueDate(
  id: string,
  dueDate: string | null,
): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.TASK_DUE_DATE(id), {
    dueDate,
  });
  return unwrapResponse<TaskData>(data);
}

/**
 * Resets the assignment acceptance and notifies the new assignee. Pass `null`
 * to unassign. The assignee must be an active member of the task's project.
 */
export async function reassignTask(
  id: string,
  assignee: string | null,
): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.TASK_REASSIGN(id), {
    assignee,
  });
  return unwrapResponse<TaskData>(data);
}

/** Soft delete — hidden from queries, but the history is preserved. */
export async function deleteTask(id: string): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.delete(ADMIN_ENDPOINTS.TASK(id));
  return unwrapResponse<EmptyData>(data);
}

/* -------------------------------------------------------------------------- */
/* Approval centre                                                            */
/* -------------------------------------------------------------------------- */

/** Tasks awaiting a decision, oldest submission first. */
export async function listPendingApprovals(
  params: { projectId?: string; page?: number; limit?: number } = {},
): Promise<ListResult<ApiTask>> {
  const query: Record<string, string | number> = {};
  if (params.projectId && params.projectId !== "all")
    query.projectId = params.projectId;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;

  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.TASKS_PENDING_APPROVAL,
    { params: query },
  );
  return unwrapList<ApiTask>(data, "tasks");
}

/** Completes the task, stamps `completedAt` and notifies the assignee. */
export async function approveTask(
  id: string,
  payload: TaskDecisionRequest = {},
): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.TASK_APPROVE(id),
    payload,
  );
  return unwrapResponse<TaskData>(data);
}

/** `comments` is required by the server. */
export async function rejectTask(
  id: string,
  payload: TaskDecisionRequest,
): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.TASK_REJECT(id),
    payload,
  );
  return unwrapResponse<TaskData>(data);
}

/** Sends the task back for rework so it can be resubmitted. `comments` required. */
export async function returnTask(
  id: string,
  payload: TaskDecisionRequest,
): Promise<ApiResponse<TaskData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.TASK_RETURN(id),
    payload,
  );
  return unwrapResponse<TaskData>(data);
}

/**
 * Recomputes the approver list from the project's current workflow — useful
 * after changing a project's managers or team leads.
 */
export async function reassignTaskApprovers(
  id: string,
): Promise<ApiResponse<TaskApproversData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.TASK_REASSIGN_APPROVERS(id),
  );
  return unwrapResponse<TaskApproversData>(data);
}

export type {
  ApiTask,
  CreateTaskRequest,
  TaskDecisionRequest,
  TaskListParams,
  UpdateTaskRequest,
} from "./types";
