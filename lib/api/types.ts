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

/** The app-side roll-up the profile renders. */
export interface EmployeeStats {
  assigned: number;
  completed: number;
  pending: number;
  overdue: number;
  completionRate: number;
  avgCompletionDays?: number;
}

/** `GET /employees/:id/stats` — the server's own shape. */
export interface ApiEmployeeStats {
  totalTasks?: number;
  tasksByStatus?: Record<string, number>;
  completedTasks?: number;
  overdueTasks?: number;
  /** Already a percentage, e.g. `75.0`. */
  completionRate?: number;
  averageCompletionHours?: number;
  activeWorkload?: number;
}

export interface EmployeeStatsData {
  employee?: Pick<ApiEmployee, "id" | "name" | "role" | "status">;
  stats: ApiEmployeeStats;
}

/** The lighter roll-up returned inline by `GET /employees/:id`. */
export interface EmployeeSummary {
  projectCount?: number;
  totalTasks?: number;
  tasksByStatus?: Record<string, number>;
}

export interface EmployeeDetailData {
  employee: ApiEmployee;
  summary?: EmployeeSummary;
}

/** `GET /employees/:id/projects` — `projectRole` is scoped to that project. */
export interface ApiEmployeeProject {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
  status?: string;
  priority?: string;
  startDate?: string | null;
  endDate?: string | null;
  managers?: string[];
  teamLeads?: string[];
  projectRole?: string;
}

export interface EmployeeProjectsData {
  projects: ApiEmployeeProject[];
}

export interface EmployeeTasksData {
  tasks: unknown[];
}

export interface EmployeeData {
  employee: ApiEmployee;
}

export interface EmployeeListParams {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "role" | "status" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

export interface ApproveEmployeeRequest {
  role: string;
}

export interface RejectEmployeeRequest {
  reason?: string;
}

export interface SuspendEmployeeRequest {
  reason?: string;
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

/** People arrive populated on reads and as bare ids on writes. */
export interface ApiProjectPerson {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
}

export type ApiPersonRef = string | ApiProjectPerson;

/** A `null` on any field means "inherit the organization default". */
export interface ApiProjectWorkflow {
  requireTaskApproval?: boolean | null;
  approverRole?: string | null;
  /** Explicit approver ids; take precedence over `approverRole`. */
  approvers?: ApiPersonRef[] | null;
  defaultPriority?: string | null;
  allowMemberTaskCreation?: boolean | null;
  allowMemberTaskDeletion?: boolean | null;
  autoCompleteOnAllTasksDone?: boolean | null;
}

/**
 * Task counts. The list endpoint returns the buckets inline; the detail
 * endpoint nests them under `byStatus` and adds `remaining`.
 */
export interface ApiTaskStats {
  total?: number;
  pending?: number;
  in_progress?: number;
  completed?: number;
  pending_approval?: number;
  byStatus?: Record<string, number>;
  completionPercentage?: number;
  remaining?: number;
}

export interface ApiProject {
  _id?: string;
  id?: string;
  name: string;
  code?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  startDate?: string | null;
  endDate?: string | null;
  tags?: string[];
  members?: ApiPersonRef[];
  managers?: ApiPersonRef[];
  teamLeads?: ApiPersonRef[];
  memberCount?: number;
  workflow?: ApiProjectWorkflow | null;
  taskStats?: ApiTaskStats;
  createdAt?: string;
  completedAt?: string | null;
}

export interface ProjectData {
  project: ApiProject;
}

/** The detail endpoint returns `taskStats` as a sibling of `project`. */
export interface ProjectDetailData {
  project: ApiProject;
  taskStats?: ApiTaskStats;
}

export interface ProjectWorkflowData {
  workflow: ApiProjectWorkflow;
}

export interface ProjectMembersData {
  added?: string[];
  removed?: string[];
  members?: ApiPersonRef[];
}

export interface ProjectAssignData {
  managers?: ApiPersonRef[];
  teamLeads?: ApiPersonRef[];
}

export interface ProjectDeleteData {
  deletedTasks?: number;
}

export interface ProjectDocument {
  _id?: string;
  id?: string;
  name?: string;
  url?: string;
  size?: number;
  uploadedAt?: string;
}

export interface ProjectDocumentsData {
  documents: ProjectDocument[];
}

export interface ProjectListParams {
  search?: string;
  status?: string;
  priority?: string;
  memberId?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "endDate" | "priority" | "status";
  sortOrder?: "asc" | "desc";
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  code?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  members?: string[];
  managers?: string[];
  teamLeads?: string[];
  tags?: string[];
  workflow?: ApiProjectWorkflow;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  code?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface ProjectMemberIdsRequest {
  memberIds: string[];
}

/** `set` replaces the list, `add` appends. */
/* -------------------------------------------------------------------------- */
/* Tasks                                                                      */
/* -------------------------------------------------------------------------- */

export interface ApiTaskEvent {
  _id?: string;
  id?: string;
  at?: string;
  createdAt?: string;
  timestamp?: string;
  /** Sent flat, not as a populated document. */
  actorId?: string;
  actorName?: string;
  /** `Admin` | `Employee` — admins are not in the employee directory. */
  actorModel?: string;
  /** Accepted in case another endpoint populates the actor instead. */
  actor?: ApiPersonRef;
  user?: ApiPersonRef;
  /** A machine code such as `review_approve`, not display text. */
  action?: string;
  event?: string;
  type?: string;
  /** A ready-made sentence, e.g. "Task approved by Admin One: LGTM". */
  message?: string;
  detail?: string;
  comments?: string;
  /** Extras per action: `{from,to}`, `{assignee}`, `{commentId}`. */
  meta?: Record<string, unknown>;
}

export interface ApiTask {
  _id?: string;
  id?: string;
  title: string;
  description?: string | null;
  /**
   * The server populates `projectId` with the project document rather than
   * sending a bare id, so this accepts either form.
   */
  project?: ApiPersonRef;
  projectId?: ApiPersonRef;
  createdBy?: ApiPersonRef;
  assignee?: ApiPersonRef | null;
  approvers?: ApiPersonRef[];
  requiresApproval?: boolean;
  status?: string;
  priority?: string;
  tags?: string[];
  estimatedHours?: number | null;
  actualHours?: number | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Reviewer note left on a reject or return. */
  comments?: string | null;
  reviewComment?: string | null;
  timeline?: ApiTaskEvent[];
}

export interface TaskData {
  task: ApiTask;
}

export interface TaskTimelineData {
  timeline: ApiTaskEvent[];
}

export interface TaskApproversData {
  approvers: ApiPersonRef[];
  requiresApproval: boolean;
}

export interface TaskListParams {
  search?: string;
  /** Single value or comma-separated list. */
  status?: string;
  priority?: string;
  projectId?: string;
  /** An employee id, or `none` for unassigned. */
  assignee?: string;
  unassigned?: boolean;
  createdBy?: string;
  tag?: string;
  dueBefore?: string;
  dueAfter?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
  sortBy?:
    | "createdAt"
    | "dueDate"
    | "priority"
    | "status"
    | "title"
    | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateTaskRequest {
  title: string;
  projectId: string;
  description?: string;
  assignee?: string;
  priority?: string;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string | null;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  status?: string;
}

/* -------------------------------------------------------------------------- */
/* Comments                                                                   */
/* -------------------------------------------------------------------------- */

export interface ApiComment {
  _id?: string;
  id?: string;
  organizationId?: string;
  taskId?: ApiPersonRef;
  parentId?: string | null;
  content?: string;
  /** Sent flat, like the timeline actor. */
  authorId?: string;
  authorName?: string;
  authorModel?: string;
  /** Ids when created, populated documents when listed. */
  mentions?: ApiPersonRef[];
  replyCount?: number;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Nested on the list endpoint, oldest first. */
  replies?: ApiComment[];
}

export interface CommentData {
  comment: ApiComment;
}

export interface CommentRepliesData {
  replies: ApiComment[];
}

export interface MentionableUsersData {
  users: ApiPersonRef[];
}

export interface CreateCommentRequest {
  content: string;
  /** Omit for a top-level comment. Replying to a reply is rejected. */
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

/** Approval decisions all use `comments`; reject and return require it. */
export interface TaskDecisionRequest {
  comments?: string;
}

export interface ProjectAssignRequest {
  managers?: string[];
  teamLeads?: string[];
  mode?: "set" | "add";
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

/* -------------------------------------------------------------------------- */
/* Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export interface EmployeeCounts {
  totalEmployees: number;
  activeEmployees: number;
  pendingEmployees: number;
  suspendedEmployees: number;
  rejectedEmployees: number;
  removedEmployees: number;
  managers: number;
  teamLeads: number;
  teamMembers: number;
}

export interface ProjectCounts {
  totalProjects: number;
  activeProjects: number;
  onHoldProjects: number;
  completedProjects: number;
  archivedProjects: number;
}

export interface TaskCounts {
  totalTasks: number;
  pending: number;
  inProgress: number;
  blocked: number;
  pendingApproval: number;
  completed: number;
  rejected: number;
  returned: number;
  cancelled: number;
  overdue: number;
  /** Already a percentage, e.g. `61.9`. */
  completionRate: number;
  byPriority?: Record<string, number>;
}

export interface AnalyticsOverviewData {
  employees: EmployeeCounts;
  projects: ProjectCounts;
  tasks: TaskCounts;
}

export interface ProjectAnalyticsRow {
  projectId: string;
  name: string;
  code?: string;
  status?: string;
  priority?: string;
  memberCount?: number;
  startDate?: string | null;
  endDate?: string | null;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  blockedTasks: number;
  pendingApprovalTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  /** Null until at least one task has completed. */
  estimatedCompletionDate?: string | null;
}

export interface ProjectAnalyticsData {
  summary: ProjectCounts;
  projects: ProjectAnalyticsRow[];
}

export interface TrendPoint {
  date: string;
  created: number;
  completed: number;
}

export interface TaskAnalyticsData {
  summary: TaskCounts;
  trend: TrendPoint[];
}

export interface TrendsData {
  days: number;
  trend: TrendPoint[];
}

export interface EmployeeAnalyticsRow {
  employeeId: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  pendingApprovalTasks: number;
  rejectedTasks: number;
  overdueTasks: number;
  assignedWorkload: number;
  completionRate: number;
  averageCompletionHours: number;
  /** Completion rate minus half the overdue rate, floored at 0. */
  productivityScore: number;
}

export interface EmployeeAnalyticsData {
  employees: EmployeeAnalyticsRow[];
}

export interface TeamMemberRow {
  employeeId: string;
  name: string;
  role?: string;
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  completionRate: number;
  workloadShare: number;
}

export interface TeamAnalyticsRow {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  completionPercentage: number;
  members: TeamMemberRow[];
}

export interface TeamAnalyticsData {
  teams: TeamAnalyticsRow[];
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

export type ReportType = "projects" | "employees" | "teams" | "tasks";
export type ReportFormat = "json" | "csv" | "excel" | "pdf";

export interface ReportDefinition {
  type: ReportType;
  title: string;
  columns: string[];
  filters: string[];
}

export interface ReportCatalogData {
  formats: ReportFormat[];
  maxRows: number;
  reports: ReportDefinition[];
}

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportData {
  type: ReportType;
  generatedAt: string;
  columns: ReportColumn[];
  rowCount: number;
  /** True when the 5000-row cap trimmed the result. */
  truncated: boolean;
  rows: Record<string, unknown>[];
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

export interface ApiNotification {
  _id?: string;
  id?: string;
  type?: string;
  title?: string;
  message?: string;
  body?: string;
  isRead?: boolean;
  read?: boolean;
  entityType?: string;
  entityId?: string;
  link?: string;
  url?: string;
  meta?: Record<string, unknown>;
  createdAt?: string;
}

export interface NotificationsData {
  notifications?: ApiNotification[];
}

export interface UnreadCountData {
  count?: number;
  unreadCount?: number;
}

export interface NotificationListParams {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

/* -------------------------------------------------------------------------- */
/* Activity logs                                                              */
/* -------------------------------------------------------------------------- */

export interface ApiActivityLog {
  _id?: string;
  id?: string;
  /** Dotted vocabulary, e.g. `employee.approved`. */
  action?: string;
  description?: string;
  actorId?: string;
  actorModel?: string;
  actorName?: string;
  entityType?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  createdAt?: string;
}

export interface ActivityLogsData {
  logs: ApiActivityLog[];
}

export interface ActivityActionsData {
  actions: string[];
}

export interface ActivityLogParams {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}
