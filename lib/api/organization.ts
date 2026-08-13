
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
  UpdateSettingsRequest,
} from "./types";

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

export async function getOrganizationSettings(): Promise<
  ApiResponse<OrganizationSettingsPayload>
> {
  const { data } = await axiosPrivate.get(ADMIN_ENDPOINTS.SETTINGS);
  return unwrapResponse<OrganizationSettingsPayload>(data);
}

export async function updateOrganizationSettings(
  payload: UpdateSettingsRequest,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.put(ADMIN_ENDPOINTS.SETTINGS, payload);
  return unwrapResponse<EmptyData>(data);
}

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
  UpdateSettingsRequest,
} from "./types";
