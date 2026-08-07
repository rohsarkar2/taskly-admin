"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  FolderKanban,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HBarChart, StackedBar } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import {
  AvatarStack,
  EmployeeStatusBadge,
  PageHeader,
  PersonCell,
  PriorityBadge,
  ProgressCell,
  StatGrid,
  StatTile,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import {
  formatDate,
  isOverdue,
  monthlyTaskVolume,
  organizationOverview,
  organizationSettings,
  pendingApprovalTasks,
  pendingEmployees,
  projectById,
  projectPerformance,
  projectNameOf,
  relativeToToday,
  tasks,
  activityLogs,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const overview = organizationOverview();
  const projectStats = projectPerformance().filter(
    (p) => p.status === "Active" || p.status === "On Hold",
  );

  const recentTasks = [...tasks]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  /** Things the admin has to act on before anything else on this page. */
  const actionItems = [
    {
      count: pendingEmployees.length,
      label: "employees waiting for approval",
      href: "/dashboard/requests",
      cta: "Review requests",
    },
    {
      count: pendingApprovalTasks.length,
      label: "tasks waiting for your decision",
      href: "/dashboard/approvals",
      cta: "Open approval center",
    },
    {
      count: overview.overdue,
      label: "tasks past their due date",
      href: "/dashboard/tasks?status=overdue",
      cta: "View overdue tasks",
    },
  ].filter((item) => item.count > 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${organizationSettings.name} · ${organizationSettings.uniqueOrganizationId}`}
        action={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/reports">Generate report</Link>
            </Button>
            <Button size="sm" className="bg-[#2d5a4c] hover:bg-[#234539]" asChild>
              <Link href="/dashboard/projects">New project</Link>
            </Button>
          </>
        }
      />

      {/* Needs attention */}
      {actionItems.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {actionItems.map((item) => (
            <Card key={item.href} className="border-l-4 border-l-[#2d5a4c]">
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <p className="text-sm">
                  <span className="text-lg font-bold">{item.count}</span>{" "}
                  <span className="text-muted-foreground">{item.label}</span>
                </p>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={item.href}>{item.cta} →</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Headline numbers */}
      <StatGrid>
        <StatTile
          label="Total Employees"
          value={overview.totalEmployees}
          hint={`${overview.activeEmployees} active · ${overview.pendingEmployees} pending`}
          icon={Users}
          href="/dashboard/employees"
        />
        <StatTile
          label="Projects"
          value={overview.totalProjects}
          hint={`${overview.activeProjects} active · ${overview.completedProjects} completed`}
          icon={FolderKanban}
          accent="var(--viz-3)"
          href="/dashboard/projects"
        />
        <StatTile
          label="Total Tasks"
          value={overview.totalTasks}
          hint={`${overview.completed} completed · ${overview.inProgress} in progress`}
          icon={ClipboardList}
          accent="var(--viz-2)"
          href="/dashboard/tasks"
        />
        <StatTile
          label="Overdue Tasks"
          value={overview.overdue}
          hint={`${overview.blocked} blocked · ${overview.pendingApproval} awaiting approval`}
          icon={AlertTriangle}
          accent="var(--viz-critical)"
          href="/dashboard/tasks?status=overdue"
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organization overview */}
        <Card>
          <CardHeader>
            <CardTitle>Organization overview</CardTitle>
            <CardDescription>
              Headcount by role across {overview.activeEmployees} active
              employees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HBarChart
              tableColumns={["Role", "People"]}
              data={[
                { label: "Team Members", value: overview.teamMembers },
                { label: "Team Leads", value: overview.teamLeads },
                { label: "Managers", value: overview.managers },
              ]}
            />
          </CardContent>
        </Card>

        {/* Task status distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task status distribution</CardTitle>
            <CardDescription>
              All {overview.totalTasks} tasks in the organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StackedBar
              segments={[
                { label: "To Do", value: overview.todo },
                { label: "In Progress", value: overview.inProgress },
                { label: "Pending Approval", value: overview.pendingApproval },
                { label: "Blocked", value: overview.blocked },
                { label: "Completed", value: overview.completed },
                { label: "Rejected", value: overview.rejected },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Monthly trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks created vs completed</CardTitle>
          <CardDescription>
            Monthly volume for 2026. August is still in progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LineChart
            categories={monthlyTaskVolume.map((m) => m.month)}
            series={[
              {
                label: "Created",
                values: monthlyTaskVolume.map((m) => m.created),
              },
              {
                label: "Completed",
                values: monthlyTaskVolume.map((m) => m.completed),
              },
            ]}
          />
        </CardContent>
      </Card>

      {/* Project progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project progress</CardTitle>
              <CardDescription>
                Completion across projects that are still running.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectStats.map((project) => (
                  <TableRow key={project.projectId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/projects/${project.projectId}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <ProgressCell value={project.completionRate} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {project.completed}/{project.total}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {project.pending}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {project.overdue}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {relativeToToday(
                        projectById(project.projectId)!.deadline,
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent tasks</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tasks">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="max-w-[16rem]">
                        <Link
                          href={`/dashboard/tasks/${task.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {task.title}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {projectNameOf(task.projectId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <TaskStatusBadge
                          status={task.status}
                          overdue={isOverdue(task)}
                        />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell>
                        <PersonCell
                          employeeId={task.assigneeId}
                          href={`/dashboard/employees/${task.assigneeId}`}
                        />
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">
                        {formatDate(task.dueDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pending registrations + activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="size-4" />
                  Pending requests
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/requests">Review</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingEmployees.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No pending registrations.
                </p>
              )}
              {pendingEmployees.slice(0, 4).map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between gap-2"
                >
                  <PersonCell
                    employeeId={employee.id}
                    subtitle={`Registered ${relativeToToday(employee.registeredAt)}`}
                  />
                  <EmployeeStatusBadge status={employee.status} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent activity</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/activity">All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {activityLogs.slice(0, 6).map((log) => (
                  <li key={log.id} className="text-xs">
                    <span className="font-medium">{log.actor}</span>{" "}
                    <span className="text-muted-foreground">{log.message}</span>
                    <span className="block text-[0.65rem] text-muted-foreground">
                      {formatDate(log.at)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team on active projects */}
      <Card>
        <CardHeader>
          <CardTitle>Teams on active projects</CardTitle>
          <CardDescription>
            Only assigned members can open a project from the mobile app.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projectStats.map((project) => (
            <Link
              key={project.projectId}
              href={`/dashboard/projects/${project.projectId}`}
              className="rounded-lg border p-3 transition-colors hover:border-foreground/20"
            >
              <p className="text-sm font-medium">{project.name}</p>
              <p className="mb-2 text-xs text-muted-foreground">
                {project.members} members · {project.pending} open tasks
              </p>
              <AvatarStack
                employeeIds={projectById(project.projectId)?.memberIds ?? []}
              />
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
