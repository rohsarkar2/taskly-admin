"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, ListTodo, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HBarChart, Meter, StackedBar } from "@/components/charts/bar-chart";
import { getErrorMessage } from "@/lib/api/auth";
import { updateProjectWorkflow } from "@/lib/api/organization";
import {
  DefinitionRow,
  EmptyState,
  PageHeader,
  PersonCell,
  PriorityBadge,
  ProjectStatusBadge,
  RoleBadge,
  StatGrid,
  StatTile,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import {
  activeEmployees,
  daysBetween,
  employeeById,
  formatDate,
  isOverdue,
  projectById,
  relativeToToday,
  tasks,
  taskStatusBreakdown,
} from "@/lib/mock-data";
import { PRIORITIES, ROLES, type Priority, type Role } from "@/lib/types";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const project = projectById(id);

  if (!project) notFound();

  const [workflow, setWorkflow] = React.useState(project.workflow);
  const [savingWorkflow, setSavingWorkflow] = React.useState(false);
  const [memberIds, setMemberIds] = React.useState(project.memberIds);
  const [addMemberId, setAddMemberId] = React.useState("");

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const breakdown = taskStatusBreakdown(projectTasks);
  const completed = breakdown.Completed;
  const overdue = projectTasks.filter(isOverdue).length;
  const completionRate = projectTasks.length
    ? Math.round((completed / projectTasks.length) * 100)
    : 0;

  const completedWithDates = projectTasks.filter((t) => t.completedAt);
  const avgDays = completedWithDates.length
    ? Math.round(
        (completedWithDates.reduce(
          (sum, t) => sum + daysBetween(t.createdAt, t.completedAt!),
          0,
        ) /
          completedWithDates.length) *
          10,
      ) / 10
    : 0;

  /** Remaining tasks × observed throughput, as a rough finish estimate. */
  const remaining = projectTasks.length - completed;
  const estimatedDays = avgDays ? Math.ceil(remaining * (avgDays / 3)) : 0;

  const memberLoad = memberIds
    .map((memberId) => ({
      label: employeeById(memberId)?.name ?? "Unknown",
      value: projectTasks.filter(
        (t) =>
          t.assigneeId === memberId &&
          t.status !== "Completed" &&
          t.status !== "Rejected",
      ).length,
    }))
    .sort((a, b) => b.value - a.value);

  const candidates = activeEmployees.filter((e) => !memberIds.includes(e.id));

  const roleInProject = (employeeId: string): Role | "Team Member" =>
    project.managerIds.includes(employeeId)
      ? "Manager"
      : project.leadIds.includes(employeeId)
        ? "Team Lead"
        : (employeeById(employeeId)?.role ?? "Team Member");

  const addMember = () => {
    if (!addMemberId) return;
    setMemberIds((prev) => [...prev, addMemberId]);
    toast.success(`${employeeById(addMemberId)?.name} added to ${project.name}`);
    setAddMemberId("");
  };

  const removeMember = (employeeId: string) => {
    setMemberIds((prev) => prev.filter((memberId) => memberId !== employeeId));
    toast.success(`${employeeById(employeeId)?.name} removed from the project`);
  };

  /** The only write on this page that already talks to the real backend. */
  const saveWorkflow = async () => {
    if (
      workflow.approvalRequired &&
      !workflow.adminCanApprove &&
      workflow.approvers.length === 0
    ) {
      toast.error("Pick at least one approver while approval is required");
      return;
    }

    setSavingWorkflow(true);
    try {
      const { message } = await updateProjectWorkflow(project.id, {
        approvalRequired: workflow.approvalRequired,
        autoApprove: workflow.autoApprove,
        approvers: workflow.approvers,
        adminCanApprove: workflow.adminCanApprove,
        defaultPriority: workflow.defaultPriority,
      });
      toast.success(message || "Project workflow updated successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the workflow."));
    } finally {
      setSavingWorkflow(false);
    }
  };

  const toggleApprover = (role: Role, on: boolean) => {
    setWorkflow((prev) => ({
      ...prev,
      approvers: on
        ? [...prev.approvers, role]
        : prev.approvers.filter((r) => r !== role),
    }));
  };

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description}
        backHref="/dashboard/projects"
        backLabel="Projects"
        action={
          <>
            <ProjectStatusBadge status={project.status} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/tasks?project=${project.id}`}>
                View tasks
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatTile
          label="Completion"
          value={`${completionRate}%`}
          hint={`${completed} of ${projectTasks.length} tasks`}
          icon={CheckCircle2}
          accent="var(--viz-good)"
        />
        <StatTile
          label="Open Tasks"
          value={remaining}
          hint={`${breakdown["In Progress"]} in progress`}
          icon={ListTodo}
        />
        <StatTile
          label="Overdue"
          value={overdue}
          hint={`${breakdown.Blocked} blocked`}
          icon={AlertTriangle}
          accent="var(--viz-critical)"
        />
        <StatTile
          label="Team"
          value={memberIds.length}
          hint={`${project.leadIds.length} leads · ${project.managerIds.length} managers`}
          icon={Users}
          accent="var(--viz-3)"
        />
      </StatGrid>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview -------------------------------------------------------- */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Project details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <DefinitionRow label="Key">
                    <span className="font-mono">{project.key}</span>
                  </DefinitionRow>
                  <DefinitionRow label="Status">
                    <ProjectStatusBadge status={project.status} />
                  </DefinitionRow>
                  <DefinitionRow label="Started">
                    {formatDate(project.startDate)}
                  </DefinitionRow>
                  <DefinitionRow label="Deadline">
                    {formatDate(project.deadline)}
                  </DefinitionRow>
                  <DefinitionRow label="Time left">
                    {relativeToToday(project.deadline)}
                  </DefinitionRow>
                  <DefinitionRow label="Created">
                    {formatDate(project.createdAt)}
                  </DefinitionRow>
                </dl>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Task status</CardTitle>
                <CardDescription>
                  All {projectTasks.length} tasks in {project.name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Meter
                  value={completionRate}
                  label={`${completed} of ${projectTasks.length} complete`}
                />
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
        </TabsContent>

        {/* Members --------------------------------------------------------- */}
        <TabsContent value="members" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add a member</CardTitle>
              <CardDescription>
                Only active employees can be added. Members see this project in
                the mobile app as soon as they are added.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-full space-y-2 sm:w-72">
                  <Label htmlFor="add-member">Employee</Label>
                  <Select value={addMemberId} onValueChange={setAddMemberId}>
                    <SelectTrigger id="add-member" className="w-full">
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.length === 0 && (
                        <SelectItem value="none" disabled>
                          Everyone is already on this project
                        </SelectItem>
                      )}
                      {candidates.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} — {employee.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="bg-[#2d5a4c] hover:bg-[#234539]"
                  onClick={addMember}
                  disabled={!addMemberId}
                >
                  Add to project
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project team</CardTitle>
              <CardDescription>
                {memberIds.length} members assigned.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {memberIds.length === 0 ? (
                <EmptyState
                  title="No members yet"
                  description="Add employees so they can work on this project."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Project role</TableHead>
                        <TableHead className="text-right">Open tasks</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberIds.map((memberId) => (
                        <TableRow key={memberId}>
                          <TableCell>
                            <PersonCell
                              employeeId={memberId}
                              href={`/dashboard/employees/${memberId}`}
                            />
                          </TableCell>
                          <TableCell>
                            <RoleBadge role={roleInProject(memberId) as Role} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {
                              projectTasks.filter(
                                (t) =>
                                  t.assigneeId === memberId &&
                                  t.status !== "Completed",
                              ).length
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMember(memberId)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks ----------------------------------------------------------- */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks in this project</CardTitle>
            </CardHeader>
            <CardContent>
              {projectTasks.length === 0 ? (
                <EmptyState title="No tasks yet" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="max-w-[20rem]">
                            <Link
                              href={`/dashboard/tasks/${task.id}`}
                              className="block truncate font-medium hover:underline"
                            >
                              {task.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <PersonCell
                              employeeId={task.assigneeId}
                              href={`/dashboard/employees/${task.assigneeId}`}
                            />
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
        </TabsContent>

        {/* Workflow -------------------------------------------------------- */}
        <TabsContent value="workflow" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Task workflow</CardTitle>
              <CardDescription>
                Each project defines its own approval rules, so different teams
                can work differently inside the same organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="approval-required" className="text-sm">
                    Task approval required
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    New tasks land in Pending Approval before work can start.
                  </p>
                </div>
                <Switch
                  id="approval-required"
                  checked={workflow.approvalRequired}
                  onCheckedChange={(checked) =>
                    setWorkflow((prev) => ({
                      ...prev,
                      approvalRequired: checked,
                      autoApprove: checked ? false : prev.autoApprove,
                    }))
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="auto-approve" className="text-sm">
                    Auto approval
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tasks are approved on creation. Turns off the approval gate.
                  </p>
                </div>
                <Switch
                  id="auto-approve"
                  checked={workflow.autoApprove}
                  disabled={workflow.approvalRequired}
                  onCheckedChange={(checked) =>
                    setWorkflow((prev) => ({ ...prev, autoApprove: checked }))
                  }
                />
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Who can approve</p>
                  <p className="text-xs text-muted-foreground">
                    At least one approver is needed while approval is required.
                  </p>
                </div>
                {ROLES.filter((r) => r !== "Team Member").map((role) => (
                  <div key={role} className="flex items-center gap-2">
                    <Checkbox
                      id={`approver-${role}`}
                      checked={workflow.approvers.includes(role)}
                      onCheckedChange={(checked) =>
                        toggleApprover(role, checked === true)
                      }
                    />
                    <Label htmlFor={`approver-${role}`} className="text-sm">
                      {role}s can approve
                    </Label>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="approver-admin"
                    checked={workflow.adminCanApprove}
                    onCheckedChange={(checked) =>
                      setWorkflow((prev) => ({
                        ...prev,
                        adminCanApprove: checked === true,
                      }))
                    }
                  />
                  <Label htmlFor="approver-admin" className="text-sm">
                    Admin can approve
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-priority">Default priority</Label>
                <Select
                  value={workflow.defaultPriority}
                  onValueChange={(v) =>
                    setWorkflow((prev) => ({
                      ...prev,
                      defaultPriority: v as Priority,
                    }))
                  }
                >
                  <SelectTrigger id="workflow-priority" className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="bg-[#2d5a4c] hover:bg-[#234539]"
                onClick={saveWorkflow}
                disabled={savingWorkflow}
              >
                {savingWorkflow ? "Saving…" : "Save workflow"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics ------------------------------------------------------- */}
        <TabsContent value="analytics" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery</CardTitle>
                <CardDescription>
                  Throughput measured from task creation to approval.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl>
                  <DefinitionRow label="Completion">
                    {completionRate}%
                  </DefinitionRow>
                  <DefinitionRow label="Completed tasks">
                    {completed}
                  </DefinitionRow>
                  <DefinitionRow label="Pending tasks">
                    {remaining}
                  </DefinitionRow>
                  <DefinitionRow label="Overdue tasks">{overdue}</DefinitionRow>
                  <DefinitionRow label="Blocked tasks">
                    {breakdown.Blocked}
                  </DefinitionRow>
                  <DefinitionRow label="Avg. completion time">
                    {avgDays ? `${avgDays} days` : "—"}
                  </DefinitionRow>
                  <DefinitionRow label="Estimated completion">
                    {project.status === "Completed"
                      ? "Delivered"
                      : estimatedDays
                        ? `~${estimatedDays} days at current pace`
                        : "—"}
                  </DefinitionRow>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open work per member</CardTitle>
                <CardDescription>
                  Tasks still open, by assignee. Use it to spot an overloaded
                  member.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {memberLoad.length === 0 ? (
                  <EmptyState title="No members assigned" />
                ) : (
                  <HBarChart
                    data={memberLoad}
                    tableColumns={["Member", "Open tasks"]}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
