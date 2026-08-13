
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

export async function getAdminDetails(): Promise<ApiResponse<AdminDetailsData>> {
  const { data } = await axiosPrivate.get(
    ADMIN_ENDPOINTS.DETAILS,
  );
  return unwrapResponse<AdminDetailsData>(data);
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ApiResponse<ForgotPasswordData>> {
  const { data } = await axiosPublic.post(
    ADMIN_ENDPOINTS.FORGOT_PASSWORD,
    payload,
  );
  return unwrapResponse<ForgotPasswordData>(data);
}

export async function verifyResetOtp(
  payload: VerifyResetOtpRequest,
): Promise<ApiResponse<VerifyResetOtpData>> {
  const { data } = await axiosPublic.post(
    ADMIN_ENDPOINTS.VERIFY_RESET_OTP,
    payload,
  );
  return unwrapResponse<VerifyResetOtpData>(data);
}

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
