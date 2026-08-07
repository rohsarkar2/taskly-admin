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
  FORGOT_PASSWORD: "/admin/auth/forgot-password",
  RESET_PASSWORD: "/admin/auth/reset-password",
  CHANGE_PASSWORD: "/admin/auth/change-password",
} as const;
