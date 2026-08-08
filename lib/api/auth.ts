/**
 * Admin authentication API.
 *
 * One function per endpoint in the Authentication API spec. Pages call these
 * instead of hand-rolling axios calls, so a path or payload change lands in
 * exactly one place.
 *
 * Responses come back as the `{ success, message, data }` envelope. These
 * functions normalise through `unwrapResponse` and return the envelope whole
 * rather than just `data`, because callers show `message` in the success toast.
 * Errors propagate — callers pass them to `getErrorMessage` for the failure
 * toast.
 */

import axios from "axios";
import { axiosPrivate, axiosPublic } from "@/app/axios/Axios";
import { ADMIN_ENDPOINTS } from "./endpoints";
import { unwrapResponse } from "./response";
import type {
  AdminDetailsData,
  ApiResponse,
  ChangePasswordRequest,
  EmptyData,
  ForgotPasswordData,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SessionData,
  TokenPairData,
  VerifyResetOtpData,
  VerifyResetOtpRequest,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

/** Creates the organization and its admin, and signs the admin straight in. */
export async function registerOrganization(
  payload: RegisterRequest,
): Promise<ApiResponse<SessionData>> {
  const { data } = await axiosPublic.post(
    ADMIN_ENDPOINTS.REGISTER,
    payload,
  );
  return unwrapResponse<SessionData>(data);
}

export async function login(
  payload: LoginRequest,
): Promise<ApiResponse<SessionData>> {
  const { data } = await axiosPublic.post(
    ADMIN_ENDPOINTS.LOGIN,
    payload,
  );
  return unwrapResponse<SessionData>(data);
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
  const { data } = await axiosPublic.post(
    ADMIN_ENDPOINTS.REFRESH_TOKEN,
    { refreshToken },
  );
  return unwrapResponse<TokenPairData>(data);
}

export async function logout(): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.LOGOUT,
    {},
  );
  return unwrapResponse<EmptyData>(data);
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

export async function getAdminDetails(): Promise<ApiResponse<AdminDetailsData>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.DETAILS,
  );
  return unwrapResponse<AdminDetailsData>(data);
}


/* -------------------------------------------------------------------------- */
/* Passwords                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Step 1 of 3 — emails a six-digit code, valid 10 minutes.
 *
 * Always resolves, with the same neutral message whether or not the address
 * belongs to an account, so nothing here reveals which emails are registered.
 * Requesting a new code invalidates any reset token an earlier verification
 * already handed out.
 */
export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ApiResponse<ForgotPasswordData>> {
  const { data } = await axiosPublic.post(
    ADMIN_ENDPOINTS.FORGOT_PASSWORD,
    payload,
  );
  return unwrapResponse<ForgotPasswordData>(data);
}

/**
 * Step 2 of 3 — trades a correct code for the reset token.
 *
 * The code is consumed on success and also once the five-attempt budget is
 * spent, after which the admin has to request a new one.
 */
export async function verifyResetOtp(
  payload: VerifyResetOtpRequest,
): Promise<ApiResponse<VerifyResetOtpData>> {
  const { data } = await axiosPublic.post(
    ADMIN_ENDPOINTS.VERIFY_RESET_OTP,
    payload,
  );
  return unwrapResponse<VerifyResetOtpData>(data);
}

/**
 * Step 3 of 3 — sets the new password using the token from `verifyResetOtp`,
 * never the OTP itself. Single-use, valid 15 minutes, and it kills every
 * existing session.
 */
export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPublic.post(
    ADMIN_ENDPOINTS.RESET_PASSWORD,
    payload,
  );
  return unwrapResponse<EmptyData>(data);
}

export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<ApiResponse<EmptyData>> {
  const { data } = await axiosPrivate.post(
    ADMIN_ENDPOINTS.CHANGE_PASSWORD,
    payload,
  );
  return unwrapResponse<EmptyData>(data);
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
  ForgotPasswordData,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SessionData,
  TokenPairData,
  VerifyResetOtpData,
  VerifyResetOtpRequest,
} from "./types";
