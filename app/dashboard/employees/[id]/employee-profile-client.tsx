"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, ListTodo, Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StackedBar } from "@/components/charts/bar-chart";
import {
  DefinitionRow,
  EmployeeStatusBadge,
  EmptyState,
  PageHeader,
  PriorityBadge,
  RoleBadge,
  SampleDataNotice,
  StatGrid,
  StatTile,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import {
  toEmployee,
  toEmployeeStats,
  toPriority,
  toTaskStatus,
} from "@/lib/api/adapters";
import {
  getEmployee,
  getEmployeeProjects,
  getEmployeeStats,
  getEmployeeTasks,
} from "@/lib/api/employees";
import type { ApiEmployeeProject, EmployeeStats } from "@/lib/api/types";
import {
  employeeById,
  formatDate,
  initialsOf,
  isOverdue,
  organizationSettings,
  projectById,
  projectNameOf,
  tasks as seedTasks,
} from "@/lib/mock-data";
import {
  TASK_STATUSES,
  type Employee,
  type Priority,
  type TaskStatus,
} from "@/lib/types";

interface DetailTask {
  id: string;
  title: string;
  projectName: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  overdue: boolean;
}

export default function EmployeeProfileClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [stats, setStats] = React.useState<EmployeeStats | null>(null);
  const [projects, setProjects] = React.useState<ApiEmployeeProject[]>([]);
  const [tasks, setTasks] = React.useState<DetailTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [detail, stats, projects, tasks] = await Promise.all([
          getEmployee(id),
          getEmployeeStats(id).catch(() => null),
          getEmployeeProjects(id).catch(() => null),
          getEmployeeTasks(id, { limit: 100 }).catch(() => null),
        ]);
        if (cancelled) return;

        setEmployee(toEmployee(detail.data.employee));
        setProjects(projects?.data.projects ?? []);
        setTasks(
          (tasks?.items ?? []).map(toDetailTask).filter(Boolean) as DetailTask[],
        );

        if (stats?.data.stats) {
          setStats(toEmployeeStats(stats.data.stats));
        } else if (detail.data.summary) {
          const summary = detail.data.summary;
          const byStatus = summary.tasksByStatus ?? {};
          const total = summary.totalTasks ?? 0;
          const completed = byStatus.completed ?? 0;
          setStats({
            assigned: total,
            completed,
            pending: Math.max(0, total - completed),
            overdue: 0,
            completionRate: total ? Math.round((completed / total) * 100) : 0,
          });
        } else {
          setStats(null);
        }

        setUsingSampleData(false);
        setNotFound(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load employee:", error);

        const seeded = employeeById(id);
        if (!seeded) {
          setNotFound(true);
        } else {
          setEmployee(seeded);
          setStats(null);
          setProjects(seededProjectsFor(seeded));
          setTasks(seededTasksFor(seeded.id));
          setUsingSampleData(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  if (loading) return <ProfileSkeleton />;

  if (notFound || !employee) {
    return (
      <>
        <PageHeader
          title="Employee not found"
          backHref="/dashboard/employees"
          backLabel="Employees"
        />
        <EmptyState
          title="No employee with this id"
          description="They may have been removed from the organization."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/employees">Back to employees</Link>
            </Button>
          }
        />
      </>
    );
  }

  const derived = deriveStats(tasks);
  const summary: EmployeeStats = stats ?? derived;

  const breakdown = countByStatus(tasks);
  const firstName = employee.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={employee.name}
        description={employee.jobTitle ?? employee.email}
        backHref="/dashboard/employees"
        backLabel="Employees"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/employees">Manage</Link>
          </Button>
        }
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the employees API — showing sample data for this profile."
          onRetry={refresh}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback
                  className="text-sm font-semibold text-white"
                  style={{ background: employee.avatarColor }}
                >
                  {initialsOf(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="truncate">{employee.name}</CardTitle>
                <CardDescription className="truncate">
                  {employee.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl>
              <DefinitionRow label="Role">
                <RoleBadge role={employee.role} />
              </DefinitionRow>
              <DefinitionRow label="Status">
                <EmployeeStatusBadge status={employee.status} />
              </DefinitionRow>
              <DefinitionRow label="Phone">
                {employee.phone ?? "—"}
              </DefinitionRow>
              <DefinitionRow label="Registered">
                {employee.registeredAt ? formatDate(employee.registeredAt) : "—"}
              </DefinitionRow>
              <DefinitionRow label="Joined">
                {employee.joinedAt ? formatDate(employee.joinedAt) : "—"}
              </DefinitionRow>
              <DefinitionRow label="Organization">
                {organizationSettings.uniqueOrganizationId}
              </DefinitionRow>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <StatGrid>
            <StatTile
              label="Assigned Tasks"
              value={summary.assigned}
              icon={ListTodo}
              hint={`${projects.length} project${projects.length === 1 ? "" : "s"}`}
            />
            <StatTile
              label="Completed"
              value={summary.completed}
              icon={CheckCircle2}
              accent="var(--viz-good)"
              hint={
                summary.assigned
                  ? `${summary.completionRate}% completion rate`
                  : "No tasks yet"
              }
            />
            <StatTile
              label="Pending"
              value={summary.pending}
              icon={Clock}
              accent="var(--viz-warning)"
              hint={`${summary.overdue} overdue`}
            />
            <StatTile
              label="Avg. Completion"
              value={
                summary.avgCompletionDays ? `${summary.avgCompletionDays}d` : "—"
              }
              icon={Timer}
              accent="var(--viz-2)"
              hint="Creation to approval"
            />
          </StatGrid>

          {tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Workload breakdown</CardTitle>
                <CardDescription>
                  Status of the {tasks.length} tasks assigned to {firstName}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StackedBar
                  segments={TASK_STATUSES.map((status) => ({
                    label: status,
                    value: breakdown[status],
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned projects</CardTitle>
          <CardDescription>
            {firstName} can only open these from the mobile app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <EmptyState
              title="Not on any project yet"
              description="Add them from a project's Members tab."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project._id ?? project.id}
                  href={`/dashboard/projects/${project._id ?? project.id}`}
                  className="rounded-lg border p-3 transition-colors hover:border-foreground/20"
                >
                  <p className="mb-1 truncate text-sm font-medium">
                    {project.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {project.projectRole ?? "Member"}
                    {project.endDate &&
                      ` · ends ${formatDate(project.endDate.slice(0, 10))}`}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned tasks</CardTitle>
          <CardDescription>
            Every task currently assigned to {employee.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <EmptyState title="No tasks assigned" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="max-w-[20rem]">
                        <Link
                          href={`/dashboard/tasks/${task.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        {task.projectName}
                      </TableCell>
                      <TableCell>
                        <TaskStatusBadge
                          status={task.status}
                          overdue={task.overdue}
                        />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">
                        {task.dueDate ? formatDate(task.dueDate) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full lg:col-span-2" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function toDetailTask(raw: unknown): DetailTask | null {
  if (!raw || typeof raw !== "object") return null;
  const task = raw as Record<string, unknown>;
  const id =
    typeof task._id === "string"
      ? task._id
      : typeof task.id === "string"
        ? task.id
        : null;
  if (!id) return null;

  const dueDate =
    typeof task.dueDate === "string" ? task.dueDate.slice(0, 10) : null;

  const projectName =
    typeof task.projectName === "string"
      ? task.projectName
      : typeof task.projectId === "string"
        ? projectNameOf(task.projectId)
        : "—";

  return {
    id,
    title: typeof task.title === "string" ? task.title : "Untitled task",
    projectName,
    status: toTaskStatus(
      typeof task.status === "string" ? task.status : undefined,
    ),
    priority: toPriority(
      typeof task.priority === "string" ? task.priority : undefined,
    ),
    dueDate,
    overdue: typeof task.isOverdue === "boolean" ? task.isOverdue : false,
  };
}

function countByStatus(tasks: DetailTask[]): Record<TaskStatus, number> {
  const counts = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, 0]),
  ) as Record<TaskStatus, number>;

  for (const task of tasks) counts[task.status] += 1;
  return counts;
}

function deriveStats(tasks: DetailTask[]): EmployeeStats {
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const pending = tasks.filter(
    (t) => t.status !== "Completed" && t.status !== "Rejected",
  ).length;

  return {
    assigned: tasks.length,
    completed,
    pending,
    overdue: tasks.filter((t) => t.overdue).length,
    completionRate: tasks.length
      ? Math.round((completed / tasks.length) * 100)
      : 0,
  };
}

function seededProjectsFor(employee: Employee): ApiEmployeeProject[] {
  return employee.projectIds.flatMap((projectId) => {
    const project = projectById(projectId);
    if (!project) return [];

    return [
      {
        id: project.id,
        name: project.name,
        code: project.code,
        status: project.status,
        priority: project.priority,
        endDate: project.deadline,
        projectRole: project.managerIds.includes(employee.id)
          ? "Manager"
          : project.leadIds.includes(employee.id)
            ? "Team Lead"
            : "Member",
      },
    ];
  });
}

function seededTasksFor(employeeId: string): DetailTask[] {
  return seedTasks
    .filter((task) => task.assigneeId === employeeId)
    .map((task) => ({
      id: task.id,
      title: task.title,
      projectName: projectNameOf(task.projectId),
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      overdue: isOverdue(task),
    }));
}
