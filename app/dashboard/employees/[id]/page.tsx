"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  ProjectStatusBadge,
  RoleBadge,
  StatGrid,
  StatTile,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import {
  employeeById,
  formatDate,
  initialsOf,
  isOverdue,
  organizationSettings,
  projectById,
  projectNameOf,
  tasks,
  taskStatusBreakdown,
  daysBetween,
} from "@/lib/mock-data";

export default function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Route params are Promises in Next.js 16; `use` unwraps them in a Client Component.
  const { id } = React.use(params);
  const employee = employeeById(id);

  if (!employee) notFound();

  const assigned = tasks.filter((t) => t.assigneeId === employee.id);
  const created = tasks.filter((t) => t.creatorId === employee.id);
  const approving = tasks.filter(
    (t) => t.approverId === employee.id && t.status === "Pending Approval",
  );

  const completedTasks = assigned.filter((t) => t.status === "Completed");
  const pending = assigned.filter(
    (t) => t.status !== "Completed" && t.status !== "Rejected",
  );
  const overdue = assigned.filter(isOverdue);

  const avgDays = completedTasks.length
    ? Math.round(
        (completedTasks.reduce(
          (sum, t) => sum + daysBetween(t.createdAt, t.completedAt!),
          0,
        ) /
          completedTasks.length) *
          10,
      ) / 10
    : 0;

  const breakdown = taskStatusBreakdown(assigned);

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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
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
                {formatDate(employee.registeredAt)}
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
              value={assigned.length}
              icon={ListTodo}
              hint={`${created.length} created by them`}
            />
            <StatTile
              label="Completed"
              value={completedTasks.length}
              icon={CheckCircle2}
              accent="var(--viz-good)"
              hint={
                assigned.length
                  ? `${Math.round((completedTasks.length / assigned.length) * 100)}% completion rate`
                  : "No tasks yet"
              }
            />
            <StatTile
              label="Pending"
              value={pending.length}
              icon={Clock}
              accent="var(--viz-warning)"
              hint={`${approving.length} awaiting their approval`}
            />
            <StatTile
              label="Avg. Completion"
              value={avgDays ? `${avgDays}d` : "—"}
              icon={Timer}
              accent="var(--viz-2)"
              hint={`${overdue.length} overdue`}
            />
          </StatGrid>

          <Card>
            <CardHeader>
              <CardTitle>Workload breakdown</CardTitle>
              <CardDescription>
                Status of the {assigned.length} tasks assigned to{" "}
                {employee.name.split(" ")[0]}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StackedBar
                segments={[
                  { label: "To Do", value: breakdown["To Do"] },
                  { label: "In Progress", value: breakdown["In Progress"] },
                  {
                    label: "Pending Approval",
                    value: breakdown["Pending Approval"],
                  },
                  { label: "Blocked", value: breakdown.Blocked },
                  { label: "Completed", value: breakdown.Completed },
                  { label: "Rejected", value: breakdown.Rejected },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned projects</CardTitle>
          <CardDescription>
            {employee.name.split(" ")[0]} can only open these from the mobile
            app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employee.projectIds.length === 0 ? (
            <EmptyState
              title="Not on any project yet"
              description="Add them from a project's Members tab."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {employee.projectIds.map((projectId) => {
                const project = projectById(projectId);
                if (!project) return null;
                const role = project.managerIds.includes(employee.id)
                  ? "Manager"
                  : project.leadIds.includes(employee.id)
                    ? "Team Lead"
                    : "Member";

                return (
                  <Link
                    key={projectId}
                    href={`/dashboard/projects/${projectId}`}
                    className="rounded-lg border p-3 transition-colors hover:border-foreground/20"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {project.name}
                      </p>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {role} · deadline {formatDate(project.deadline)}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned tasks</CardTitle>
          <CardDescription>
            Every task currently assigned to {employee.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assigned.length === 0 ? (
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
                  {assigned.map((task) => (
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
                        {projectNameOf(task.projectId)}
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
    </>
  );
}
