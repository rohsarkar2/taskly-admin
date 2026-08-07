/**
 * Domain model for the Taskly organization workflow.
 *
 * The shapes here mirror what the backend is expected to return, so swapping the
 * static fixtures in `lib/mock-data.ts` for real API calls is a drop-in change.
 */

export const ROLES = ["Team Member", "Team Lead", "Manager"] as const;
export type Role = (typeof ROLES)[number];

/** Roles an admin can assign, plus the org owner role which is not assignable. */
export type UserRole = Role | "Admin";

export const EMPLOYEE_STATUSES = [
  "Pending",
  "Active",
  "Suspended",
  "Rejected",
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const TASK_STATUSES = [
  "To Do",
  "In Progress",
  "Pending Approval",
  "Blocked",
  "Completed",
  "Rejected",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PROJECT_STATUSES = [
  "Active",
  "On Hold",
  "Completed",
  "Archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: EmployeeStatus;
  /** ISO date the employee submitted their registration from the mobile app. */
  registeredAt: string;
  /** ISO date the admin approved them. Null while still pending or rejected. */
  joinedAt: string | null;
  phone?: string;
  jobTitle?: string;
  /** Project ids the employee has been added to. */
  projectIds: string[];
  avatarColor: string;
}

export interface ProjectWorkflow {
  /** When false, tasks go straight to "To Do" with no approval gate. */
  approvalRequired: boolean;
  /** When true, approvals resolve automatically after creation. */
  autoApprove: boolean;
  /** Roles allowed to approve a task in this project. */
  approvers: Role[];
  adminCanApprove: boolean;
  defaultPriority: Priority;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  /** Employee ids assigned to the project. */
  memberIds: string[];
  leadIds: string[];
  managerIds: string[];
  workflow: ProjectWorkflow;
  createdAt: string;
}

export interface TaskEvent {
  id: string;
  at: string;
  actorId: string;
  action: string;
  detail?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  creatorId: string;
  assigneeId: string;
  /** Employee expected to approve this task; null when no approval is required. */
  approverId: string | null;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  dueDate: string;
  completedAt: string | null;
  /** Populated when a task was rejected or returned for changes. */
  reviewComment?: string;
  timeline: TaskEvent[];
}

export type NotificationKind =
  | "registration"
  | "approval"
  | "deadline"
  | "overdue"
  | "project"
  | "task";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
}

export type ActivityKind =
  | "employee"
  | "role"
  | "project"
  | "task"
  | "approval"
  | "security";

export interface ActivityLog {
  id: string;
  kind: ActivityKind;
  actor: string;
  message: string;
  at: string;
}

export interface OrganizationSettings {
  name: string;
  uniqueOrganizationId: string;
  timezone: string;
  workingDays: string[];
  workflow: {
    approvalRequired: boolean;
    defaultPriority: Priority;
    statusFlow: TaskStatus[];
  };
  security: {
    minPasswordLength: number;
    requireNumber: boolean;
    requireSymbol: boolean;
    requireUppercase: boolean;
    sessionTimeoutMinutes: number;
  };
}

/** A single employee's productivity roll-up, derived from tasks. */
export interface EmployeeProductivity {
  employeeId: string;
  name: string;
  role: Role;
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  /** Average days from task creation to completion. */
  avgCompletionDays: number;
  completionRate: number;
}

/** A project roll-up, derived from tasks. */
export interface ProjectPerformance {
  projectId: string;
  name: string;
  status: ProjectStatus;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  blocked: number;
  members: number;
  completionRate: number;
  daysToDeadline: number;
}
