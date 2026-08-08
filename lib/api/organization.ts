/**
 * Organization profile, settings and workflow API.
 *
 * One function per endpoint in the Organization API spec. Responses go through
 * `unwrapResponse`, so these work whether or not the endpoint envelopes its
 * payload.
 */

import { axiosPrivate } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapResponse } from "./response";
import type {
  ApiResponse,
  EmptyData,
  LogoUploadData,
  OrganizationData,
  OrganizationSettingsPayload,
  OrganizationSummary,
  UpdateOrganizationRequest,
  UpdateProjectWorkflowRequest,
  UpdateSettingsRequest,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export async function getOrganization(): Promise<ApiResponse<OrganizationData>> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ORGANIZATION);
  return unwrapResponse<OrganizationData>(data);
}

export async function updateOrganization(
  payload: UpdateOrganizationRequest,
): Promise<ApiResponse<OrganizationData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.ORGANIZATION,
    payload,
  );
  return unwrapResponse<OrganizationData>(data);
}

/** Multipart upload — the file goes in a `logo` field. */
export async function uploadOrganizationLogo(
  file: File,
): Promise<ApiResponse<LogoUploadData>> {
  const form = new FormData();
  form.append("logo", file);

  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.SETTINGS_LOGO,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return unwrapResponse<LogoUploadData>(data);
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export async function getOrganizationSettings(): Promise<
  ApiResponse<OrganizationSettingsPayload>
> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.SETTINGS);
  return unwrapResponse<OrganizationSettingsPayload>(data);
}

/** Accepts a partial payload — send only the section the admin edited. */
export async function updateOrganizationSettings(
  payload: UpdateSettingsRequest,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.SETTINGS, payload);
  return unwrapResponse<EmptyData>(data);
}

/* -------------------------------------------------------------------------- */
/* Per-project workflow                                                       */
/* -------------------------------------------------------------------------- */

/** Overrides the organization defaults for one project. */
export async function updateProjectWorkflow(
  projectId: string,
  payload: UpdateProjectWorkflowRequest,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.put(
    ADMIN_ENDPOINTS.PROJECT_WORKFLOW(projectId),
    payload,
  );
  return unwrapResponse<EmptyData>(data);
}

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Headcount and project counts. Covers only part of what the dashboard shows —
 * task totals still come from the analytics endpoints — so the dashboard does
 * not call this yet.
 */
export async function getOrganizationSummary(): Promise<
  ApiResponse<OrganizationSummary>
> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.ORGANIZATION_SUMMARY);
  return unwrapResponse<OrganizationSummary>(data);
}

export type {
  LogoUploadData,
  Organization,
  OrganizationData,
  OrganizationSettingsPayload,
  OrganizationSummary,
  UpdateOrganizationRequest,
  UpdateProjectWorkflowRequest,
  UpdateSettingsRequest,
} from "./types";
