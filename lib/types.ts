
export const ROLES = ["Team Member", "Team Lead", "Manager"] as const;
export type Role = (typeof ROLES)[number];

export type UserRole = Role | "Admin";

export const EMPLOYEE_STATUSES = [
  "Pending",
  "Active",
  "Suspended",
  "Rejected",
  "Removed",
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const TASK_STATUSES = [
  "To Do",
  "In Progress",
  "Pending Approval",
  "Returned",
  "Blocked",
  "Completed",
  "Rejected",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

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
  registeredAt: string;
  joinedAt: string | null;
  phone?: string;
  jobTitle?: string;
  projectIds: string[];
  avatarColor: string;
}

export interface ProjectWorkflow {
  requireTaskApproval: boolean;
  approverRole: Role | null;
  approverIds: string[];
  defaultPriority: Priority;
  allowMemberTaskCreation: boolean;
  allowMemberTaskDeletion: boolean;
  autoCompleteOnAllTasksDone: boolean;
}

export interface ProjectPerson {
  id: string;
  name: string;
  email?: string;
  role?: Role;
  avatarColor: string;
}

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
  code: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  tags: string[];
  startDate: string;
  deadline: string;
  memberIds: string[];
  leadIds: string[];
  managerIds: string[];
  people?: ProjectPerson[];
  taskStats?: ProjectTaskStats;
  workflow: ProjectWorkflow;
  createdAt: string;
  completedAt?: string | null;
}

export interface TaskEvent {
  id: string;
  at: string;
  actorId: string;
  actorModel?: "Admin" | "Employee";
  actorName?: string;
  actorAvatarColor?: string;
  action: string;
  detail?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName?: string;
  creatorId: string;
  assigneeId: string | null;
  approverId: string | null;
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
  reviewComment?: string;
  people?: ProjectPerson[];
  timeline: TaskEvent[];
}

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
  parentId: string | null;
  content: string;
  authorId: string;
  authorName: string;
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

export interface EmployeeProductivity {
  employeeId: string;
  name: string;
  role: Role;
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  avgCompletionDays: number;
  completionRate: number;
}

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
