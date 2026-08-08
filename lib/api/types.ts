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
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  logoUrl?: string | null;
  /** IANA identifier, e.g. `Asia/Kolkata`. */
  timezone?: string | null;
  workingDays?: string[];
  createdAt?: string;
  isActive?: boolean;
}

/** `GET /admin/settings` — organization-wide defaults. */
export interface OrganizationSettingsPayload {
  name: string;
  uniqueOrganizationId: string;
  logoUrl: string | null;
  timezone: string;
  workingDays: string[];
  workflow: {
    approvalRequired: boolean;
    defaultPriority: string;
    statusFlow: string[];
  };
  security: {
    minPasswordLength: number;
    requireNumber: boolean;
    requireUppercase: boolean;
    requireSymbol: boolean;
    sessionTimeoutMinutes: number;
  };
}

/* -------------------------------------------------------------------------- */
/* Employees                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * An employee as the API sends it. Narrower than the app's `Employee` type —
 * `lib/api/adapters.ts` fills in the presentation-only fields.
 */
export interface ApiEmployee {
  id: string;
  name: string;
  email: string;
  /** snake_case enum, e.g. `team_lead`. */
  role: string;
  /** lowercase enum, e.g. `active`. */
  status: string;
  userType?: string;
  /** The spec's names. */
  registeredAt?: string;
  joinedAt?: string | null;
  /** What the server actually sends (ISO timestamps). */
  createdAt?: string;
  approvedAt?: string | null;
  lastLoginAt?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  designation?: string | null;
  department?: string | null;
  avatar?: string | null;
  organizationId?: string;
  organizationName?: string;
  uniqueOrganizationId?: string;
  projectIds?: string[];
}

export interface EmployeeStats {
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  avgCompletionDays?: number;
}

export interface EmployeeProjectSummary {
  id: string;
  name: string;
  status: string;
  deadline?: string;
  roleInProject?: string;
}

export interface EmployeeDetailData {
  employee: ApiEmployee;
  stats?: EmployeeStats;
  projects?: EmployeeProjectSummary[];
  /** Task objects; shape matches the tasks API. */
  tasks?: unknown[];
}

export interface EmployeeData {
  employee: ApiEmployee;
}

export interface EmployeeListParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ApproveEmployeeRequest {
  role: string;
}

export interface RejectEmployeeRequest {
  reason?: string;
}

/** `GET /admin/organization/summary` — headcount and project counts only. */
export interface OrganizationSummary {
  totalEmployees: number;
  activeEmployees: number;
  pendingEmployees: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  organizationCreatedAt: string;
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

export interface LogoUploadData {
  logoUrl: string;
}

/* -------------------------------------------------------------------------- */
/* Organization requests                                                      */
/* -------------------------------------------------------------------------- */

export interface UpdateOrganizationRequest {
  name?: string;
  industry?: string;
  website?: string;
  email?: string;
  phoneNumber?: string;
  timezone?: string;
}

export interface UpdateSettingsRequest {
  timezone?: string;
  workingDays?: string[];
  workflow?: Partial<OrganizationSettingsPayload["workflow"]>;
  security?: Partial<OrganizationSettingsPayload["security"]>;
}

export interface UpdateProjectWorkflowRequest {
  approvalRequired: boolean;
  autoApprove: boolean;
  approvers: string[];
  adminCanApprove: boolean;
  defaultPriority: string;
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

/**
 * Outside production the raw code is echoed back so the flow is testable
 * before a mail transport exists. Never present in production.
 */
export interface ForgotPasswordData {
  otp?: string;
  expiresAt: string;
}

export interface VerifyResetOtpRequest {
  email: string;
  otp: string;
}

/** The OTP is traded for this token; only the token can set a new password. */
export interface VerifyResetOtpData {
  resetToken: string;
  expiresAt: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
