/**
 * Every admin API path in one place.
 *
 * `app/axios/Axios.ts` reads `REFRESH_TOKEN` from here too, so the interceptor
 * and the API layer can never drift apart.
 */
export const ADMIN_ENDPOINTS = {
  REGISTER: "/admin/auth/register",
  LOGIN: "/admin/auth/login",
  REFRESH_TOKEN: "/admin/auth/refresh-token",
  LOGOUT: "/admin/auth/logout",
  DETAILS: "/admin/auth/me",
  ORGANIZATION: "/admin/organization",
  CHANGE_PASSWORD: "/admin/auth/change-password",

  // Password reset runs in three steps:
  // forgot-password → verify-reset-otp → reset-password.
  FORGOT_PASSWORD: "/admin/auth/forgot-password",
  VERIFY_RESET_OTP: "/admin/auth/verify-reset-otp",
  RESET_PASSWORD: "/admin/auth/reset-password",

  ORGANIZATION_SUMMARY: "/admin/organization/summary",
  SETTINGS: "/admin/settings",
  SETTINGS_LOGO: "/admin/settings/logo",

  EMPLOYEES: "/admin/employees",
  EMPLOYEES_PENDING: "/admin/employees/pending",
  EMPLOYEE: (id: string) => `/admin/employees/${id}`,
  EMPLOYEE_APPROVE: (id: string) => `/admin/employees/${id}/approve`,
  EMPLOYEE_REJECT: (id: string) => `/admin/employees/${id}/reject`,
  EMPLOYEE_ROLE: (id: string) => `/admin/employees/${id}/role`,
  EMPLOYEE_STATUS: (id: string) => `/admin/employees/${id}/status`,

  PROJECT_WORKFLOW: (projectId: string) =>
    `/admin/projects/${projectId}/workflow`,
} as const;
