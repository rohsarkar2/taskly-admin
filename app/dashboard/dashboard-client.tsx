"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Inbox,
  RefreshCw,
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
import {
  CategoryBarChart,
  CompletionGauge,
  ProjectStackedBars,
  TrendAreaChart,
} from "@/components/charts/analytics-charts";
import type {
  CategoryDatum,
  ProjectBarDatum,
  TrendDatum,
} from "@/components/charts/analytics-charts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmployeeStatusBadge,
  EmptyState,
  PageHeader,
  PersonCell,
  PRIORITY_COLOR,
  PriorityBadge,
  SampleDataNotice,
  StatGrid,
  StatTile,
  TASK_STATUS_COLOR,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import { toActivityLogs, toEmployees, toTasks } from "@/lib/api/adapters";
import {
  getAnalyticsOverview,
  getProjectAnalytics,
  getTaskAnalytics,
} from "@/lib/api/analytics";
import type {
  AnalyticsOverviewData,
  ProjectAnalyticsRow,
  TrendPoint,
} from "@/lib/api/analytics";
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
import { cn } from "@/lib/utils";
import type { ActivityLog, Employee, Priority, Task } from "@/lib/types";

const RANGES = [7, 30, 90] as const;
const DEFAULT_RANGE = 30;
const PROJECT_BARS = 8;

export default function DashboardClient() {
  const organization = useAppSelector((state) => state.user.organization);

  const [overview, setOverview] = React.useState<AnalyticsOverviewData | null>(
    null,
  );
  const [projectRows, setProjectRows] = React.useState<ProjectAnalyticsRow[]>(
    [],
  );
  const [recentTasks, setRecentTasks] = React.useState<Task[]>([]);
  const [pending, setPending] = React.useState<Employee[]>([]);
  const [activity, setActivity] = React.useState<ActivityLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  const [days, setDays] = React.useState<number>(DEFAULT_RANGE);
  const [trendSlice, setTrendSlice] = React.useState<{
    days: number;
    key: number;
    points: TrendPoint[];
  } | null>(null);

  const trend = trendSlice?.points ?? [];
  const trendBusy =
    trendSlice === null ||
    trendSlice.days !== days ||
    trendSlice.key !== reloadKey;

  React.useEffect(() => {
    const signal = { cancelled: false };

    const load = async () => {
      try {
        const [head, projects, latest, pendingList, logs] = await Promise.all([
          getAnalyticsOverview(),
          getProjectAnalytics({ limit: 20 }).catch(() => null),
          listTasks({
            limit: 6,
            sortBy: "createdAt",
            sortOrder: "desc",
          }).catch(() => null),
          listPendingEmployees().catch(() => null),
          listRecentActivity({ limit: 8 }).catch(() => null),
        ]);
        if (signal.cancelled) return;

        setOverview(head.data);
        setProjectRows(projects?.data.projects ?? []);
        setRecentTasks(latest ? toTasks(latest.items) : []);
        setPending(pendingList ? toEmployees(pendingList.items) : []);
        setActivity(logs ? toActivityLogs(logs.items) : []);
        setUnavailable(false);
      } catch (error) {
        if (signal.cancelled) return;
        console.error("Failed to load the dashboard:", error);
        setUnavailable(true);
      } finally {
        if (!signal.cancelled) {
          setLoading(false);
          setBusy(false);
        }
      }
    };

    load();
    return () => {
      signal.cancelled = true;
    };
  }, [reloadKey]);

  React.useEffect(() => {
    const signal = { cancelled: false };

    getTaskAnalytics({ days })
      .then((res) => {
        if (!signal.cancelled)
          setTrendSlice({ days, key: reloadKey, points: res.data.trend ?? [] });
      })
      .catch(() => {
        if (!signal.cancelled)
          setTrendSlice({ days, key: reloadKey, points: [] });
      });

    return () => {
      signal.cancelled = true;
    };
  }, [days, reloadKey]);

  const refresh = () => {
    setBusy(true);
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

  const trendData: TrendDatum[] = trend.map((point) => ({
    label: formatShortDate(point.date),
    created: point.created,
    completed: point.completed,
  }));

  const statusBars: CategoryDatum[] = (
    [
      ["To Do", tasks.pending],
      ["In Progress", tasks.inProgress],
      ["Pending Approval", tasks.pendingApproval],
      ["Returned", tasks.returned],
      ["Blocked", tasks.blocked],
      ["Completed", tasks.completed],
    ] as const
  ).map(([label, value]) => ({
    label,
    value,
    color: TASK_STATUS_COLOR[label],
    note: tasks.totalTasks
      ? `${Math.round((value / tasks.totalTasks) * 100)}% of all tasks`
      : undefined,
  }));

  const roleBars: CategoryDatum[] = [
    { label: "Managers", value: employees.managers },
    { label: "Team Leads", value: employees.teamLeads },
    { label: "Team Members", value: employees.teamMembers },
  ].map((row) => ({
    ...row,
    color: "var(--viz-1)",
    note: employees.totalEmployees
      ? `${Math.round((row.value / employees.totalEmployees) * 100)}% of headcount`
      : undefined,
  }));

  const priorityBars = toPriorityBars(tasks.byPriority);

  const projectBars: ProjectBarDatum[] = openProjects
    .slice()
    .sort((a, b) => b.totalTasks - a.totalTasks)
    .slice(0, PROJECT_BARS)
    .map((project) => ({
      name: project.name,
      completed: project.completedTasks,
      // Overdue is a subset of what's left — subtract it so the stack still
      // adds up to the project's total instead of double-counting.
      onTrack: Math.max(0, project.remainingTasks - project.overdueTasks),
      overdue: project.overdueTasks,
      total: project.totalTasks,
      percentage: project.completionPercentage,
    }));

  const actionItems = [
    {
      count: employees.pendingEmployees,
      label: "employees waiting for approval",
      href: "/dashboard/requests",
      cta: "Review requests",
      icon: UserPlus,
      color: "var(--viz-warning)",
    },
    {
      count: tasks.pendingApproval,
      label: "tasks waiting for your decision",
      href: "/dashboard/approvals",
      cta: "Approval center",
      icon: CheckCircle2,
      color: "var(--viz-serious)",
    },
    {
      count: tasks.overdue,
      label: "tasks past their due date",
      href: "/dashboard/tasks?status=overdue",
      cta: "Overdue tasks",
      icon: AlertTriangle,
      color: "var(--viz-critical)",
    },
  ].filter((item) => item.count > 0);

  return (
    <div
      className={cn(
        "space-y-6 transition-opacity duration-200",
        busy && "opacity-60",
      )}
      aria-busy={busy}
    >
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
            <Button
              size="sm"
              className="bg-[#2d5a4c] hover:bg-[#234539]"
              asChild
            >
              <Link href="/dashboard/projects">New project</Link>
            </Button>
          </>
        }
      />

      {actionItems.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {actionItems.map((item) => (
            <Link key={item.href} href={item.href} className="group block">
              <Card className="h-full gap-0 transition-colors group-hover:border-foreground/20">
                <CardContent className="flex items-center gap-3 py-1">
                  <span
                    aria-hidden
                    className="grid size-9 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: `color-mix(in oklch, ${item.color} 14%, transparent)`,
                      color: item.color,
                    }}
                  >
                    <item.icon className="size-4.5" />
                  </span>
                  <p className="min-w-0 text-sm">
                    <span className="text-lg font-bold">{item.count}</span>{" "}
                    <span className="text-muted-foreground">{item.label}</span>
                  </p>
                  <span className="ml-auto flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {item.cta}
                    <ArrowRight className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <StatGrid>
        <StatTile
          label="Total Employees"
          value={employees.totalEmployees}
          hint={`${employees.activeEmployees} active · ${employees.pendingEmployees} pending`}
          icon={Users}
          href="/dashboard/employees"
          progress={{
            value: employees.activeEmployees,
            max: employees.totalEmployees,
            caption: `${share(employees.activeEmployees, employees.totalEmployees)} of headcount active`,
          }}
        />
        <StatTile
          label="Projects"
          value={projectCounts.totalProjects}
          hint={`${projectCounts.activeProjects} active · ${projectCounts.completedProjects} completed`}
          icon={FolderKanban}
          accent="var(--viz-3)"
          href="/dashboard/projects"
          progress={{
            value: projectCounts.completedProjects,
            max: projectCounts.totalProjects,
            caption: `${share(projectCounts.completedProjects, projectCounts.totalProjects)} delivered`,
          }}
        />
        <StatTile
          label="Total Tasks"
          value={tasks.totalTasks}
          hint={`${tasks.completed} completed · ${tasks.inProgress} in progress`}
          icon={ClipboardList}
          accent="var(--viz-2)"
          href="/dashboard/tasks"
          progress={{
            value: tasks.completed,
            max: tasks.totalTasks,
            caption: `${share(tasks.completed, tasks.totalTasks)} completed`,
          }}
        />
        <StatTile
          label="Overdue Tasks"
          value={tasks.overdue}
          hint={`${tasks.blocked} blocked · ${tasks.pendingApproval} awaiting approval`}
          icon={AlertTriangle}
          accent="var(--viz-critical)"
          href="/dashboard/tasks?status=overdue"
          progress={{
            value: tasks.overdue,
            max: tasks.totalTasks,
            caption: `${share(tasks.overdue, tasks.totalTasks)} of all tasks are late`,
          }}
        />
      </StatGrid>

      <FilterBar
        days={days}
        onChange={setDays}
        onRefresh={refresh}
        busy={busy || trendBusy}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tasks created vs completed</CardTitle>
            <CardDescription>
              Daily volume over the last {days} days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendSlice === null ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <div
                className={cn(
                  "transition-opacity duration-200",
                  trendBusy && "opacity-60",
                )}
              >
                <TrendAreaChart data={trendData} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion rate</CardTitle>
            <CardDescription>
              Share of all tasks that are finished.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompletionGauge
              percentage={tasks.completionRate}
              caption={`${tasks.completed.toLocaleString()} of ${tasks.totalTasks.toLocaleString()} tasks`}
            />
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
              <MiniStat
                label="In progress"
                value={tasks.inProgress}
                color="var(--viz-1)"
              />
              <MiniStat
                label="Blocked"
                value={tasks.blocked}
                color="var(--viz-serious)"
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      <div
        className={cn(
          "grid gap-6",
          priorityBars.length ? "lg:grid-cols-3" : "lg:grid-cols-2",
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle>Task status distribution</CardTitle>
            <CardDescription>
              All {tasks.totalTasks.toLocaleString()} tasks in the organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBarChart
              data={statusBars}
              ariaLabel="Number of tasks in each status"
              labelWidth={124}
              tableColumns={["Status", "Tasks"]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Headcount by role</CardTitle>
            <CardDescription>
              {employees.activeEmployees.toLocaleString()} active employees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBarChart
              data={roleBars}
              ariaLabel="Number of employees in each role"
              labelWidth={110}
              tableColumns={["Role", "People"]}
            />
          </CardContent>
        </Card>

        {priorityBars.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tasks by priority</CardTitle>
              <CardDescription>Where the urgent work sits.</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryBarChart
                data={priorityBars}
                ariaLabel="Number of tasks at each priority"
                labelWidth={80}
                tableColumns={["Priority", "Tasks"]}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Project progress</CardTitle>
              <CardDescription>
                Task load across the {projectBars.length} busiest running
                projects.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectStackedBars data={projectBars} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
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
                    {recentTasks.map((task) => {
                      const assignee = task.people?.find(
                        (person) => person.id === task.assigneeId,
                      );
                      return (
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
                                  name: assignee?.name ?? "Unknown",
                                  email: "",
                                  avatarColor:
                                    assignee?.avatarColor ?? "#2d5a4c",
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="size-4 text-muted-foreground" />
                  Pending requests
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/requests">Review</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Inbox className="size-4" />
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
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  Recent activity
                </CardTitle>
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
                <ul className="space-y-3.5">
                  {activity.map((log) => (
                    <li
                      key={log.id}
                      className="relative pl-4 text-xs before:absolute before:top-1.5 before:left-0 before:size-1.5 before:rounded-full before:bg-(--viz-1) after:absolute after:top-4 after:bottom-[-0.7rem] after:left-[0.16rem] after:w-px after:bg-border last:after:hidden"
                    >
                      <span className="font-medium">{log.actor}</span>{" "}
                      <span className="text-muted-foreground">
                        {log.message}
                      </span>
                      <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">
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
    </div>
  );
}

function FilterBar({
  days,
  onChange,
  onRefresh,
  busy,
}: {
  days: number;
  onChange: (days: number) => void;
  onRefresh: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          Time range
        </span>
        <div
          role="group"
          aria-label="Trend time range"
          className="flex gap-0.5 rounded-lg bg-muted p-0.5"
        >
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              aria-pressed={days === range}
              onClick={() => onChange(range)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                days === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range} days
            </button>
          ))}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={onRefresh} disabled={busy}>
        <RefreshCw className={cn("size-3.5", busy && "animate-spin")} />
        Refresh
      </Button>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-[2px]"
          style={{ background: color }}
        />
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-semibold">{value.toLocaleString()}</dd>
    </div>
  );
}

function share(value: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

const PRIORITY_ORDER: Priority[] = ["Urgent", "High", "Medium", "Low"];

function toPriorityBars(
  byPriority: Record<string, number> | undefined,
): CategoryDatum[] {
  if (!byPriority) return [];

  const normalized = new Map<string, number>();
  for (const [key, count] of Object.entries(byPriority)) {
    normalized.set(key.toLowerCase(), count);
  }

  const bars = PRIORITY_ORDER.map((priority) => ({
    label: priority,
    value: normalized.get(priority.toLowerCase()) ?? 0,
    color: PRIORITY_COLOR[priority],
  })).filter((bar) => bar.value > 0);

  return bars.length ? bars : [];
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-11 w-full" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 w-full lg:col-span-2" />
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
