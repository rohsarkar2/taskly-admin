/**
 * Maps API payloads onto the app's domain types.
 *
 * The wire shapes are narrower than what the UI renders — no avatar colour, and
 * a few fields go by different names — so this is where the gap is filled,
 * rather than in each component.
 */

import type {
  ActivityKind,
  ActivityLog,
  AppNotification,
  Employee,
  EmployeeStatus,
  NotificationKind,
  Priority,
  Project,
  ProjectPerson,
  ProjectStatus,
  ProjectTaskStats,
  ProjectWorkflow,
  MentionUser,
  Role,
  Task,
  TaskComment,
  TaskEvent,
  TaskStatus,
} from "@/lib/types";
import {
  EMPLOYEE_STATUSES,
  PRIORITIES,
  PROJECT_STATUSES,
  ROLES,
  TASK_STATUSES,
} from "@/lib/types";
import type {
  ApiActivityLog,
  ApiComment,
  ApiEmployee,
  ApiEmployeeStats,
  ApiNotification,
  ApiPersonRef,
  ApiProject,
  ApiProjectWorkflow,
  ApiTask,
  ApiTaskEvent,
  ApiTaskStats,
  EmployeeStats,
} from "./types";

/** The categorical slots, reused as avatar tints. */
const AVATAR_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#4a3aa7",
  "#008300",
  "#e34948",
];

/**
 * Picks a stable colour from the employee's id.
 *
 * Deterministic on purpose: a random pick would differ between the server and
 * client renders and trip hydration.
 */
export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/**
 * The API speaks snake_case (`team_lead`, `active`); the UI speaks title case
 * (`Team Lead`, `Active`). Comparing on a normalised key covers both, plus the
 * hyphenated and spaced variants.
 */
const normalizeKey = (value: string) =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, "");

function toRole(value: string | undefined): Role {
  if (!value) return "Team Member";
  const key = normalizeKey(value);
  return ROLES.find((role) => normalizeKey(role) === key) ?? "Team Member";
}

function toStatus(value: string | undefined): EmployeeStatus {
  if (!value) return "Pending";
  const key = normalizeKey(value);
  return (
    EMPLOYEE_STATUSES.find((status) => normalizeKey(status) === key) ?? "Pending"
  );
}

/**
 * Converts a UI role back to the API's snake_case enum for writes.
 *
 * The list endpoint stores `team_lead`, so that is treated as canonical — the
 * written spec's `"Team Lead"` form appears to be display text only.
 */
export function toApiRole(role: Role): string {
  return role.trim().toLowerCase().replace(/\s+/g, "_");
}

export function toApiStatus(status: EmployeeStatus): string {
  return status.trim().toLowerCase();
}

/** Trims an ISO timestamp down to the `YYYY-MM-DD` the UI formats. */
function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

export function toEmployee(source: ApiEmployee): Employee {
  return {
    id: source.id,
    name: source.name,
    email: source.email,
    role: toRole(source.role),
    status: toStatus(source.status),
    // The API names these `createdAt` / `approvedAt`; the spec called them
    // `registeredAt` / `joinedAt`. Accept either.
    registeredAt:
      toDateOnly(source.registeredAt) ?? toDateOnly(source.createdAt) ?? "",
    joinedAt: toDateOnly(source.joinedAt) ?? toDateOnly(source.approvedAt),
    phone: source.phone ?? source.phoneNumber ?? undefined,
    jobTitle:
      source.jobTitle ?? source.designation ?? source.department ?? undefined,
    projectIds: source.projectIds ?? [],
    avatarColor: avatarColorFor(source.id || source.email || source.name),
  };
}

export function toEmployees(source: ApiEmployee[]): Employee[] {
  return source.map(toEmployee);
}

/**
 * Maps the server's employee statistics onto the roll-up the profile renders.
 *
 * Two conversions matter: the server reports mean completion in **hours** while
 * the UI shows days, and `completionRate` already arrives as a percentage
 * (`75.0`), so it is rounded rather than multiplied.
 */
export function toEmployeeStats(source: ApiEmployeeStats): EmployeeStats {
  const assigned = source.totalTasks ?? 0;
  const completed = source.completedTasks ?? 0;

  return {
    assigned,
    completed,
    pending: source.activeWorkload ?? Math.max(0, assigned - completed),
    overdue: source.overdueTasks ?? 0,
    completionRate: Math.round(
      source.completionRate ?? (assigned ? (completed / assigned) * 100 : 0),
    ),
    avgCompletionDays:
      source.averageCompletionHours != null
        ? Math.round((source.averageCompletionHours / 24) * 10) / 10
        : undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* Tasks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * The task status enum is snake_case on the wire (`in_progress`), and its
 * `pending` bucket is the UI's "To Do". Anything unrecognised falls back to
 * "To Do" rather than throwing.
 */
export function toTaskStatus(value: string | undefined): TaskStatus {
  if (!value) return "To Do";
  const key = normalizeKey(value);

  const aliases: Record<string, TaskStatus> = {
    pending: "To Do",
    todo: "To Do",
    inprogress: "In Progress",
    pendingapproval: "Pending Approval",
    awaitingapproval: "Pending Approval",
    blocked: "Blocked",
    completed: "Completed",
    done: "Completed",
    rejected: "Rejected",
    cancelled: "Rejected",
    canceled: "Rejected",
  };

  return (
    TASK_STATUSES.find((status) => normalizeKey(status) === key) ??
    aliases[key] ??
    "To Do"
  );
}


/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

function toProjectStatus(value: string | undefined): ProjectStatus {
  if (!value) return "Active";
  const key = normalizeKey(value);
  return (
    PROJECT_STATUSES.find((status) => normalizeKey(status) === key) ?? "Active"
  );
}

export function toPriority(value: string | null | undefined): Priority {
  if (!value) return "Medium";
  const key = normalizeKey(value);
  return (
    PRIORITIES.find((priority) => normalizeKey(priority) === key) ?? "Medium"
  );
}

/** `On Hold` → `on_hold`. */
export function toApiProjectStatus(status: ProjectStatus): string {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

export function toApiPriority(priority: Priority): string {
  return priority.trim().toLowerCase();
}

/** Mongo documents use `_id`; some payloads normalise to `id`. */
function idOf(source: { _id?: string; id?: string }): string {
  return source._id ?? source.id ?? "";
}

/** A person reference is either a bare id or a populated document. */
function refToId(ref: ApiPersonRef): string {
  return typeof ref === "string" ? ref : idOf(ref);
}

function refToPerson(ref: ApiPersonRef): ProjectPerson | null {
  if (typeof ref === "string") return null;
  const id = idOf(ref);
  if (!id) return null;

  return {
    id,
    name: ref.name ?? "Unknown",
    email: ref.email,
    role: ref.role ? toRole(ref.role) : undefined,
    avatarColor: avatarColorFor(id),
  };
}

function refsToIds(refs: ApiPersonRef[] | undefined): string[] {
  return (refs ?? []).map(refToId).filter(Boolean);
}

/**
 * Normalises both task-stat shapes: the list returns buckets inline, the detail
 * endpoint nests them under `byStatus` and adds `remaining`.
 */
export function toProjectTaskStats(
  source: ApiTaskStats | undefined,
): ProjectTaskStats | undefined {
  if (!source) return undefined;

  const buckets = source.byStatus ?? source;
  const read = (key: string) => {
    const value = (buckets as Record<string, unknown>)[key];
    return typeof value === "number" ? value : 0;
  };

  const total = source.total ?? 0;
  const completed = read("completed");

  return {
    total,
    pending: read("pending"),
    inProgress: read("in_progress"),
    pendingApproval: read("pending_approval"),
    completed,
    remaining: source.remaining ?? Math.max(0, total - completed),
    completionPercentage:
      source.completionPercentage ??
      (total ? Math.round((completed / total) * 100) : 0),
  };
}

function toWorkflow(
  source: ApiProjectWorkflow | null | undefined,
): ProjectWorkflow {
  const workflow = source ?? {};

  return {
    // `null` means "inherit the organization default"; these are the defaults
    // the UI shows until the organization settings endpoint says otherwise.
    requireTaskApproval: workflow.requireTaskApproval ?? true,
    approverRole: workflow.approverRole ? toRole(workflow.approverRole) : null,
    approverIds: refsToIds(workflow.approvers ?? undefined),
    defaultPriority: toPriority(workflow.defaultPriority),
    allowMemberTaskCreation: workflow.allowMemberTaskCreation ?? true,
    allowMemberTaskDeletion: workflow.allowMemberTaskDeletion ?? false,
    autoCompleteOnAllTasksDone: workflow.autoCompleteOnAllTasksDone ?? false,
  };
}

export function toProject(source: ApiProject): Project {
  const id = idOf(source);
  const people = [
    ...(source.members ?? []),
    ...(source.managers ?? []),
    ...(source.teamLeads ?? []),
  ]
    .map(refToPerson)
    .filter((person): person is ProjectPerson => person !== null);

  // Managers and team leads are also members, so the lists overlap.
  const unique = new Map(people.map((person) => [person.id, person]));

  return {
    id,
    name: source.name,
    code: source.code ?? source.name.slice(0, 3).toUpperCase(),
    description: source.description ?? "",
    status: toProjectStatus(source.status),
    priority: toPriority(source.priority),
    tags: source.tags ?? [],
    startDate: toDateOnly(source.startDate) ?? "",
    deadline: toDateOnly(source.endDate) ?? "",
    memberIds: refsToIds(source.members),
    leadIds: refsToIds(source.teamLeads),
    managerIds: refsToIds(source.managers),
    people: unique.size ? [...unique.values()] : undefined,
    taskStats: toProjectTaskStats(source.taskStats),
    workflow: toWorkflow(source.workflow),
    createdAt: toDateOnly(source.createdAt) ?? "",
    completedAt: toDateOnly(source.completedAt),
  };
}

export function toProjects(source: ApiProject[]): Project[] {
  return source.map(toProject);
}

/** Strips the domain workflow back to the API's partial payload. */
export function toApiWorkflow(workflow: ProjectWorkflow): ApiProjectWorkflow {
  return {
    requireTaskApproval: workflow.requireTaskApproval,
    approverRole: workflow.approverRole
      ? toApiRole(workflow.approverRole)
      : null,
    approvers: workflow.approverIds,
    defaultPriority: toApiPriority(workflow.defaultPriority),
    allowMemberTaskCreation: workflow.allowMemberTaskCreation,
    allowMemberTaskDeletion: workflow.allowMemberTaskDeletion,
    autoCompleteOnAllTasksDone: workflow.autoCompleteOnAllTasksDone,
  };
}

/* -------------------------------------------------------------------------- */
/* Task documents                                                             */
/* -------------------------------------------------------------------------- */

/** `To Do` → `pending`, `In Progress` → `in_progress`. */
export function toApiTaskStatus(status: TaskStatus): string {
  if (status === "To Do") return "pending";
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

function toActorModel(
  value: string | undefined,
): "Admin" | "Employee" | undefined {
  if (!value) return undefined;
  const key = normalizeKey(value);
  if (key === "admin") return "Admin";
  if (key === "employee" || key === "user") return "Employee";
  return undefined;
}

/**
 * `action` is a machine code (`review_approve`), not display text. Rendering it
 * raw put "review_approve" in the UI, so map the known codes to phrases and
 * fall back to de-snaking anything new.
 */
const ACTION_PHRASES: Record<string, string> = {
  created: "created the task",
  assigned: "assigned the task",
  reassigned: "reassigned the task",
  unassigned: "unassigned the task",
  status_changed: "changed the status",
  priority_changed: "changed the priority",
  due_date_changed: "changed the due date",
  submitted: "submitted the task for approval",
  review_approve: "approved the task",
  review_reject: "rejected the task",
  review_return: "returned the task for changes",
  commented: "commented",
  updated: "updated the task",
  deleted: "deleted the task",
};

function toActionPhrase(value: string | undefined): string {
  if (!value) return "updated the task";
  return ACTION_PHRASES[value] ?? value.replace(/_/g, " ");
}

/**
 * The supporting line under an event.
 *
 * The server's `message` is a whole sentence that already names the actor
 * ("Task approved by Admin One: LGTM"), so repeating it beneath "Admin One
 * approved the task" would say everything twice. Only the part after the colon
 * — the reviewer's actual note — is worth keeping.
 */
function toEventDetail(source: ApiTaskEvent): string | undefined {
  if (source.detail) return source.detail;
  if (source.comments) return source.comments;

  const meta = source.meta ?? {};
  if (typeof meta.from === "string" && typeof meta.to === "string") {
    return `${toTaskStatus(meta.from)} → ${toTaskStatus(meta.to)}`;
  }

  const message = source.message;
  if (message) {
    const colon = message.indexOf(": ");
    if (colon !== -1) return message.slice(colon + 2).trim() || undefined;
  }

  return undefined;
}

function toTaskEvent(source: ApiTaskEvent, index: number): TaskEvent {
  // The actor arrives flat (`actorId` / `actorName` / `actorModel`); the
  // populated forms are accepted only as a fallback.
  const actorRef = source.actor ?? source.user;
  const person = actorRef ? refToPerson(actorRef) : null;
  const actorId = source.actorId ?? (actorRef ? refToId(actorRef) : "") ?? "";

  return {
    id: idOf(source) || `event-${index}`,
    // Full ISO, not date-only: the timeline shows the time of day.
    at: source.createdAt ?? source.at ?? source.timestamp ?? "",
    actorId,
    actorModel: toActorModel(source.actorModel),
    actorName: source.actorName ?? person?.name,
    actorAvatarColor:
      person?.avatarColor ?? (actorId ? avatarColorFor(actorId) : undefined),
    action: toActionPhrase(source.action ?? source.event ?? source.type),
    detail: toEventDetail(source),
  };
}

export function toTask(source: ApiTask): Task {
  // The server populates `projectId` with the project document. Taking it as
  // an id would leak an object into the id field, breaking the project link
  // and the project filter, so resolve both the id and the name from whichever
  // key is present.
  const projectRef = source.project ?? source.projectId;
  const projectId = projectRef ? refToId(projectRef) : "";
  const projectName =
    projectRef && typeof projectRef === "object"
      ? (projectRef.name ?? undefined)
      : undefined;

  const approvers = source.approvers ?? [];
  const people = [
    source.assignee,
    source.createdBy,
    ...approvers,
  ]
    .filter((ref): ref is ApiPersonRef => ref != null)
    .map(refToPerson)
    .filter((person): person is ProjectPerson => person !== null);

  const assigneeId = source.assignee ? refToId(source.assignee) : null;
  const approverIds = refsToIds(approvers);

  return {
    id: idOf(source),
    title: source.title,
    description: source.description ?? "",
    projectId,
    projectName,
    creatorId: source.createdBy ? refToId(source.createdBy) : "",
    assigneeId: assigneeId || null,
    approverId: approverIds[0] ?? null,
    approverIds,
    requiresApproval: source.requiresApproval,
    status: toTaskStatus(source.status),
    priority: toPriority(source.priority),
    tags: source.tags ?? [],
    estimatedHours: source.estimatedHours ?? null,
    actualHours: source.actualHours ?? null,
    createdAt: toDateOnly(source.createdAt) ?? "",
    dueDate: toDateOnly(source.dueDate),
    completedAt: toDateOnly(source.completedAt),
    reviewComment: source.comments ?? source.reviewComment ?? undefined,
    people: people.length
      ? [...new Map(people.map((person) => [person.id, person])).values()]
      : undefined,
    timeline: (source.timeline ?? []).map(toTaskEvent),
  };
}

export function toTasks(source: ApiTask[]): Task[] {
  return source.map(toTask);
}

export function toTaskEvents(source: ApiTaskEvent[]): TaskEvent[] {
  return source.map(toTaskEvent);
}

/* -------------------------------------------------------------------------- */
/* Comments                                                                   */
/* -------------------------------------------------------------------------- */

/** A mention is an id on create and a populated document on read. */
function toMentionUser(ref: ApiPersonRef): MentionUser | null {
  const id = refToId(ref);
  if (!id) return null;

  if (typeof ref === "string") {
    // Only the id was sent; the name is resolved by the caller if needed.
    return { id, name: "", avatarColor: avatarColorFor(id) };
  }

  return {
    id,
    name: ref.name ?? "",
    email: ref.email,
    role: ref.role ? toRole(ref.role) : undefined,
    avatarColor: avatarColorFor(id),
  };
}

export function toMentionUsers(refs: ApiPersonRef[] | undefined): MentionUser[] {
  return (refs ?? [])
    .map(toMentionUser)
    .filter((user): user is MentionUser => user !== null);
}

export function toComment(source: ApiComment): TaskComment {
  const authorId = source.authorId ?? "";

  return {
    id: idOf(source),
    taskId: source.taskId ? refToId(source.taskId) : "",
    parentId: source.parentId ?? null,
    content: source.content ?? "",
    authorId,
    authorName: source.authorName ?? "Unknown",
    authorModel: toActorModel(source.authorModel),
    authorAvatarColor: authorId ? avatarColorFor(authorId) : "#2d5a4c",
    mentions: toMentionUsers(source.mentions),
    replyCount: source.replyCount ?? source.replies?.length ?? 0,
    isEdited: source.isEdited ?? false,
    isDeleted: source.isDeleted ?? false,
    // Full ISO — comments are timestamped to the minute in the UI.
    createdAt: source.createdAt ?? "",
    updatedAt: source.updatedAt ?? undefined,
    // Replies are one level deep, so this never recurses further.
    replies: (source.replies ?? []).map(toComment),
  };
}

export function toComments(source: ApiComment[]): TaskComment[] {
  return source.map(toComment);
}

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

/** Maps the server's `type` onto the icon/colour buckets the inbox renders. */
function toNotificationKind(value: string | undefined): NotificationKind {
  const key = normalizeKey(value ?? "");
  if (key.includes("register") || key.includes("employee")) return "registration";
  if (key.includes("approv")) return "approval";
  if (key.includes("overdue")) return "overdue";
  if (key.includes("deadline") || key.includes("due")) return "deadline";
  if (key.includes("project")) return "project";
  return "task";
}

/** Builds an in-app link from the entity a notification points at. */
function toNotificationHref(
  source: ApiNotification,
): string | undefined {
  if (source.link) return source.link;
  if (source.url) return source.url;
  if (!source.entityId) return undefined;

  switch (normalizeKey(source.entityType ?? "")) {
    case "task":
      return `/dashboard/tasks/${source.entityId}`;
    case "project":
      return `/dashboard/projects/${source.entityId}`;
    case "employee":
      return `/dashboard/employees/${source.entityId}`;
    default:
      return undefined;
  }
}

export function toNotification(source: ApiNotification): AppNotification {
  return {
    id: idOf(source),
    kind: toNotificationKind(source.type),
    title: source.title ?? "Notification",
    body: source.message ?? source.body ?? "",
    at: source.createdAt ?? "",
    read: source.isRead ?? source.read ?? false,
    href: toNotificationHref(source),
  };
}

export function toNotifications(source: ApiNotification[]): AppNotification[] {
  return source.map(toNotification);
}

/* -------------------------------------------------------------------------- */
/* Activity logs                                                              */
/* -------------------------------------------------------------------------- */

/** `employee.approved` → the icon bucket the log groups by. */
function toActivityKind(action: string | undefined, entityType?: string): ActivityKind {
  const key = normalizeKey(`${action ?? ""} ${entityType ?? ""}`);
  if (key.includes("role")) return "role";
  if (key.includes("approv") || key.includes("reject") || key.includes("return"))
    return "approval";
  if (key.includes("project")) return "project";
  if (key.includes("task") || key.includes("comment")) return "task";
  if (key.includes("security") || key.includes("password") || key.includes("session"))
    return "security";
  return "employee";
}

export function toActivityLog(source: ApiActivityLog): ActivityLog {
  return {
    id: idOf(source),
    kind: toActivityKind(source.action, source.entityType),
    actor: source.actorName ?? "System",
    // `description` already reads as a sentence; the dotted action is a
    // fallback so an undocumented entry still says something.
    message: source.description ?? toActionPhrase(source.action?.split(".").pop()),
    at: source.createdAt ?? "",
  };
}

export function toActivityLogs(source: ApiActivityLog[]): ActivityLog[] {
  return source.map(toActivityLog);
}
