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
  /** Soft-removed: the record is kept so old tasks still resolve. */
  "Removed",
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const TASK_STATUSES = [
  /** The API calls this `pending`. */
  "To Do",
  "In Progress",
  "Pending Approval",
  /** Sent back by an approver for rework, then resubmitted. */
  "Returned",
  "Blocked",
  "Completed",
  "Rejected",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Statuses an admin may set directly.
 *
 * `Blocked` is excluded: it exists for legacy fixture data but is not part of
 * the server enum, so offering it would only produce a 400.
 */
export const SETTABLE_TASK_STATUSES = TASK_STATUSES.filter(
  (status) => status !== "Blocked",
);

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

/**
 * Per-project workflow overrides.
 *
 * Every field may be left unset on the server, meaning "inherit the
 * organization default"; the UI resolves those to concrete values on read.
 */
export interface ProjectWorkflow {
  /** When false, tasks skip the approval gate entirely. */
  requireTaskApproval: boolean;
  /** Role that approves when no explicit approvers are named. */
  approverRole: Role | null;
  /** Explicit approver employee ids. Take precedence over `approverRole`. */
  approverIds: string[];
  defaultPriority: Priority;
  allowMemberTaskCreation: boolean;
  allowMemberTaskDeletion: boolean;
  /** Completes the project once every task is done. */
  autoCompleteOnAllTasksDone: boolean;
}

/** A member as the project endpoints return them — populated, not just an id. */
export interface ProjectPerson {
  id: string;
  name: string;
  email?: string;
  role?: Role;
  avatarColor: string;
}

/** Task roll-up returned alongside a project. */
export interface ProjectTaskStats {
  total: number;
  pending: number;
  inProgress: number;
  pendingApproval: number;
  completed: number;
  remaining: number;
  completionPercentage: number;
}

export interface Project {
  id: string;
  name: string;
  /** Short project code, e.g. `MOB`. */
  code: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  tags: string[];
  startDate: string;
  /** The API calls this `endDate`. */
  deadline: string;
  /** Employee ids assigned to the project. */
  memberIds: string[];
  leadIds: string[];
  managerIds: string[];
  /** Populated people, when the endpoint returned them. */
  people?: ProjectPerson[];
  /** Present on list and detail responses; absent on fixtures. */
  taskStats?: ProjectTaskStats;
  workflow: ProjectWorkflow;
  createdAt: string;
  completedAt?: string | null;
}

export interface TaskEvent {
  id: string;
  /** ISO date. */
  at: string;
  actorId: string;
  /**
   * Whether the actor was an admin or an employee. Admins are not in the
   * employee directory, so an id lookup alone can never resolve one.
   */
  actorModel?: "Admin" | "Employee";
  /** Carried by the event itself — no directory lookup required. */
  actorName?: string;
  actorAvatarColor?: string;
  /** Human-readable phrase, e.g. "approved the task". */
  action: string;
  /** Supporting line: a review comment, or a status transition. */
  detail?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  /** Present when the endpoint populated the project. */
  projectName?: string;
  creatorId: string;
  /** Null when the task is unassigned. */
  assigneeId: string | null;
  /** First approver, kept for the single-approver views. */
  approverId: string | null;
  /** Every approver the project workflow resolved to. */
  approverIds?: string[];
  requiresApproval?: boolean;
  status: TaskStatus;
  priority: Priority;
  tags?: string[];
  estimatedHours?: number | null;
  actualHours?: number | null;
  createdAt: string;
  dueDate: string | null;
  completedAt: string | null;
  /** Populated when a task was rejected or returned for changes. */
  reviewComment?: string;
  /** Populated people referenced by the task, for name lookups. */
  people?: ProjectPerson[];
  timeline: TaskEvent[];
}

/** A person named in a comment, or offered by the @-mention picker. */
export interface MentionUser {
  id: string;
  name: string;
  email?: string;
  role?: Role;
  avatarColor: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  /** Null for a top-level comment. Replies are one level deep only. */
  parentId: string | null;
  content: string;
  authorId: string;
  authorName: string;
  /** Authors may be admins, who are not in the employee directory. */
  authorModel?: "Admin" | "Employee";
  authorAvatarColor: string;
  mentions: MentionUser[];
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
  replies: TaskComment[];
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
