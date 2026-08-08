/**
 * Project management API.
 *
 * One function per endpoint in the Project API spec. The list goes through
 * `unwrapList` so pagination survives; everything else through
 * `unwrapResponse`.
 *
 * Note these routes live at `/projects`, not under `/admin` like the employee
 * and organization endpoints.
 */

import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapList, unwrapResponse, type ListResult } from "./response";
import { toApiPriority, toApiProjectStatus } from "./adapters";
import type { Priority, ProjectStatus } from "@/lib/types";
import type {
  ApiProject,
  ApiProjectWorkflow,
  ApiResponse,
  CreateProjectRequest,
  ProjectAssignData,
  ProjectAssignRequest,
  ProjectData,
  ProjectDeleteData,
  ProjectDetailData,
  ProjectDocumentsData,
  ProjectListParams,
  ProjectMemberIdsRequest,
  ProjectMembersData,
  ProjectWorkflowData,
  UpdateProjectRequest,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Reading                                                                    */
/* -------------------------------------------------------------------------- */

export async function listProjects(
  params: ProjectListParams = {},
): Promise<ListResult<ApiProject>> {
  const query: Record<string, string | number> = {};
  if (params.search) query.search = params.search;
  if (params.status && params.status !== "all") {
    query.status = toApiProjectStatus(params.status as ProjectStatus);
  }
  if (params.priority && params.priority !== "all") {
    query.priority = toApiPriority(params.priority as Priority);
  }
  if (params.memberId) query.memberId = params.memberId;
  if (params.page) query.page = params.page;
  if (params.limit) query.limit = params.limit;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortOrder) query.sortOrder = params.sortOrder;

  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.PROJECTS, {
    params: query,
  });
  return unwrapList<ApiProject>(data, "projects");
}

/** Returns the project plus a `taskStats` sibling. */
export async function getProject(
  id: string,
): Promise<ApiResponse<ProjectDetailData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.PROJECT(id));
  return unwrapResponse<ProjectDetailData>(data);
}

/* -------------------------------------------------------------------------- */
/* Writing                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Only `name` is required. `managers` and `teamLeads` are merged into
 * `members` server-side, and every listed employee must be active.
 */
export async function createProject(
  payload: CreateProjectRequest,
): Promise<ApiResponse<ProjectData>> {
  const { data } = await axiosPrivate.post(ADMIN_ENDPOINTS.PROJECTS, payload);
  return unwrapResponse<ProjectData>(data);
}

/** Partial update. Setting `status: "completed"` notifies every member. */
export async function updateProject(
  id: string,
  payload: UpdateProjectRequest,
): Promise<ApiResponse<ProjectData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.PROJECT(id), payload);
  return unwrapResponse<ProjectData>(data);
}

export async function archiveProject(
  id: string,
): Promise<ApiResponse<ProjectData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.PROJECT_ARCHIVE(id));
  return unwrapResponse<ProjectData>(data);
}

export async function unarchiveProject(
  id: string,
): Promise<ApiResponse<ProjectData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.PROJECT_UNARCHIVE(id),
  );
  return unwrapResponse<ProjectData>(data);
}

/**
 * Hard-deletes the project.
 *
 * Refuses with `409` while tasks remain; pass `force` to soft-delete those too.
 * The response reports how many tasks went with it.
 */
export async function deleteProject(
  id: string,
  options: { force?: boolean } = {},
): Promise<ApiResponse<ProjectDeleteData>> {
  const { data } = await axiosPrivate.delete(ADMIN_ENDPOINTS.PROJECT(id), {
    params: options.force ? { force: true } : undefined,
  });
  return unwrapResponse<ProjectDeleteData>(data);
}

/* -------------------------------------------------------------------------- */
/* Members                                                                    */
/* -------------------------------------------------------------------------- */

/** Membership is the mobile app's access control for a project. */
export async function addProjectMembers(
  projectId: string,
  payload: ProjectMemberIdsRequest,
): Promise<ApiResponse<ProjectMembersData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.PROJECT_MEMBERS(projectId),
    payload,
  );
  return unwrapResponse<ProjectMembersData>(data);
}

/**
 * Removing a member also strips them from managers, team leads and approvers,
 * and unassigns their open tasks on this project.
 */
export async function removeProjectMembers(
  projectId: string,
  payload: ProjectMemberIdsRequest,
): Promise<ApiResponse<ProjectMembersData>> {
  const { data } = await axiosPrivate.delete(
    ADMIN_ENDPOINTS.PROJECT_MEMBERS(projectId),
    { data: payload },
  );
  return unwrapResponse<ProjectMembersData>(data);
}

/** Replaces the manager list, or appends with `mode: "add"`. */
export async function assignProjectManagers(
  projectId: string,
  payload: ProjectAssignRequest,
): Promise<ApiResponse<ProjectAssignData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.PROJECT_MANAGERS(projectId),
    payload,
  );
  return unwrapResponse<ProjectAssignData>(data);
}

export async function assignProjectTeamLeads(
  projectId: string,
  payload: ProjectAssignRequest,
): Promise<ApiResponse<ProjectAssignData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.PROJECT_TEAM_LEADS(projectId),
    payload,
  );
  return unwrapResponse<ProjectAssignData>(data);
}

/* -------------------------------------------------------------------------- */
/* Workflow                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Partial update. A field set to `null` reverts to the organization default,
 * and an explicit `approvers` list beats `approverRole`.
 */
export async function updateProjectWorkflow(
  projectId: string,
  payload: ApiProjectWorkflow,
): Promise<ApiResponse<ProjectWorkflowData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.PROJECT_WORKFLOW(projectId),
    payload,
  );
  return unwrapResponse<ProjectWorkflowData>(data);
}

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

/** Multipart upload, field `files`, up to ten per request. */
export async function uploadProjectDocuments(
  projectId: string,
  files: File[],
): Promise<ApiResponse<ProjectDocumentsData>> {
  const form = new FormData();
  for (const file of files.slice(0, 10)) form.append("files", file);

  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.PROJECT_DOCUMENTS(projectId),
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return unwrapResponse<ProjectDocumentsData>(data);
}

export async function deleteProjectDocument(
  projectId: string,
  documentId: string,
): Promise<ApiResponse<null>> {
  const { data } = await axiosPrivate.delete(
    ADMIN_ENDPOINTS.PROJECT_DOCUMENT(projectId, documentId),
  );
  return unwrapResponse<null>(data);
}

export type {
  ApiProject,
  ApiProjectWorkflow,
  CreateProjectRequest,
  ProjectListParams,
  UpdateProjectRequest,
} from "./types";
