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
  SETTINGS: "/admin/organization/settings",
  SETTINGS_LOGO: "/admin/organization/logo",

  EMPLOYEES: "/admin/employees",
  EMPLOYEES_PENDING: "/admin/employees/pending",
  EMPLOYEE: (id: string) => `/admin/employees/${id}`,
  EMPLOYEE_APPROVE: (id: string) => `/admin/employees/${id}/approve`,
  EMPLOYEE_REJECT: (id: string) => `/admin/employees/${id}/reject`,
  EMPLOYEE_ROLE: (id: string) => `/admin/employees/${id}/role`,
  EMPLOYEE_SUSPEND: (id: string) => `/admin/employees/${id}/suspend`,
  EMPLOYEE_ACTIVATE: (id: string) => `/admin/employees/${id}/activate`,
  EMPLOYEE_STATS: (id: string) => `/admin/employees/${id}/stats`,
  EMPLOYEE_PROJECTS: (id: string) => `/admin/employees/${id}/projects`,
  EMPLOYEE_TASKS: (id: string) => `/admin/employees/${id}/tasks`,

  PROJECTS: "/admin/projects",
  PROJECT: (id: string) => `/admin/projects/${id}`,
  PROJECT_ARCHIVE: (id: string) => `/admin/projects/${id}/archive`,
  PROJECT_UNARCHIVE: (id: string) => `/admin/projects/${id}/unarchive`,
  PROJECT_MEMBERS: (id: string) => `/admin/projects/${id}/members`,
  PROJECT_MANAGERS: (id: string) => `/admin/projects/${id}/managers`,
  PROJECT_TEAM_LEADS: (id: string) => `/admin/projects/${id}/team-leads`,
  PROJECT_WORKFLOW: (id: string) => `/admin/projects/${id}/workflow`,
  PROJECT_DOCUMENTS: (id: string) => `/admin/projects/${id}/documents`,
  PROJECT_DOCUMENT: (id: string, documentId: string) =>
    `/admin/projects/${id}/documents/${documentId}`,

  TASKS: "/admin/tasks",
  TASK: (id: string) => `/admin/tasks/${id}`,
  TASK_PRIORITY: (id: string) => `/admin/tasks/${id}/priority`,
  TASK_DUE_DATE: (id: string) => `/admin/tasks/${id}/due-date`,
  TASK_REASSIGN: (id: string) => `/admin/tasks/${id}/reassign`,
  TASK_TIMELINE: (id: string) => `/admin/tasks/${id}/timeline`,
  TASKS_PENDING_APPROVAL: "/admin/tasks/approvals/pending",
  TASK_APPROVE: (id: string) => `/admin/tasks/${id}/approve`,
  TASK_REJECT: (id: string) => `/admin/tasks/${id}/reject`,
  TASK_RETURN: (id: string) => `/admin/tasks/${id}/return`,
  TASK_REASSIGN_APPROVERS: (id: string) =>
    `/admin/tasks/${id}/reassign-approvers`,

  TASK_COMMENTS: (id: string) => `/admin/tasks/${id}/comments`,
  TASK_MENTIONABLE: (id: string) => `/admin/tasks/${id}/mentionable`,
  COMMENT: (commentId: string) => `/admin/comments/${commentId}`,
  COMMENT_REPLIES: (commentId: string) =>
    `/admin/comments/${commentId}/replies`,

  ANALYTICS_OVERVIEW: "/admin/analytics/overview",
  ANALYTICS_ORGANIZATION: "/admin/analytics/organization",
  ANALYTICS_PROJECTS: "/admin/analytics/projects",
  ANALYTICS_TASKS: "/admin/analytics/tasks",
  ANALYTICS_EMPLOYEES: "/admin/analytics/employees",
  ANALYTICS_TEAMS: "/admin/analytics/teams",
  ANALYTICS_TRENDS: "/admin/analytics/trends",

  REPORTS: "/admin/reports",
  REPORT: (type: string) => `/admin/reports/${type}`,

  NOTIFICATIONS: "/admin/notifications",
  NOTIFICATIONS_UNREAD_COUNT: "/admin/notifications/unread-count",
  NOTIFICATIONS_READ_ALL: "/admin/notifications/read-all",
  NOTIFICATIONS_CLEAR_READ: "/admin/notifications/read",
  NOTIFICATION: (id: string) => `/admin/notifications/${id}`,
  NOTIFICATION_READ: (id: string) => `/admin/notifications/${id}/read`,

  ACTIVITY_LOGS: "/admin/activity-logs",
  ACTIVITY_LOG_ACTIONS: "/admin/activity-logs/actions",
  ACTIVITY_LOGS_RECENT: "/admin/activity-logs/recent",
} as const;
