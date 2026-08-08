/**
 * Static fixtures for every screen except sign-in / sign-up, which already talk
 * to the real backend.
 *
 * Everything is a plain module constant with fixed ISO dates so server and
 * client renders agree (no `Date.now()` anywhere in the data). `REFERENCE_TODAY`
 * stands in for "now" in every derived metric; when these fixtures are replaced
 * by API responses, swap it for the real current date.
 */

import type {
  ActivityLog,
  AppNotification,
  Employee,
  EmployeeProductivity,
  OrganizationSettings,
  Priority,
  Project,
  ProjectPerformance,
  Role,
  Task,
  TaskEvent,
  TaskStatus,
} from "./types";

export const REFERENCE_TODAY = "2026-08-07";

/* -------------------------------------------------------------------------- */
/* Organization                                                               */
/* -------------------------------------------------------------------------- */

export const organizationSettings: OrganizationSettings = {
  name: "ABC Technologies",
  uniqueOrganizationId: "ORG-5D8K91",
  timezone: "Asia/Kolkata (GMT+5:30)",
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  workflow: {
    approvalRequired: true,
    defaultPriority: "Medium",
    statusFlow: [
      "To Do",
      "In Progress",
      "Pending Approval",
      "Completed",
    ] as TaskStatus[],
  },
  security: {
    minPasswordLength: 8,
    requireNumber: true,
    requireSymbol: false,
    requireUppercase: true,
    sessionTimeoutMinutes: 60,
  },
};

/* -------------------------------------------------------------------------- */
/* Employees                                                                  */
/* -------------------------------------------------------------------------- */

export const employees: Employee[] = [
  {
    id: "e-1",
    name: "Aarav Mehta",
    email: "aarav.mehta@abctech.io",
    role: "Manager",
    status: "Active",
    registeredAt: "2026-01-10",
    joinedAt: "2026-01-12",
    phone: "+91 98200 11234",
    jobTitle: "Engineering Manager",
    projectIds: ["p-1", "p-3"],
    avatarColor: "#2a78d6",
  },
  {
    id: "e-2",
    name: "Priya Sharma",
    email: "priya.sharma@abctech.io",
    role: "Team Lead",
    status: "Active",
    registeredAt: "2026-01-18",
    joinedAt: "2026-01-20",
    phone: "+91 98200 22345",
    jobTitle: "Frontend Lead",
    projectIds: ["p-1", "p-2"],
    avatarColor: "#eb6834",
  },
  {
    id: "e-3",
    name: "Rohit Verma",
    email: "rohit.verma@abctech.io",
    role: "Team Member",
    status: "Active",
    registeredAt: "2026-01-30",
    joinedAt: "2026-02-02",
    phone: "+91 98200 33456",
    jobTitle: "Android Engineer",
    projectIds: ["p-1"],
    avatarColor: "#1baf7a",
  },
  {
    id: "e-4",
    name: "Sneha Iyer",
    email: "sneha.iyer@abctech.io",
    role: "Team Lead",
    status: "Active",
    registeredAt: "2026-02-11",
    joinedAt: "2026-02-14",
    phone: "+91 98200 44567",
    jobTitle: "Backend Lead",
    projectIds: ["p-3", "p-4"],
    avatarColor: "#eda100",
  },
  {
    id: "e-5",
    name: "Karan Malhotra",
    email: "karan.malhotra@abctech.io",
    role: "Team Member",
    status: "Active",
    registeredAt: "2026-02-26",
    joinedAt: "2026-03-01",
    phone: "+91 98200 55678",
    jobTitle: "Full-stack Engineer",
    projectIds: ["p-2", "p-3"],
    avatarColor: "#e87ba4",
  },
  {
    id: "e-6",
    name: "Ananya Bose",
    email: "ananya.bose@abctech.io",
    role: "Manager",
    status: "Active",
    registeredAt: "2026-03-07",
    joinedAt: "2026-03-10",
    phone: "+91 98200 66789",
    jobTitle: "Delivery Manager",
    projectIds: ["p-2", "p-4"],
    avatarColor: "#4a3aa7",
  },
  {
    id: "e-7",
    name: "Vikram Nair",
    email: "vikram.nair@abctech.io",
    role: "Team Member",
    status: "Active",
    registeredAt: "2026-04-02",
    joinedAt: "2026-04-05",
    phone: "+91 98200 77890",
    jobTitle: "QA Engineer",
    projectIds: ["p-1", "p-2"],
    avatarColor: "#e34948",
  },
  {
    id: "e-8",
    name: "Meera Krishnan",
    email: "meera.krishnan@abctech.io",
    role: "Team Member",
    status: "Active",
    registeredAt: "2026-04-19",
    joinedAt: "2026-04-22",
    phone: "+91 98200 88901",
    jobTitle: "UI Designer",
    projectIds: ["p-2"],
    avatarColor: "#008300",
  },
  {
    id: "e-9",
    name: "Arjun Desai",
    email: "arjun.desai@abctech.io",
    role: "Team Member",
    status: "Suspended",
    registeredAt: "2026-04-29",
    joinedAt: "2026-05-02",
    phone: "+91 98200 99012",
    jobTitle: "DevOps Engineer",
    projectIds: ["p-3"],
    avatarColor: "#2a78d6",
  },
  {
    id: "e-10",
    name: "Nikhil Rao",
    email: "nikhil.rao@abctech.io",
    role: "Team Member",
    status: "Active",
    registeredAt: "2026-05-15",
    joinedAt: "2026-05-18",
    phone: "+91 98201 10123",
    jobTitle: "Data Engineer",
    projectIds: ["p-3", "p-5"],
    avatarColor: "#eb6834",
  },
  {
    id: "e-11",
    name: "Tanvi Joshi",
    email: "tanvi.joshi@abctech.io",
    role: "Team Lead",
    status: "Active",
    registeredAt: "2026-05-28",
    joinedAt: "2026-06-01",
    phone: "+91 98201 21234",
    jobTitle: "Product Lead",
    projectIds: ["p-2", "p-4"],
    avatarColor: "#1baf7a",
  },
  {
    id: "e-12",
    name: "Sahil Gupta",
    email: "sahil.gupta@abctech.io",
    role: "Team Member",
    status: "Pending",
    registeredAt: "2026-08-04",
    joinedAt: null,
    phone: "+91 98201 32345",
    projectIds: [],
    avatarColor: "#eda100",
  },
  {
    id: "e-13",
    name: "Ishita Reddy",
    email: "ishita.reddy@abctech.io",
    role: "Team Member",
    status: "Pending",
    registeredAt: "2026-08-05",
    joinedAt: null,
    phone: "+91 98201 43456",
    projectIds: [],
    avatarColor: "#e87ba4",
  },
  {
    id: "e-14",
    name: "Dev Patel",
    email: "dev.patel@abctech.io",
    role: "Team Member",
    status: "Pending",
    registeredAt: "2026-08-06",
    joinedAt: null,
    phone: "+91 98201 54567",
    projectIds: [],
    avatarColor: "#4a3aa7",
  },
  {
    id: "e-15",
    name: "Riya Kapoor",
    email: "riya.kapoor@abctech.io",
    role: "Team Member",
    status: "Pending",
    registeredAt: "2026-08-06",
    joinedAt: null,
    phone: "+91 98201 65678",
    projectIds: [],
    avatarColor: "#e34948",
  },
  {
    id: "e-16",
    name: "Manish Chawla",
    email: "manish.chawla@abctech.io",
    role: "Team Member",
    status: "Rejected",
    registeredAt: "2026-07-20",
    joinedAt: null,
    projectIds: [],
    avatarColor: "#008300",
  },
];

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export const projects: Project[] = [
  {
    id: "p-1",
    name: "Mobile App",
    code: "MOB",
    description:
      "React Native app for employees to register, create tasks and track their work on the go.",
    status: "Active",
    priority: "High",
    tags: [],
    startDate: "2026-02-02",
    deadline: "2026-09-30",
    memberIds: ["e-1", "e-2", "e-3", "e-7"],
    leadIds: ["e-2"],
    managerIds: ["e-1"],
    workflow: {
      requireTaskApproval: true,
      approverRole: "Team Lead",
      approverIds: [],
      defaultPriority: "High",
      allowMemberTaskCreation: true,
      allowMemberTaskDeletion: false,
      autoCompleteOnAllTasksDone: false,
    },
    createdAt: "2026-02-01",
  },
  {
    id: "p-2",
    name: "Website Revamp",
    code: "WEB",
    description:
      "Marketing site rebuild with a new design system, CMS integration and Core Web Vitals budget.",
    status: "Active",
    priority: "High",
    tags: [],
    startDate: "2026-03-16",
    deadline: "2026-08-28",
    memberIds: ["e-2", "e-5", "e-6", "e-7", "e-8", "e-11"],
    leadIds: ["e-2", "e-11"],
    managerIds: ["e-6"],
    workflow: {
      requireTaskApproval: true,
      approverRole: "Team Lead",
      approverIds: [],
      defaultPriority: "Medium",
      allowMemberTaskCreation: true,
      allowMemberTaskDeletion: false,
      autoCompleteOnAllTasksDone: false,
    },
    createdAt: "2026-03-14",
  },
  {
    id: "p-3",
    name: "Backend API",
    code: "API",
    description:
      "Core services for auth, organizations, task workflow and reporting. Powers both admin and mobile clients.",
    status: "Active",
    priority: "High",
    tags: [],
    startDate: "2026-02-16",
    deadline: "2026-10-15",
    memberIds: ["e-1", "e-4", "e-5", "e-9", "e-10"],
    leadIds: ["e-4"],
    managerIds: ["e-1"],
    workflow: {
      requireTaskApproval: true,
      approverRole: "Team Lead",
      approverIds: [],
      defaultPriority: "High",
      allowMemberTaskCreation: true,
      allowMemberTaskDeletion: false,
      autoCompleteOnAllTasksDone: false,
    },
    createdAt: "2026-02-15",
  },
  {
    id: "p-4",
    name: "HR Portal",
    code: "HRP",
    description:
      "Internal portal for leave, payroll exports and onboarding checklists. Paused pending vendor decision.",
    status: "On Hold",
    priority: "Low",
    tags: [],
    startDate: "2026-06-08",
    deadline: "2026-11-20",
    memberIds: ["e-4", "e-6", "e-11"],
    leadIds: ["e-11"],
    managerIds: ["e-6"],
    workflow: {
      requireTaskApproval: false,
      approverRole: "Manager",
      approverIds: [],
      defaultPriority: "Low",
      allowMemberTaskCreation: true,
      allowMemberTaskDeletion: false,
      autoCompleteOnAllTasksDone: false,
    },
    createdAt: "2026-06-05",
  },
  {
    id: "p-5",
    name: "Data Migration",
    code: "DMG",
    description:
      "One-off migration of legacy task records into the new schema. Delivered ahead of the June deadline.",
    status: "Completed",
    priority: "Medium",
    tags: [],
    startDate: "2026-04-06",
    deadline: "2026-06-30",
    memberIds: ["e-10", "e-4"],
    leadIds: ["e-4"],
    managerIds: ["e-1"],
    workflow: {
      requireTaskApproval: true,
      approverRole: "Team Lead",
      approverIds: [],
      defaultPriority: "Medium",
      allowMemberTaskCreation: true,
      allowMemberTaskDeletion: false,
      autoCompleteOnAllTasksDone: false,
    },
    createdAt: "2026-04-01",
  },
  {
    id: "p-6",
    name: "Legacy CRM",
    code: "CRM",
    description:
      "Superseded by the Backend API project. Kept read-only for historical reporting.",
    status: "Archived",
    priority: "Low",
    tags: [],
    startDate: "2026-01-12",
    deadline: "2026-05-15",
    memberIds: ["e-1"],
    leadIds: [],
    managerIds: ["e-1"],
    workflow: {
      requireTaskApproval: false,
      approverRole: null,
      approverIds: [],
      defaultPriority: "Low",
      allowMemberTaskCreation: true,
      allowMemberTaskDeletion: false,
      autoCompleteOnAllTasksDone: false,
    },
    createdAt: "2026-01-10",
  },
];

/* -------------------------------------------------------------------------- */
/* Tasks                                                                      */
/* -------------------------------------------------------------------------- */

/** Compact tuple form keeps ~40 fixtures readable: */
type TaskSeed = [
  id: string,
  title: string,
  projectId: string,
  creatorId: string,
  assigneeId: string,
  approverId: string | null,
  status: TaskStatus,
  priority: Priority,
  createdAt: string,
  dueDate: string,
  completedAt: string | null,
];

const taskSeeds: TaskSeed[] = [
  // Mobile App
  ["t-1001", "Organization ID validation on registration screen", "p-1", "e-2", "e-3", "e-2", "Completed", "High", "2026-06-08", "2026-06-18", "2026-06-16"],
  ["t-1002", "Offline task queue with background sync", "p-1", "e-3", "e-3", "e-2", "In Progress", "High", "2026-07-14", "2026-08-14", null],
  ["t-1003", "Push notification for approval decisions", "p-1", "e-2", "e-7", "e-2", "Pending Approval", "Medium", "2026-07-28", "2026-08-12", null],
  ["t-1004", "Biometric unlock for returning users", "p-1", "e-3", "e-3", "e-1", "To Do", "Low", "2026-08-03", "2026-08-25", null],
  ["t-1005", "Crash on task detail when approver is unset", "p-1", "e-7", "e-3", "e-2", "In Progress", "Urgent", "2026-08-01", "2026-08-05", null],
  ["t-1006", "Regression pass on Android 15 devices", "p-1", "e-7", "e-7", "e-2", "Completed", "Medium", "2026-07-02", "2026-07-20", "2026-07-18"],
  ["t-1007", "Empty states for projects with no tasks", "p-1", "e-2", "e-3", "e-2", "Completed", "Low", "2026-06-22", "2026-07-04", "2026-07-01"],
  ["t-1008", "Deep link from notification into task detail", "p-1", "e-3", "e-7", "e-2", "Blocked", "Medium", "2026-07-21", "2026-08-06", null],
  ["t-1009", "Token refresh loop on expired sessions", "p-1", "e-2", "e-3", "e-1", "Pending Approval", "High", "2026-08-02", "2026-08-18", null],
  ["t-1010", "Accessibility audit for task creation flow", "p-1", "e-7", "e-7", "e-2", "To Do", "Medium", "2026-08-05", "2026-08-29", null],

  // Website Revamp
  ["t-2001", "Design tokens for the new marketing palette", "p-2", "e-11", "e-8", "e-2", "Completed", "High", "2026-05-04", "2026-05-20", "2026-05-18"],
  ["t-2002", "Rebuild pricing page with CMS blocks", "p-2", "e-2", "e-5", "e-2", "Completed", "High", "2026-06-01", "2026-06-19", "2026-06-17"],
  ["t-2003", "Lighthouse budget under 2s LCP on 4G", "p-2", "e-11", "e-5", "e-11", "In Progress", "Urgent", "2026-07-20", "2026-08-11", null],
  ["t-2004", "Case study template and first three entries", "p-2", "e-8", "e-8", "e-11", "In Progress", "Medium", "2026-07-24", "2026-08-15", null],
  ["t-2005", "Broken canonical tags on localized routes", "p-2", "e-6", "e-5", "e-11", "Pending Approval", "High", "2026-08-01", "2026-08-09", null],
  ["t-2006", "Cookie consent banner rework", "p-2", "e-11", "e-8", "e-11", "To Do", "Medium", "2026-08-04", "2026-08-27", null],
  ["t-2007", "Migrate blog archive off the legacy CMS", "p-2", "e-2", "e-5", "e-2", "Blocked", "Medium", "2026-07-06", "2026-08-01", null],
  ["t-2008", "Contact form spam filtering", "p-2", "e-7", "e-7", "e-11", "Completed", "Low", "2026-06-15", "2026-07-02", "2026-06-30"],
  ["t-2009", "Cross-browser QA sweep before launch", "p-2", "e-7", "e-7", "e-11", "To Do", "High", "2026-08-06", "2026-08-24", null],
  ["t-2010", "Rejected: replace hero video with autoplay reel", "p-2", "e-8", "e-8", "e-11", "Rejected", "Low", "2026-07-11", "2026-07-31", null],
  ["t-2011", "SEO metadata for all top-level routes", "p-2", "e-11", "e-5", "e-11", "In Progress", "Medium", "2026-07-27", "2026-08-06", null],

  // Backend API
  ["t-3001", "Admin registration returns the organization ID", "p-3", "e-4", "e-5", "e-4", "Completed", "Urgent", "2026-05-11", "2026-05-25", "2026-05-22"],
  ["t-3002", "Employee approval endpoint with role assignment", "p-3", "e-1", "e-4", "e-1", "Completed", "Urgent", "2026-06-02", "2026-06-20", "2026-06-18"],
  ["t-3003", "Refresh token rotation and revoke list", "p-3", "e-4", "e-9", "e-4", "In Progress", "High", "2026-07-15", "2026-08-13", null],
  ["t-3004", "Per-project workflow configuration API", "p-3", "e-4", "e-5", "e-1", "In Progress", "High", "2026-07-22", "2026-08-19", null],
  ["t-3005", "Task approval state machine + audit trail", "p-3", "e-1", "e-4", "e-1", "Pending Approval", "Urgent", "2026-07-30", "2026-08-10", null],
  ["t-3006", "Organization analytics aggregation endpoint", "p-3", "e-4", "e-10", "e-4", "To Do", "High", "2026-08-04", "2026-09-01", null],
  ["t-3007", "Rate limiting on auth routes", "p-3", "e-9", "e-9", "e-4", "Blocked", "Medium", "2026-07-09", "2026-08-02", null],
  ["t-3008", "Password reset token expiry and single use", "p-3", "e-4", "e-5", "e-4", "Completed", "High", "2026-06-24", "2026-07-10", "2026-07-08"],
  ["t-3009", "CSV and PDF report generation service", "p-3", "e-10", "e-10", "e-4", "To Do", "Medium", "2026-08-05", "2026-09-04", null],
  ["t-3010", "Notification fan-out worker", "p-3", "e-4", "e-10", "e-1", "In Progress", "Medium", "2026-07-25", "2026-08-04", null],
  ["t-3011", "Soft delete and restore for employees", "p-3", "e-1", "e-5", "e-4", "To Do", "Low", "2026-08-06", "2026-09-08", null],

  // HR Portal
  ["t-4001", "Leave balance calculation rules", "p-4", "e-11", "e-4", "e-6", "To Do", "Low", "2026-06-16", "2026-08-20", null],
  ["t-4002", "Onboarding checklist template builder", "p-4", "e-6", "e-11", "e-6", "In Progress", "Low", "2026-06-29", "2026-08-30", null],
  ["t-4003", "Payroll export format review with finance", "p-4", "e-6", "e-6", "e-6", "Blocked", "Medium", "2026-07-01", "2026-07-30", null],

  // Data Migration (delivered)
  ["t-5001", "Map legacy task statuses to the new enum", "p-5", "e-4", "e-10", "e-4", "Completed", "High", "2026-04-13", "2026-04-30", "2026-04-28"],
  ["t-5002", "Dry-run migration against a staging snapshot", "p-5", "e-10", "e-10", "e-4", "Completed", "High", "2026-05-04", "2026-05-22", "2026-05-20"],
  ["t-5003", "Cutover runbook and rollback plan", "p-5", "e-4", "e-4", "e-4", "Completed", "Urgent", "2026-05-25", "2026-06-12", "2026-06-11"],
  ["t-5004", "Post-migration integrity report", "p-5", "e-10", "e-10", "e-4", "Completed", "Medium", "2026-06-15", "2026-06-29", "2026-06-26"],
];

const DESCRIPTIONS: Record<TaskStatus, string> = {
  "To Do": "Scoped and queued. Not picked up yet.",
  "In Progress": "Actively being worked on by the assignee.",
  "Pending Approval": "Submitted by the creator and waiting on an approver.",
  Returned: "Sent back by an approver for rework before resubmitting.",
  Blocked: "Work has stopped pending an external dependency.",
  Completed: "Delivered and signed off by the approver.",
  Rejected: "Returned by the approver with comments.",
};

const REVIEW_COMMENTS: Record<string, string> = {
  "t-2010":
    "Autoplay video conflicts with the performance budget agreed for launch. Re-open with a static hero and a click-to-play fallback.",
};

function buildTimeline(seed: TaskSeed): TaskEvent[] {
  const [id, , , creatorId, assigneeId, approverId, status, , createdAt, , completedAt] =
    seed;
  const events: TaskEvent[] = [
    {
      id: `${id}-ev-1`,
      at: createdAt,
      actorId: creatorId,
      action: "created the task",
    },
  ];

  if (assigneeId !== creatorId) {
    events.push({
      id: `${id}-ev-2`,
      at: createdAt,
      actorId: creatorId,
      action: "assigned the task",
      detail: nameOf(assigneeId),
    });
  }

  if (status !== "To Do") {
    events.push({
      id: `${id}-ev-3`,
      at: addDays(createdAt, 1),
      actorId: assigneeId,
      action: "moved the task to In Progress",
    });
  }

  if (status === "Blocked") {
    events.push({
      id: `${id}-ev-4`,
      at: addDays(createdAt, 4),
      actorId: assigneeId,
      action: "marked the task Blocked",
      detail: "Waiting on an external dependency",
    });
  }

  if (
    (status === "Pending Approval" ||
      status === "Completed" ||
      status === "Rejected") &&
    approverId
  ) {
    events.push({
      id: `${id}-ev-5`,
      at: addDays(createdAt, 3),
      actorId: assigneeId,
      action: "submitted the task for approval",
      detail: `Approver: ${nameOf(approverId)}`,
    });
  }

  if (status === "Completed" && completedAt && approverId) {
    events.push({
      id: `${id}-ev-6`,
      at: completedAt,
      actorId: approverId,
      action: "approved and closed the task",
    });
  }

  if (status === "Rejected" && approverId) {
    events.push({
      id: `${id}-ev-7`,
      at: addDays(createdAt, 5),
      actorId: approverId,
      action: "rejected the task",
      detail: REVIEW_COMMENTS[id],
    });
  }

  return events;
}

export const tasks: Task[] = taskSeeds.map((seed) => {
  const [
    id,
    title,
    projectId,
    creatorId,
    assigneeId,
    approverId,
    status,
    priority,
    createdAt,
    dueDate,
    completedAt,
  ] = seed;

  return {
    id,
    title,
    description: DESCRIPTIONS[status],
    projectId,
    creatorId,
    assigneeId,
    approverId,
    status,
    priority,
    createdAt,
    dueDate,
    completedAt,
    reviewComment: REVIEW_COMMENTS[id],
    timeline: buildTimeline(seed),
  };
});

/* -------------------------------------------------------------------------- */
/* Notifications & activity                                                   */
/* -------------------------------------------------------------------------- */

export const notifications: AppNotification[] = [
  {
    id: "n-1",
    kind: "registration",
    title: "4 employees are waiting for approval",
    body: "Sahil Gupta, Ishita Reddy, Dev Patel and Riya Kapoor registered with ORG-5D8K91.",
    at: "2026-08-06",
    read: false,
    href: "/dashboard/requests",
  },
  {
    id: "n-2",
    kind: "approval",
    title: "Task approval requested",
    body: "Sneha Iyer submitted “Task approval state machine + audit trail” for your approval.",
    at: "2026-08-06",
    read: false,
    href: "/dashboard/approvals",
  },
  {
    id: "n-3",
    kind: "overdue",
    title: "5 tasks are past their due date",
    body: "Across Mobile App, Website Revamp and Backend API.",
    at: "2026-08-06",
    read: false,
    href: "/dashboard/tasks?status=overdue",
  },
  {
    id: "n-4",
    kind: "deadline",
    title: "Website Revamp is due in 21 days",
    body: "9 of 11 tasks still open. Deadline 28 Aug 2026.",
    at: "2026-08-05",
    read: true,
    href: "/dashboard/projects/p-2",
  },
  {
    id: "n-5",
    kind: "task",
    title: "Urgent task past due",
    body: "“Crash on task detail when approver is unset” was due 5 Aug 2026.",
    at: "2026-08-05",
    read: true,
    href: "/dashboard/tasks/t-1005",
  },
  {
    id: "n-6",
    kind: "project",
    title: "Data Migration completed",
    body: "All 4 tasks delivered ahead of the 30 Jun 2026 deadline.",
    at: "2026-06-29",
    read: true,
    href: "/dashboard/projects/p-5",
  },
];

export const activityLogs: ActivityLog[] = [
  {
    id: "a-1",
    kind: "employee",
    actor: "Riya Kapoor",
    message: "registered with organization ORG-5D8K91 and is awaiting approval",
    at: "2026-08-06",
  },
  {
    id: "a-2",
    kind: "employee",
    actor: "Dev Patel",
    message: "registered with organization ORG-5D8K91 and is awaiting approval",
    at: "2026-08-06",
  },
  {
    id: "a-3",
    kind: "approval",
    actor: "Sneha Iyer",
    message: "submitted “Task approval state machine + audit trail” for approval",
    at: "2026-08-06",
  },
  {
    id: "a-4",
    kind: "task",
    actor: "Karan Malhotra",
    message: "moved “SEO metadata for all top-level routes” to In Progress",
    at: "2026-08-05",
  },
  {
    id: "a-5",
    kind: "employee",
    actor: "Admin",
    message: "suspended Arjun Desai",
    at: "2026-08-03",
  },
  {
    id: "a-6",
    kind: "role",
    actor: "Admin",
    message: "assigned the Team Lead role to Tanvi Joshi",
    at: "2026-07-30",
  },
  {
    id: "a-7",
    kind: "approval",
    actor: "Tanvi Joshi",
    message: "rejected “Replace hero video with autoplay reel” with comments",
    at: "2026-07-16",
  },
  {
    id: "a-8",
    kind: "project",
    actor: "Admin",
    message: "put the HR Portal project On Hold",
    at: "2026-07-12",
  },
  {
    id: "a-9",
    kind: "security",
    actor: "Admin",
    message: "changed the session timeout to 60 minutes",
    at: "2026-07-05",
  },
  {
    id: "a-10",
    kind: "project",
    actor: "Admin",
    message: "archived the Legacy CRM project",
    at: "2026-06-30",
  },
  {
    id: "a-11",
    kind: "project",
    actor: "Admin",
    message: "marked Data Migration as Completed",
    at: "2026-06-29",
  },
  {
    id: "a-12",
    kind: "employee",
    actor: "Admin",
    message: "approved Tanvi Joshi as a Team Lead",
    at: "2026-06-01",
  },
];

/** Monthly created-vs-completed volume for the trend chart. */
export const monthlyTaskVolume = [
  { month: "Feb", created: 14, completed: 9 },
  { month: "Mar", created: 22, completed: 17 },
  { month: "Apr", created: 27, completed: 21 },
  { month: "May", created: 31, completed: 28 },
  { month: "Jun", created: 35, completed: 33 },
  { month: "Jul", created: 41, completed: 30 },
  { month: "Aug", created: 18, completed: 7 },
];

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Parses a date.
 *
 * A bare `yyyy-mm-dd` is read as UTC so day arithmetic never shifts by
 * timezone; a full ISO timestamp is passed through untouched.
 */
export function parseDate(iso: string): Date {
  return new Date(iso.includes("T") ? iso : `${iso}T00:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = parseDate(toIso).getTime() - parseDate(fromIso).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * `12 Jun 2026` — stable across locales, so no hydration drift.
 *
 * Accepts null so callers can pass optional dates (an unset task due date, for
 * instance) without guarding at every site.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = parseDate(iso);
  // An unparseable value would otherwise render as "NaN undefined NaN".
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * `7 Aug 2026, 11:57 pm` — date plus 12-hour time, in the reader's own
 * timezone.
 *
 * Local time is safe here because everything that calls this renders inside
 * the dashboard, which `AuthGuard` withholds until the session is restored in
 * an effect — so it is never part of the server-rendered HTML and cannot cause
 * a hydration mismatch. Values with no time component fall back to the date.
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  if (!iso.includes("T")) return formatDate(iso);

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";

  const hours = d.getHours();
  // Midnight and noon are 12, not 0 — `% 12` alone would print "0:27 am".
  const hour12 = hours % 12 || 12;
  const meridiem = hours < 12 ? "am" : "pm";
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}, ${hour12}:${minutes} ${meridiem}`;
}

/** `9 Jul` — compact axis label for a daily series. */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = parseDate(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
}

/** `3 days ago` / `in 5 days`, measured against `REFERENCE_TODAY`. */
export function relativeToToday(iso: string): string {
  const diff = daysBetween(REFERENCE_TODAY, iso);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${Math.abs(diff)} days ago`;
}

/* -------------------------------------------------------------------------- */
/* Lookups                                                                    */
/* -------------------------------------------------------------------------- */

export function employeeById(id: string): Employee | undefined {
  return employees.find((e) => e.id === id);
}

export function nameOf(id: string): string {
  return employeeById(id)?.name ?? "Unknown";
}

export function projectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function projectNameOf(id: string): string {
  return projectById(id)?.name ?? "Unknown";
}

export function taskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* -------------------------------------------------------------------------- */
/* Derived metrics                                                            */
/* -------------------------------------------------------------------------- */

/** A task is overdue when it is past due and not yet in a terminal state. */
export function isOverdue(task: Task): boolean {
  if (!task.dueDate) return false;
  if (task.status === "Completed" || task.status === "Rejected") return false;
  return daysBetween(REFERENCE_TODAY, task.dueDate) < 0;
}

export const pendingEmployees = employees.filter((e) => e.status === "Pending");
export const activeEmployees = employees.filter((e) => e.status === "Active");

export const pendingApprovalTasks = tasks.filter(
  (t) => t.status === "Pending Approval",
);
export const overdueTasks = tasks.filter(isOverdue);

export function countByRole(role: Role): number {
  return activeEmployees.filter((e) => e.role === role).length;
}

export function taskStatusBreakdown(source: Task[] = tasks) {
  const counts: Record<string, number> = {
    "To Do": 0,
    "In Progress": 0,
    "Pending Approval": 0,
    Returned: 0,
    Blocked: 0,
    Completed: 0,
    Rejected: 0,
  };
  for (const task of source) counts[task.status] += 1;
  return counts;
}

export function employeeProductivity(): EmployeeProductivity[] {
  return activeEmployees
    .map((employee) => {
      const assignedTasks = tasks.filter((t) => t.assigneeId === employee.id);
      const completedTasks = assignedTasks.filter(
        (t) => t.status === "Completed",
      );
      const pending = assignedTasks.filter(
        (t) => t.status !== "Completed" && t.status !== "Rejected",
      ).length;
      const overdue = assignedTasks.filter(isOverdue).length;

      const totalDays = completedTasks.reduce(
        (sum, t) => sum + daysBetween(t.createdAt, t.completedAt!),
        0,
      );

      return {
        employeeId: employee.id,
        name: employee.name,
        role: employee.role,
        assigned: assignedTasks.length,
        completed: completedTasks.length,
        pending,
        overdue,
        avgCompletionDays: completedTasks.length
          ? Math.round((totalDays / completedTasks.length) * 10) / 10
          : 0,
        completionRate: assignedTasks.length
          ? Math.round((completedTasks.length / assignedTasks.length) * 100)
          : 0,
      };
    })
    .sort((a, b) => b.completed - a.completed);
}

export function projectPerformance(): ProjectPerformance[] {
  return projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id);
    const completed = projectTasks.filter(
      (t) => t.status === "Completed",
    ).length;

    return {
      projectId: project.id,
      name: project.name,
      status: project.status,
      total: projectTasks.length,
      completed,
      pending: projectTasks.filter(
        (t) => t.status !== "Completed" && t.status !== "Rejected",
      ).length,
      overdue: projectTasks.filter(isOverdue).length,
      blocked: projectTasks.filter((t) => t.status === "Blocked").length,
      members: project.memberIds.length,
      completionRate: projectTasks.length
        ? Math.round((completed / projectTasks.length) * 100)
        : 0,
      daysToDeadline: daysBetween(REFERENCE_TODAY, project.deadline),
    };
  });
}

/** Completion rate and workload aggregated by role, for the team comparison. */
export function teamPerformance() {
  const productivity = employeeProductivity();
  const roles: Role[] = ["Manager", "Team Lead", "Team Member"];

  return roles.map((role) => {
    const members = productivity.filter((p) => p.role === role);
    const assigned = members.reduce((s, m) => s + m.assigned, 0);
    const completed = members.reduce((s, m) => s + m.completed, 0);

    return {
      role,
      headcount: members.length,
      assigned,
      completed,
      pending: members.reduce((s, m) => s + m.pending, 0),
      overdue: members.reduce((s, m) => s + m.overdue, 0),
      completionRate: assigned ? Math.round((completed / assigned) * 100) : 0,
      avgWorkload: members.length
        ? Math.round((assigned / members.length) * 10) / 10
        : 0,
    };
  });
}

export function organizationOverview() {
  const statuses = taskStatusBreakdown();

  return {
    totalEmployees: employees.filter((e) => e.status !== "Rejected").length,
    activeEmployees: activeEmployees.length,
    pendingEmployees: pendingEmployees.length,
    managers: countByRole("Manager"),
    teamLeads: countByRole("Team Lead"),
    teamMembers: countByRole("Team Member"),
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "Active").length,
    completedProjects: projects.filter((p) => p.status === "Completed").length,
    totalTasks: tasks.length,
    todo: statuses["To Do"],
    inProgress: statuses["In Progress"],
    pendingApproval: statuses["Pending Approval"],
    blocked: statuses.Blocked,
    completed: statuses.Completed,
    rejected: statuses.Rejected,
    overdue: overdueTasks.length,
  };
}
