

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export type EmptyData = Record<string, never> | null;

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
  contactEmail?: string | null;
  phoneNumber?: string | null;
  contactPhone?: string | null;
  logo?: string | null;
  logoUrl?: string | null;
  timezone?: string | null;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  createdAt?: string;
  isActive?: boolean;
}

export interface OrganizationSettingsPayload {
  settings: {
    workflow: {
      requireTaskApproval: boolean;
      defaultApproverRole: string;
      defaultTaskPriority: string;
      allowEmployeeTaskCreation: boolean;
      allowEmployeeTaskDeletion: boolean;
      autoApproveEmployeeRegistration: boolean;
    };
    security: {
      passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumber: boolean;
        requireSpecialChar: boolean;
      };
      sessionTimeoutMinutes: number;
      enforceSingleSession: boolean;
    };
    notifications: {
      employeeRegistration: boolean;
      taskApprovalRequests: boolean;
      projectDeadlineReminders: boolean;
      overdueTasks: boolean;
      projectCompletion: boolean;
      reportGeneration: boolean;
      emailNotifications: boolean;
      pushNotifications: boolean;
    };
    workingDays: string[];
    workingHours: {
      start: string;
      end: string;
    };
    timezone: string;
  };
}

export interface ApiEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  userType?: string;
  registeredAt?: string;
  joinedAt?: string | null;
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

export interface ApiEmployeeStats {
  totalTasks?: number;
  tasksByStatus?: Record<string, number>;
  completedTasks?: number;
  overdueTasks?: number;
  completionRate?: number;
  averageCompletionHours?: number;
  activeWorkload?: number;
}

export interface EmployeeStatsData {
  employee?: Pick<ApiEmployee, "id" | "name" | "role" | "status">;
  stats: ApiEmployeeStats;
}

export interface EmployeeSummary {
  projectCount?: number;
  totalTasks?: number;
  tasksByStatus?: Record<string, number>;
}

export interface EmployeeDetailData {
  employee: ApiEmployee;
  summary?: EmployeeSummary;
}

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

export interface ApiProjectPerson {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  avatar?: string | null;
}

export type ApiPersonRef = string | ApiProjectPerson;

export interface ApiProjectWorkflow {
  requireTaskApproval?: boolean | null;
  approverRole?: string | null;
  approvers?: ApiPersonRef[] | null;
  defaultPriority?: string | null;
  allowMemberTaskCreation?: boolean | null;
  allowMemberTaskDeletion?: boolean | null;
  autoCompleteOnAllTasksDone?: boolean | null;
}

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

export interface ApiTaskEvent {
  _id?: string;
  id?: string;
  at?: string;
  createdAt?: string;
  timestamp?: string;
  actorId?: string;
  actorName?: string;
  actorModel?: string;
  actor?: ApiPersonRef;
  user?: ApiPersonRef;
  action?: string;
  event?: string;
  type?: string;
  message?: string;
  detail?: string;
  comments?: string;
  meta?: Record<string, unknown>;
}

export interface ApiTask {
  _id?: string;
  id?: string;
  title: string;
  description?: string | null;
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
  status?: string;
  priority?: string;
  projectId?: string;
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

export interface ApiComment {
  _id?: string;
  id?: string;
  organizationId?: string;
  taskId?: ApiPersonRef;
  parentId?: string | null;
  content?: string;
  authorId?: string;
  authorName?: string;
  authorModel?: string;
  mentions?: ApiPersonRef[];
  replyCount?: number;
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface TaskDecisionRequest {
  comments?: string;
}

export interface ProjectAssignRequest {
  managers?: string[];
  teamLeads?: string[];
  mode?: "set" | "add";
}

export interface OrganizationSummary {
  totalEmployees: number;
  activeEmployees: number;
  pendingEmployees: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  organizationCreatedAt: string;
}

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

export interface UpdateOrganizationRequest {
  name?: string;
  industry?: string;
  website?: string;
  email?: string;
  contactEmail?: string;
  phoneNumber?: string;
  contactPhone?: string;
  timezone?: string;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
}

export interface UpdateSettingsRequest {
  timezone?: string;
  workingDays?: string[];
  workingHours?: {
    start: string;
    end: string;
  };
  workflow?: Partial<OrganizationSettingsPayload["settings"]["workflow"]>;
  security?: Partial<OrganizationSettingsPayload["settings"]["security"]>;
  notifications?: Partial<
    OrganizationSettingsPayload["settings"]["notifications"]
  >;
}

export interface UpdateProjectWorkflowRequest {
  approvalRequired: boolean;
  autoApprove: boolean;
  approvers: string[];
  adminCanApprove: boolean;
  defaultPriority: string;
}

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

export interface ForgotPasswordData {
  otp?: string;
  expiresAt: string;
}

export interface VerifyResetOtpRequest {
  email: string;
  otp: string;
}

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
  truncated: boolean;
  rows: Record<string, unknown>[];
}

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

export interface ApiActivityLog {
  _id?: string;
  id?: string;
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
