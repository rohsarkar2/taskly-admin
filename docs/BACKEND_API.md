# Taskly Admin — Backend API Requirements

What the admin web app calls today, what has to change, and what still needs to be
built for the full workflow.

**Base URL:** `NEXT_PUBLIC_TASKLY_BASE_URL` (defaults to `http://localhost:8080`)

**Status legend**

| Mark | Meaning |
|---|---|
| ✅ | Contract agreed — the UI calls it today |
| 📋 | UI runs on static fixtures — endpoint needed to make it real |

**§1 (authentication) is settled.** All nine endpoints are implemented in the UI
against the agreed contract and live in [lib/api/auth.ts](../lib/api/auth.ts) —
one typed function per endpoint, paths in
[lib/api/endpoints.ts](../lib/api/endpoints.ts), wire types in
[lib/api/types.ts](../lib/api/types.ts). No page builds its own request.

Everything marked 📋 is currently served from [lib/mock-data.ts](../lib/mock-data.ts).
The shapes below match [lib/types.ts](../lib/types.ts) exactly, so wiring a screen up
is a matter of replacing the fixture import with a fetch.

---

## Conventions

### Auth

All authenticated routes take `Authorization: Bearer <accessToken>`.
[app/axios/Axios.ts](../app/axios/Axios.ts) attaches it automatically and, on a
`401`, retries once after calling `POST /admin/refresh-token`. If the refresh
fails it clears the session and redirects to `/sign-in`.

**This means every protected endpoint must return `401` (not `403`) for an expired
access token**, otherwise the refresh interceptor never fires.

### Messages

Every §1 endpoint returns a `message` alongside its payload, and the UI shows it
verbatim in the success toast:

```json
{ "message": "Organization created successfully.", "user": { "…": "…" } }
```

Where `message` is absent the UI falls back to its own copy, so it is safe to omit
— but the backend's wording wins when present.

### Errors

```json
{ "message": "Human-readable text shown to the admin in a toast" }
```

Errors use the same field. `getErrorMessage()` in
[lib/api/auth.ts](../lib/api/auth.ts) reads `error.response.data.message` and falls
back to a per-call-site string for network failures. Use the right status code:

| Code | Use for |
|---|---|
| `400` | Validation failure |
| `401` | Missing/expired access token |
| `403` | Valid token, but not allowed (e.g. another org's resource) |
| `404` | Resource not found |
| `409` | Conflict (duplicate email, duplicate project key) |

### Scoping

Every request is scoped to the admin's organization, taken from the JWT — never
from a request parameter. An admin must not be able to read or write another
organization's employees, projects or tasks.

### Dates

All dates are ISO `YYYY-MM-DD` strings (no time component) unless noted. The UI
parses them as UTC so they never shift by timezone.

### Pagination

List endpoints should accept `?page=1&limit=50` and return:

```json
{ "data": [ ... ], "page": 1, "limit": 50, "total": 248 }
```

The UI currently filters client-side; it will move to server-side filtering once
these land, so please also accept the filter query params listed per endpoint.

---

## 1. Authentication & Organization

### ✅ `POST /admin/register` — create organization + admin

`registerOrganization()` · called from [app/sign-up/page.tsx](../app/sign-up/page.tsx).

**Request**

```json
{
  "organizationName": "ABC Technologies",
  "name": "Rohan Sarkar",
  "email": "rohan@abctech.io",
  "password": "••••••••",
  "phoneNumber": "+91 98200 11234",
  "organizationSize": "Medium-Team"
}
```

`phoneNumber` and `organizationSize` are optional. `organizationSize` is one of
`Small-Team | Medium-Team | Large-Team | Enterprise`.

**Response — the session plus the organization ID**

The admin is signed in automatically after registering, and the sign-up screen
shows the generated Organization ID on a success card. Both come from this
response, which mirrors `login`:

```json
{
  "message": "Organization created successfully.",
  "user": {
    "id": "usr_01H…",
    "name": "Rohan Sarkar",
    "email": "rohan@abctech.io",
    "userType": "ADMIN",
    "organizationId": "org_01H…",
    "organizationName": "ABC Technologies",
    "uniqueOrganizationId": "ORG-5D8K91",
    "accessToken": "eyJ…",
    "refreshToken": "eyJ…"
  }
}
```

The UI degrades gracefully: if `accessToken` is absent it still shows the success
card and routes to `/sign-in` instead of `/dashboard`.

`uniqueOrganizationId` must be generated server-side, unique, and stable. Format
in use: `ORG-` + 6 uppercase alphanumerics. Avoid ambiguous characters (`0/O`,
`1/I`) — employees type this by hand into the mobile app.

**Errors:** `409` if the email already has an account.

---

### ✅ `POST /admin/login`

`login()`

```json
{ "email": "rohan@abctech.io", "password": "••••••••" }
```

**Response** — same `{ user: { …, accessToken, refreshToken } }` shape as above.
The UI stores the tokens in Redux + `sessionStorage` and the user in Redux.

---

### ✅ `POST /admin/refresh-token`

`refreshSession()`

```json
{ "refreshToken": "eyJ…" }
```

```json
{ "accessToken": "eyJ…", "refreshToken": "eyJ…" }
```

Return a **rotated** refresh token and revoke the old one. Note the response is
flat here (not nested under `user`) — that is what the interceptor reads.

---

### ✅ `POST /admin/logout`

`logout()`

Empty body. Revoke the caller's refresh token. The UI clears local state even if
this call fails, so a failure is never fatal.

---

### ✅ `GET /admin/details`

`getAdminDetails()`

```json
{
  "user": {
    "id": "usr_01H…",
    "name": "Rohan Sarkar",
    "email": "rohan@abctech.io",
    "userType": "ADMIN",
    "organizationId": "org_01H…",
    "organizationName": "ABC Technologies",
    "uniqueOrganizationId": "ORG-5D8K91"
  }
}
```

---

### ✅ `GET /admin/organization`

`getOrganization()`

```json
{
  "organization": {
    "id": "org_01H…",
    "name": "ABC Technologies",
    "uniqueOrganizationId": "ORG-5D8K91",
    "organizationSize": "Medium-Team"
  }
}
```

---

### ✅ `POST /admin/forgot-password`

`forgotPassword()` · called from [app/forgot-password/page.tsx](../app/forgot-password/page.tsx).

```json
{ "email": "rohan@abctech.io" }
```

**Response:** `200` with `{ "message": "..." }`.

**Return `200` even when the email is unknown** — the UI shows a deliberately
neutral "if an account exists…" message. Leaking which emails are registered is an
account-enumeration hole.

Email a link to `<APP_URL>/reset-password?token=<token>`. The token must be
single-use and expire in 30 minutes (the UI tells the admin exactly that).

---

### ✅ `POST /admin/reset-password`

`resetPassword()` · called from [app/reset-password/page.tsx](../app/reset-password/page.tsx).

```json
{ "token": "…", "password": "••••••••" }
```

On success, invalidate the token and revoke all of that admin's refresh tokens so
any stolen session dies with the reset.

**Errors:** `400` with a clear message for an expired, unknown or already-used
token — the UI surfaces it verbatim.

---

### ✅ `POST /admin/change-password` *(authenticated)*

`changePassword()` · called from the Account tab of [app/dashboard/settings/page.tsx](../app/dashboard/settings/page.tsx).

```json
{ "currentPassword": "••••••••", "newPassword": "••••••••" }
```

**Errors:** `400` if `currentPassword` is wrong, or if `newPassword` violates the
organization's password policy (§9).

---

## 2. Employee Registration & Approval 📋

Backs [app/dashboard/requests/page.tsx](../app/dashboard/requests/page.tsx).

### Mobile-app side (for reference)

`POST /auth/register` from the React Native app takes
`{ uniqueOrganizationId, name, email, password }`, validates the organization ID,
and creates the employee with `role: "Team Member"` and `status: "Pending"`.

**A pending employee must be blocked from every project and task endpoint** — that
gate is the whole point of the approval step, and it has to live on the backend,
not in the app.

### 📋 `GET /admin/employees/pending`

```json
{
  "data": [
    {
      "id": "e-12",
      "name": "Sahil Gupta",
      "email": "sahil.gupta@abctech.io",
      "phone": "+91 98201 32345",
      "role": "Team Member",
      "status": "Pending",
      "registeredAt": "2026-08-04"
    }
  ]
}
```

### 📋 `POST /admin/employees/{id}/approve`

```json
{ "role": "Team Lead" }
```

`role` ∈ `Team Member | Team Lead | Manager`. Sets `status: "Active"` and stamps
`joinedAt`. Returns the updated employee. Should notify the employee.

### 📋 `POST /admin/employees/{id}/reject`

```json
{ "reason": "Not a current employee." }
```

`reason` is optional and shown to the employee. Sets `status: "Rejected"`. A
rejected person is allowed to register again with the same organization ID.

---

## 3. Employee Management 📋

Backs [app/dashboard/employees/page.tsx](../app/dashboard/employees/page.tsx) and
[app/dashboard/employees/[id]/page.tsx](../app/dashboard/employees/%5Bid%5D/page.tsx).

### 📋 `GET /admin/employees`

Query params: `?search=&role=&status=&page=&limit=`

**Employee object** (matches the `Employee` type):

```json
{
  "id": "e-2",
  "name": "Priya Sharma",
  "email": "priya.sharma@abctech.io",
  "phone": "+91 98200 22345",
  "jobTitle": "Frontend Lead",
  "role": "Team Lead",
  "status": "Active",
  "registeredAt": "2026-01-18",
  "joinedAt": "2026-01-20",
  "projectIds": ["p-1", "p-2"]
}
```

`status` ∈ `Pending | Active | Suspended | Rejected`.

### 📋 `GET /admin/employees/{id}`

Same object, plus the roll-ups the profile page shows:

```json
{
  "employee": { "…": "…" },
  "stats": {
    "assigned": 12,
    "completed": 7,
    "pending": 5,
    "overdue": 1,
    "avgCompletionDays": 9.4,
    "completionRate": 58
  },
  "projects": [ { "id": "p-1", "name": "Mobile App", "status": "Active", "deadline": "2026-09-30", "roleInProject": "Team Lead" } ],
  "tasks": [ "…Task objects…" ]
}
```

### 📋 `PATCH /admin/employees/{id}/role`

```json
{ "role": "Manager" }
```

### 📋 `PATCH /admin/employees/{id}/status`

```json
{ "status": "Suspended" }
```

`Suspended` must block sign-in and revoke active refresh tokens.

### 📋 `DELETE /admin/employees/{id}`

Removes the employee from the organization. **Do not cascade-delete their tasks** —
the UI warns that tasks stay and become unassigned, so prefer a soft delete plus
nulling `assigneeId`.

---

## 4. Project Management 📋

Backs [app/dashboard/projects/page.tsx](../app/dashboard/projects/page.tsx) and
[app/dashboard/projects/[id]/page.tsx](../app/dashboard/projects/%5Bid%5D/page.tsx).

### 📋 `GET /admin/projects`

Query params: `?search=&status=&page=&limit=`

**Project object:**

```json
{
  "id": "p-1",
  "name": "Mobile App",
  "key": "MOB",
  "description": "React Native app for employees…",
  "status": "Active",
  "startDate": "2026-02-02",
  "deadline": "2026-09-30",
  "memberIds": ["e-1", "e-2", "e-3", "e-7"],
  "leadIds": ["e-2"],
  "managerIds": ["e-1"],
  "workflow": {
    "approvalRequired": true,
    "autoApprove": false,
    "approvers": ["Team Lead", "Manager"],
    "adminCanApprove": true,
    "defaultPriority": "High"
  },
  "createdAt": "2026-02-01",
  "stats": {
    "total": 10, "completed": 3, "pending": 7,
    "overdue": 2, "blocked": 1, "completionRate": 30
  }
}
```

`status` ∈ `Active | On Hold | Completed | Archived`.

Returning `stats` inline saves the list page an N+1 round trip — it renders a
progress meter and open/overdue/blocked counts per card.

### 📋 `POST /admin/projects`

Body: `name`, `key`, `description`, `deadline`, `workflow.defaultPriority`,
`workflow.approvalRequired`. Members are assigned afterwards.

`key` should be unique per organization (`409` on collision).

### 📋 `PATCH /admin/projects/{id}`

Partial update of any of the above. Also used to change `status` (archive /
restore / mark complete).

### 📋 `DELETE /admin/projects/{id}`

Deletes the project and its tasks. The UI confirms with an explicit warning.

### 📋 `POST /admin/projects/{id}/members` · `DELETE /admin/projects/{id}/members/{employeeId}`

```json
{ "employeeId": "e-5", "projectRole": "Member" }
```

`projectRole` ∈ `Member | Team Lead | Manager` and maps onto `memberIds` /
`leadIds` / `managerIds`. Only `Active` employees may be added.

**Membership is the mobile app's access control** — an employee who is not in
`memberIds` must get a `403` on that project's tasks.

### 📋 `PUT /admin/projects/{id}/workflow`

```json
{
  "approvalRequired": true,
  "autoApprove": false,
  "approvers": ["Team Lead", "Manager"],
  "adminCanApprove": true,
  "defaultPriority": "High"
}
```

Validate that `approvers` is non-empty whenever `approvalRequired` is `true` and
`adminCanApprove` is `false` — otherwise tasks can enter a state nobody can clear.

---

## 5. Task Management 📋

Backs [app/dashboard/tasks/page.tsx](../app/dashboard/tasks/page.tsx) and
[app/dashboard/tasks/[id]/page.tsx](../app/dashboard/tasks/%5Bid%5D/page.tsx).

### 📋 `GET /admin/tasks`

Query params: `?search=&projectId=&assigneeId=&status=&priority=&dueBefore=&dueAfter=&overdue=true&sort=dueDate|priority|createdAt&page=&limit=`

**Task object:**

```json
{
  "id": "t-1005",
  "title": "Crash on task detail when approver is unset",
  "description": "…",
  "projectId": "p-1",
  "creatorId": "e-7",
  "assigneeId": "e-3",
  "approverId": "e-2",
  "status": "In Progress",
  "priority": "Urgent",
  "createdAt": "2026-08-01",
  "dueDate": "2026-08-05",
  "completedAt": null,
  "reviewComment": null
}
```

`status` ∈ `To Do | In Progress | Pending Approval | Blocked | Completed | Rejected`
`priority` ∈ `Low | Medium | High | Urgent`

**Overdue is derived, not stored:** a task is overdue when `dueDate < today` **and**
`status` is neither `Completed` nor `Rejected`. The UI computes it the same way in
`isOverdue()` — keep the two definitions in sync, or return an `isOverdue` boolean
and let the server own it.

`approverId` is `null` when the project's workflow has no approval gate.

### 📋 `GET /admin/tasks/{id}`

Task object plus its timeline:

```json
{
  "task": { "…": "…" },
  "timeline": [
    {
      "id": "t-1005-ev-1",
      "at": "2026-08-01",
      "actorId": "e-7",
      "action": "created the task",
      "detail": null
    }
  ]
}
```

`actorId` may be an employee id or `"admin"`. Append an event for **every**
mutation below — the timeline is the audit trail.

### 📋 `PATCH /admin/tasks/{id}`

Partial update of `title`, `description`, `status`, `priority`, `assigneeId`,
`approverId`, `dueDate`. Setting `status: "Completed"` should stamp `completedAt`.

### 📋 `POST /admin/tasks/{id}/comments`

```json
{ "body": "Blocked on the vendor API key." }
```

Appends a timeline event.

### 📋 `DELETE /admin/tasks/{id}`

---

## 6. Task Approval Center 📋

Backs [app/dashboard/approvals/page.tsx](../app/dashboard/approvals/page.tsx).

### 📋 `GET /admin/tasks/pending-approval`

Query params: `?projectId=`

Every task with `status: "Pending Approval"`, each with its project name, creator,
assignee and approver resolved.

### 📋 `POST /admin/tasks/{id}/approve`

```json
{ "comment": "" }
```

→ `status: "Completed"`, stamp `completedAt`, notify the assignee. Comment optional.

### 📋 `POST /admin/tasks/{id}/reject`

```json
{ "comment": "Autoplay video conflicts with the performance budget." }
```

→ `status: "Rejected"`, store `comment` as `reviewComment`. **Comment is required** —
the UI blocks submission without one.

### 📋 `POST /admin/tasks/{id}/return`

```json
{ "comment": "Add a click-to-play fallback and resubmit." }
```

→ `status: "In Progress"`, store `comment` as `reviewComment`, notify the assignee.
**Comment is required.**

All three must enforce that the caller is allowed to decide, per the project's
`workflow.approvers` / `adminCanApprove`.

---

## 7. Analytics 📋

Backs [app/dashboard/page.tsx](../app/dashboard/page.tsx) and
[app/dashboard/analytics/page.tsx](../app/dashboard/analytics/page.tsx).

These are aggregations — please compute them in SQL rather than shipping every task
to the client.

### 📋 `GET /admin/analytics/overview`

```json
{
  "totalEmployees": 15, "activeEmployees": 11, "pendingEmployees": 4,
  "managers": 2, "teamLeads": 3, "teamMembers": 6,
  "totalProjects": 6, "activeProjects": 3, "completedProjects": 1,
  "totalTasks": 39,
  "todo": 7, "inProgress": 9, "pendingApproval": 4,
  "blocked": 4, "completed": 14, "rejected": 1,
  "overdue": 5
}
```

### 📋 `GET /admin/analytics/monthly?months=7`

```json
{ "data": [ { "month": "Feb", "created": 14, "completed": 9 } ] }
```

Drives the created-vs-completed line chart. Ordered oldest → newest.

### 📋 `GET /admin/analytics/employees`

```json
{
  "data": [
    {
      "employeeId": "e-4", "name": "Sneha Iyer", "role": "Team Lead",
      "assigned": 6, "completed": 4, "pending": 2, "overdue": 0,
      "avgCompletionDays": 14.5, "completionRate": 67
    }
  ]
}
```

`avgCompletionDays` = mean of `completedAt − createdAt` over that employee's
completed tasks.

### 📋 `GET /admin/analytics/teams`

Same fields aggregated by role, plus `headcount` and `avgWorkload`
(`assigned / headcount`).

### 📋 `GET /admin/analytics/projects`

```json
{
  "data": [
    {
      "projectId": "p-2", "name": "Website Revamp", "status": "Active",
      "total": 11, "completed": 3, "pending": 7, "overdue": 2, "blocked": 1,
      "members": 6, "completionRate": 27, "daysToDeadline": 21
    }
  ]
}
```

### 📋 `GET /admin/projects/{id}/analytics`

Per-project version of the above, plus `avgCompletionDays` and
`estimatedCompletionDays` for the project analytics tab.

---

## 8. Reports 📋

Backs [app/dashboard/reports/page.tsx](../app/dashboard/reports/page.tsx).

### 📋 `POST /admin/reports`

```json
{
  "type": "tasks",
  "format": "PDF",
  "from": "2026-06-01",
  "to": "2026-08-07",
  "filters": {
    "projectId": "p-2",
    "employeeId": null,
    "role": null,
    "status": "In Progress"
  }
}
```

`type` ∈ `tasks | employees | projects`, `format` ∈ `PDF | Excel | CSV`.

Generate asynchronously and return `202` with `{ "reportId": "rep_…" }`. The UI
already tells the admin they'll get a notification when it's ready, so pair this
with a `report.ready` notification and:

- 📋 `GET /admin/reports` — past reports with status and download URL
- 📋 `GET /admin/reports/{id}/download` — the file

A synchronous `200` returning the file directly is fine for v1 if async is a lot of
work — the UI would just download instead of toasting.

---

## 9. Notifications, Activity Log & Settings 📋

### 📋 `GET /admin/notifications` · `?unreadOnly=true`

```json
{
  "data": [
    {
      "id": "n-1",
      "kind": "registration",
      "title": "4 employees are waiting for approval",
      "body": "Sahil Gupta, Ishita Reddy, Dev Patel and Riya Kapoor registered with ORG-5D8K91.",
      "at": "2026-08-06",
      "read": false,
      "href": "/dashboard/requests"
    }
  ],
  "unreadCount": 3
}
```

`kind` ∈ `registration | approval | deadline | overdue | project | task`. `href` is
an in-app deep link; the UI renders it as the "Open" action.

Trigger a notification on: new employee registration, task submitted for approval,
project deadline approaching, task going overdue, project completed, approval
decided.

- 📋 `PATCH /admin/notifications/{id}/read`
- 📋 `POST /admin/notifications/read-all`

### 📋 `GET /admin/activity`

Query params: `?search=&kind=&page=&limit=`

```json
{
  "data": [
    {
      "id": "a-6",
      "kind": "role",
      "actor": "Admin",
      "message": "assigned the Team Lead role to Tanvi Joshi",
      "at": "2026-07-30"
    }
  ]
}
```

`kind` ∈ `employee | role | project | task | approval | security`. `message` is
pre-composed server-side and rendered after the actor name — write it to read as a
continuation ("*Admin* suspended Arjun Desai").

Log on: registration, approval/rejection, role change, suspend/activate/remove,
project create/edit/archive/delete, task approval decisions, and security setting
changes.

### 📋 `GET /admin/settings` · `PUT /admin/settings`

Backs [app/dashboard/settings/page.tsx](../app/dashboard/settings/page.tsx).

```json
{
  "name": "ABC Technologies",
  "uniqueOrganizationId": "ORG-5D8K91",
  "logoUrl": null,
  "timezone": "Asia/Kolkata (GMT+5:30)",
  "workingDays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
  "workflow": {
    "approvalRequired": true,
    "defaultPriority": "Medium",
    "statusFlow": ["To Do", "In Progress", "Pending Approval", "Completed"]
  },
  "security": {
    "minPasswordLength": 8,
    "requireNumber": true,
    "requireSymbol": false,
    "requireUppercase": true,
    "sessionTimeoutMinutes": 60
  }
}
```

`uniqueOrganizationId` is read-only. The security block must actually be enforced
on registration, password reset and change-password — the UI only displays the rules.

📋 `POST /admin/settings/logo` — multipart upload, returns `{ "logoUrl": "…" }`.

---

## Build order

1. **§1 auth gaps** — `forgot-password`, `reset-password`, `change-password`, and
   tokens on `register`. The UI is already calling these three; they 404 today.
2. **§2 + §3 employees** — unblocks the core registration → approval → access loop.
3. **§4 + §5 projects and tasks.**
4. **§6 approvals.**
5. **§7 analytics** — the dashboard is the most visible screen but depends on 2–5.
6. **§8 + §9 reports, notifications, activity, settings.**
