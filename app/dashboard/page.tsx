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
import * as React from "react";
import { HBarChart, StackedBar } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmployeeStatusBadge,
  EmptyState,
  PageHeader,
  PersonCell,
  PriorityBadge,
  ProgressCell,
  SampleDataNotice,
  StatGrid,
  StatTile,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import {
  toActivityLogs,
  toEmployees,
  toTasks,
} from "@/lib/api/adapters";
import { getAnalyticsOverview, getProjectAnalytics, getTaskAnalytics } from "@/lib/api/analytics";
import type { AnalyticsOverviewData, ProjectAnalyticsRow, TrendPoint } from "@/lib/api/analytics";
import { listRecentActivity } from "@/lib/api/activity";
import { listPendingEmployees } from "@/lib/api/employees";
import { listTasks } from "@/lib/api/tasks";
import {
  formatDate,
  formatDateTime,
  formatShortDate,
  relativeToToday,
} from "@/lib/mock-data";
import { useAppSelector } from "@/lib/redux/hooks";
import type { ActivityLog, Employee, Task } from "@/lib/types";

const TREND_DAYS = 30;

export default function DashboardPage() {
  const organization = useAppSelector((state) => state.user.organization);

  const [overview, setOverview] = React.useState<AnalyticsOverviewData | null>(
    null,
  );
  const [projectRows, setProjectRows] = React.useState<ProjectAnalyticsRow[]>(
    [],
  );
  const [trend, setTrend] = React.useState<TrendPoint[]>([]);
  const [recentTasks, setRecentTasks] = React.useState<Task[]>([]);
  const [pending, setPending] = React.useState<Employee[]>([]);
  const [activity, setActivity] = React.useState<ActivityLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unavailable, setUnavailable] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const signal = { cancelled: false };

    const load = async () => {
      try {
        // Only the overview is required; the panels below it each degrade on
        // their own so one slow endpoint does not blank the dashboard.
        const [head, projects, tasksTrend, latest, pendingList, logs] =
          await Promise.all([
            getAnalyticsOverview(),
            getProjectAnalytics({ limit: 20 }).catch(() => null),
            getTaskAnalytics({ days: TREND_DAYS }).catch(() => null),
            listTasks({ limit: 6, sortBy: "createdAt", sortOrder: "desc" }).catch(
              () => null,
            ),
            listPendingEmployees().catch(() => null),
            listRecentActivity({ limit: 8 }).catch(() => null),
          ]);
        if (signal.cancelled) return;

        setOverview(head.data);
        setProjectRows(projects?.data.projects ?? []);
        setTrend(tasksTrend?.data.trend ?? []);
        setRecentTasks(latest ? toTasks(latest.items) : []);
        setPending(pendingList ? toEmployees(pendingList.items) : []);
        setActivity(logs ? toActivityLogs(logs.items) : []);
        setUnavailable(false);
      } catch (error) {
        if (signal.cancelled) return;
        console.error("Failed to load the dashboard:", error);
        setUnavailable(true);
      } finally {
        if (!signal.cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      signal.cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  if (loading) return <DashboardSkeleton />;

  if (unavailable || !overview) {
    return (
      <>
        <PageHeader title="Dashboard" description={organization?.name ?? ""} />
        <SampleDataNotice
          message="Could not reach the analytics API."
          onRetry={refresh}
        />
        <EmptyState
          title="Dashboard unavailable"
          description="Every figure here is computed server-side, so there is nothing to show until it responds."
        />
      </>
    );
  }

  const { employees, projects: projectCounts, tasks } = overview;
  const openProjects = projectRows.filter(
    (row) => row.status !== "archived" && row.status !== "completed",
  );

  /** Things the admin has to act on before anything else on this page. */
  const actionItems = [
    {
      count: employees.pendingEmployees,
      label: "employees waiting for approval",
      href: "/dashboard/requests",
      cta: "Review requests",
    },
    {
      count: tasks.pendingApproval,
      label: "tasks waiting for your decision",
      href: "/dashboard/approvals",
      cta: "Open approval center",
    },
    {
      count: tasks.overdue,
      label: "tasks past their due date",
      href: "/dashboard/tasks?status=overdue",
      cta: "View overdue tasks",
    },
  ].filter((item) => item.count > 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          organization
            ? `${organization.name} · ${organization.uniqueOrganizationId}`
            : "Organization overview"
        }
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
          value={employees.totalEmployees}
          hint={`${employees.activeEmployees} active · ${employees.pendingEmployees} pending`}
          icon={Users}
          href="/dashboard/employees"
        />
        <StatTile
          label="Projects"
          value={projectCounts.totalProjects}
          hint={`${projectCounts.activeProjects} active · ${projectCounts.completedProjects} completed`}
          icon={FolderKanban}
          accent="var(--viz-3)"
          href="/dashboard/projects"
        />
        <StatTile
          label="Total Tasks"
          value={tasks.totalTasks}
          hint={`${tasks.completed} completed · ${tasks.inProgress} in progress`}
          icon={ClipboardList}
          accent="var(--viz-2)"
          href="/dashboard/tasks"
        />
        <StatTile
          label="Overdue Tasks"
          value={tasks.overdue}
          hint={`${tasks.blocked} blocked · ${tasks.pendingApproval} awaiting approval`}
          icon={AlertTriangle}
          accent="var(--viz-critical)"
          href="/dashboard/tasks?status=overdue"
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization overview</CardTitle>
            <CardDescription>
              Headcount by role across {employees.activeEmployees} active
              employees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HBarChart
              tableColumns={["Role", "People"]}
              data={[
                { label: "Team Members", value: employees.teamMembers },
                { label: "Team Leads", value: employees.teamLeads },
                { label: "Managers", value: employees.managers },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task status distribution</CardTitle>
            <CardDescription>
              All {tasks.totalTasks} tasks in the organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StackedBar
              segments={[
                { label: "To Do", value: tasks.pending },
                { label: "In Progress", value: tasks.inProgress },
                { label: "Pending Approval", value: tasks.pendingApproval },
                { label: "Returned", value: tasks.returned },
                { label: "Blocked", value: tasks.blocked },
                { label: "Completed", value: tasks.completed },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks created vs completed</CardTitle>
          <CardDescription>
            Daily volume over the last {TREND_DAYS} days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trend.length === 0 ? (
            <EmptyState title="No trend data yet" />
          ) : (
            <LineChart
              categories={trend.map((p) => formatShortDate(p.date))}
              series={[
                { label: "Created", values: trend.map((p) => p.created) },
                { label: "Completed", values: trend.map((p) => p.completed) },
              ]}
            />
          )}
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
          {openProjects.length === 0 ? (
            <EmptyState title="No active projects" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Completed</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openProjects.map((project) => (
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
                        <ProgressCell
                          value={Math.round(project.completionPercentage)}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {project.completedTasks}/{project.totalTasks}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {project.remainingTasks}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {project.overdueTasks}
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">
                        {formatDate(project.endDate?.slice(0, 10))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
            {recentTasks.length === 0 ? (
              <EmptyState title="No tasks yet" />
            ) : (
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
                            {task.projectName ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <TaskStatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={task.priority} />
                        </TableCell>
                        <TableCell>
                          {task.assigneeId ? (
                            <PersonCell
                              employee={{
                                id: task.assigneeId,
                                name:
                                  task.people?.find(
                                    (p) => p.id === task.assigneeId,
                                  )?.name ?? "Unknown",
                                email: "",
                                avatarColor:
                                  task.people?.find(
                                    (p) => p.id === task.assigneeId,
                                  )?.avatarColor ?? "#2d5a4c",
                              }}
                              href={`/dashboard/employees/${task.assigneeId}`}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap">
                          {formatDate(task.dueDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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
              {pending.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pending registrations.
                </p>
              ) : (
                pending.slice(0, 4).map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <PersonCell
                      employee={employee}
                      subtitle={
                        employee.registeredAt
                          ? `Registered ${relativeToToday(employee.registeredAt)}`
                          : undefined
                      }
                    />
                    <EmployeeStatusBadge status={employee.status} />
                  </div>
                ))
              )}
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
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity recorded yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((log) => (
                    <li key={log.id} className="text-xs">
                      <span className="font-medium">{log.actor}</span>{" "}
                      <span className="text-muted-foreground">
                        {log.message}
                      </span>
                      <span className="block text-[0.65rem] text-muted-foreground">
                        {formatDateTime(log.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
