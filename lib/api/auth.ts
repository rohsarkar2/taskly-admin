/**
 * Admin authentication API.
 *
 * One function per endpoint in `docs/BACKEND_API.md` §1. Pages call these
 * instead of hand-rolling axios calls, so a path or payload change lands in
 * exactly one place.
 *
 * Every response is the `{ success, message, data }` envelope. These functions
 * return it whole rather than unwrapping to `data`, because callers show
 * `message` in the success toast. Errors propagate — callers pass them to
 * `getErrorMessage` to build the failure toast.
 */

import axios from "axios";
import { axiosPrivate, axiosPublic } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import type {
  AdminDetailsData,
  ApiResponse,
  ChangePasswordRequest,
  EmptyData,
  ForgotPasswordRequest,
  LoginRequest,
  OrganizationData,
  RegisterRequest,
  ResetPasswordRequest,
  SessionData,
  TokenPairData,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

/** Creates the organization and its admin, and signs the admin straight in. */
export async function registerOrganization(
  payload: RegisterRequest,
): Promise<ApiResponse<SessionData>> {
  const { data } = await axiosPublic.post<ApiResponse<SessionData>>(
    ADMIN_ENDPOINTS.REGISTER,
    payload,
  );
  return data;
}

export async function login(
  payload: LoginRequest,
): Promise<ApiResponse<SessionData>> {
  const { data } = await axiosPublic.post<ApiResponse<SessionData>>(
    ADMIN_ENDPOINTS.LOGIN,
    payload,
  );
  return data;
}

/**
 * Exchanges a refresh token for a new pair.
 *
 * Uses the public client on purpose: the private one would try to refresh on
 * the 401 this call can itself return, and loop.
 */
export async function refreshSession(
  refreshToken: string,
): Promise<ApiResponse<TokenPairData>> {
  const { data } = await axiosPublic.post<ApiResponse<TokenPairData>>(
    ADMIN_ENDPOINTS.REFRESH_TOKEN,
    { refreshToken },
  );
  return data;
}

export async function logout(): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.post<ApiResponse<EmptyData>>(
    ADMIN_ENDPOINTS.LOGOUT,
    {},
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export async function getAdminDetails(): Promise<ApiResponse<AdminDetailsData>> {
  const { data } = await axiosPrivate.get<ApiResponse<AdminDetailsData>>(
    ADMIN_ENDPOINTS.DETAILS,
  );
  return data;
}

export async function getOrganization(): Promise<ApiResponse<OrganizationData>> {
  const { data } = await axiosPrivate.get<ApiResponse<OrganizationData>>(
    ADMIN_ENDPOINTS.ORGANIZATION,
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/* Passwords                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Emails a reset link. Resolves with the same neutral message whether or not
 * the address belongs to an account, so nothing here reveals which emails are
 * registered.
 */
export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPublic.post<ApiResponse<EmptyData>>(
    ADMIN_ENDPOINTS.FORGOT_PASSWORD,
    payload,
  );
  return data;
}

/** Consumes the single-use token from the reset email. */
export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPublic.post<ApiResponse<EmptyData>>(
    ADMIN_ENDPOINTS.RESET_PASSWORD,
    payload,
  );
  return data;
}

export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.post<ApiResponse<EmptyData>>(
    ADMIN_ENDPOINTS.CHANGE_PASSWORD,
    payload,
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Pulls the backend's `message` out of a failed request, falling back to
 * `fallback` for network errors and anything unshaped.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export type {
  AdminDetailsData,
  AdminUser,
  ApiResponse,
  ChangePasswordRequest,
  LoginRequest,
  Organization,
  OrganizationData,
  RegisterRequest,
  SessionData,
  TokenPairData,
} from "./types";
