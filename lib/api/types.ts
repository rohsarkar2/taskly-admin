/**
 * Wire types for the admin authentication API.
 *
 * Types only — no runtime imports. The Redux slices import from here, and so
 * does `lib/api/auth.ts`, which would otherwise create a cycle through the
 * axios instances (auth → Axios → store → slices).
 */

/* -------------------------------------------------------------------------- */
/* Envelope                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Every admin endpoint wraps its payload:
 *
 * ```json
 * { "success": true, "message": "Admin logged in successfully", "data": { … } }
 * ```
 *
 * `message` is shown verbatim in the success toast; `data` carries the payload.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Endpoints that only report an outcome still send an (often empty) `data`. */
export type EmptyData = Record<string, never> | null;

/* -------------------------------------------------------------------------- */
/* Entities                                                                   */
/* -------------------------------------------------------------------------- */

/** The signed-in admin. `organizationId` is the id string, not the populated doc. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  role: string;
  phoneNumber: string | null;
  avatar: string | null;
  designation: string | null;
  organizationId: string;
  organizationName: string;
  uniqueOrganizationId: string;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  uniqueOrganizationId: string;
  organizationSize: string;
  logo?: string | null;
  isActive?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Payloads (the `data` of each response)                                     */
/* -------------------------------------------------------------------------- */

/** `register` and `login`: tokens sit beside the user, not inside it. */
export interface SessionData {
  user: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPairData {
  accessToken: string;
  refreshToken: string;
}

export interface AdminDetailsData {
  user: AdminUser;
}

export interface OrganizationData {
  organization: Organization;
}

/* -------------------------------------------------------------------------- */
/* Requests                                                                   */
/* -------------------------------------------------------------------------- */

export interface RegisterRequest {
  organizationName: string;
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  organizationSize?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
