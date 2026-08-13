"use client";

import * as React from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Meter, StackedBar } from "@/components/charts/bar-chart";
import {
  DefinitionRow,
  EmptyState,
  PageHeader,
  PersonCell,
  PriorityBadge,
  ProjectStatusBadge,
  RoleBadge,
  SampleDataNotice,
  StatGrid,
  StatTile,
} from "@/components/dashboard/ui-bits";
import { getErrorMessage } from "@/lib/api/auth";
import {
  toApiProjectStatus,
  toApiWorkflow,
  toEmployees,
  toProject,
} from "@/lib/api/adapters";
import { listEmployees } from "@/lib/api/employees";
import {
  addProjectMembers,
  archiveProject,
  getProject,
  removeProjectMembers,
  unarchiveProject,
  updateProject,
  updateProjectWorkflow,
} from "@/lib/api/projects";
import {
  activeEmployees as seedActiveEmployees,
  employeeById,
  formatDate,
  projectById,
  relativeToToday,
} from "@/lib/mock-data";
import {
  PRIORITIES,
  PROJECT_STATUSES,
  ROLES,
  type Employee,
  type Priority,
  type Project,
  type ProjectPerson,
  type ProjectStatus,
  type ProjectWorkflow,
  type Role,
} from "@/lib/types";

export default function ProjectDetailClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [project, setProject] = React.useState<Project | null>(null);
  const [roster, setRoster] = React.useState<Employee[]>([]);
  const [workflow, setWorkflow] = React.useState<ProjectWorkflow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  const [addMemberId, setAddMemberId] = React.useState("");
  const [savingMembers, setSavingMembers] = React.useState(false);
  const [savingWorkflow, setSavingWorkflow] = React.useState(false);
  const [savingStatus, setSavingStatus] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<ProjectStatus | null>(
    null,
  );

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [detail, employees] = await Promise.all([
          getProject(id),
          listEmployees({ status: "Active", limit: 200 }).catch(() => null),
        ]);
        if (cancelled) return;

        const mapped = toProject(detail.data.project);
        if (detail.data.taskStats) {
          mapped.taskStats = toProject({
            ...detail.data.project,
            taskStats: detail.data.taskStats,
          }).taskStats;
        }

        setProject(mapped);
        setWorkflow(mapped.workflow);
        setRoster(employees ? toEmployees(employees.items) : []);
        setUsingSampleData(false);
        setMissing(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load project:", error);

        const seeded = projectById(id);
        if (!seeded) {
          setMissing(true);
        } else {
          setProject(seeded);
          setWorkflow(seeded.workflow);
          setRoster(seedActiveEmployees);
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

  if (loading) return <DetailSkeleton />;

  if (missing || !project || !workflow) {
    return (
      <>
        <PageHeader
          title="Project not found"
          backHref="/dashboard/projects"
          backLabel="Projects"
        />
        <EmptyState
          title="No project with this id"
          description="It may have been deleted."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/projects">Back to projects</Link>
            </Button>
          }
        />
      </>
    );
  }

  const stats = project.taskStats;

  const allMemberIds = [
    ...new Set([
      ...project.memberIds,
      ...project.leadIds,
      ...project.managerIds,
    ]),
  ];

  const personFor = (memberId: string): ProjectPerson | Employee | undefined =>
    project.people?.find((person) => person.id === memberId) ??
    roster.find((employee) => employee.id === memberId) ??
    employeeById(memberId);

  const roleInProject = (memberId: string): Role => {
    if (project.managerIds.includes(memberId)) return "Manager";
    if (project.leadIds.includes(memberId)) return "Team Lead";
    const person = personFor(memberId);
    return (person && "role" in person && person.role) || "Team Member";
  };

  const candidates = roster.filter(
    (employee) => !allMemberIds.includes(employee.id),
  );

  const addMember = async () => {
    if (!addMemberId) return;
    const name = personFor(addMemberId)?.name ?? "Employee";

    if (usingSampleData) {
      setProject({
        ...project,
        memberIds: [...project.memberIds, addMemberId],
      });
      setAddMemberId("");
      toast.success(`${name} added to ${project.name}`, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    setSavingMembers(true);
    try {
      const { message } = await addProjectMembers(project.id, {
        memberIds: [addMemberId],
      });
      setProject({
        ...project,
        memberIds: [...project.memberIds, addMemberId],
      });
      setAddMemberId("");
      toast.success(message || `${name} added to ${project.name}`);
    } catch (error) {
      toast.error(getErrorMessage(error, `Could not add ${name}.`));
    } finally {
      setSavingMembers(false);
    }
  };

  const removeMember = async (memberId: string) => {
    const name = personFor(memberId)?.name ?? "Employee";
    const previous = project;

    setProject({
      ...project,
      memberIds: project.memberIds.filter((entry) => entry !== memberId),
      leadIds: project.leadIds.filter((entry) => entry !== memberId),
      managerIds: project.managerIds.filter((entry) => entry !== memberId),
    });

    if (usingSampleData) {
      toast.success(`${name} removed from the project`, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await removeProjectMembers(project.id, {
        memberIds: [memberId],
      });
      toast.success(message || `${name} removed from the project`, {
        description: "Their open tasks on this project are now unassigned.",
      });
    } catch (error) {
      setProject(previous);
      toast.error(getErrorMessage(error, `Could not remove ${name}.`));
    }
  };

  const applyStatus = async (next: ProjectStatus) => {
    if (next === project.status) return;

    const previous = project;
    setProject({ ...project, status: next });
    setSavingStatus(true);

    try {
      if (usingSampleData) {
        toast.success(`${project.name} is now ${next}`, {
          description: "Sample data — nothing was sent to the server.",
        });
        return;
      }

      let message = "";
      if (next === "Archived") {
        ({ message } = await archiveProject(project.id));
      } else if (previous.status === "Archived") {
        ({ message } = await unarchiveProject(project.id));
        if (next !== "Active") {
          const followUp = await updateProject(project.id, {
            status: toApiProjectStatus(next),
          });
          message = followUp.message || message;
        }
      } else {
        ({ message } = await updateProject(project.id, {
          status: toApiProjectStatus(next),
        }));
      }

      toast.success(message || `${project.name} is now ${next}`, {
        description:
          next === "Completed"
            ? "Every member has been notified."
            : undefined,
      });
    } catch (error) {
      setProject(previous);
      toast.error(
        getErrorMessage(error, "Could not change the project status."),
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const requestStatus = (next: ProjectStatus) => {
    if (next === "Completed" || next === "Archived") {
      setPendingStatus(next);
      return;
    }
    applyStatus(next);
  };

  const toggleApprover = (memberId: string, on: boolean) =>
    setWorkflow((prev) =>
      prev
        ? {
            ...prev,
            approverIds: on
              ? [...prev.approverIds, memberId]
              : prev.approverIds.filter((entry) => entry !== memberId),
          }
        : prev,
    );

  const saveWorkflow = async () => {
    if (
      workflow.requireTaskApproval &&
      !workflow.approverRole &&
      workflow.approverIds.length === 0
    ) {
      toast.error(
        "Pick an approver role or at least one approver while approval is required",
      );
      return;
    }

    if (usingSampleData) {
      toast.error("Sample data — connect the projects API to save the workflow.");
      return;
    }

    setSavingWorkflow(true);
    try {
      const { message } = await updateProjectWorkflow(
        project.id,
        toApiWorkflow(workflow),
      );
      toast.success(message || "Project workflow updated successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the workflow."));
    } finally {
      setSavingWorkflow(false);
    }
  };

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description || "No description yet."}
        backHref="/dashboard/projects"
        backLabel="Projects"
        action={
          <>
            <Select
              value={project.status}
              onValueChange={(value) => requestStatus(value as ProjectStatus)}
              disabled={savingStatus}
            >
              <SelectTrigger
                className="w-36"
                aria-label="Project status"
                title="Change project status"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PriorityBadge priority={project.priority} />
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/tasks?project=${project.id}`}>
                View tasks
              </Link>
            </Button>
          </>
        }
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the projects API — showing sample data for this project."
          onRetry={refresh}
        />
      )}

      <StatGrid>
        <StatTile
          label="Completion"
          value={stats ? `${Math.round(stats.completionPercentage)}%` : "—"}
          hint={stats ? `${stats.completed} of ${stats.total} tasks` : "No task data"}
          icon={CheckCircle2}
          accent="var(--viz-good)"
        />
        <StatTile
          label="Open Tasks"
          value={stats?.remaining ?? "—"}
          hint={stats ? `${stats.inProgress} in progress` : undefined}
          icon={ListTodo}
        />
        <StatTile
          label="Awaiting Approval"
          value={stats?.pendingApproval ?? "—"}
          hint={stats ? `${stats.pending} not started` : undefined}
          icon={AlertTriangle}
          accent="var(--viz-warning)"
        />
        <StatTile
          label="Team"
          value={allMemberIds.length}
          hint={`${project.leadIds.length} leads · ${project.managerIds.length} managers`}
          icon={Users}
          accent="var(--viz-3)"
        />
      </StatGrid>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Project details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl>
                  <DefinitionRow label="Code">
                    <span className="font-mono">{project.code}</span>
                  </DefinitionRow>
                  <DefinitionRow label="Status">
                    <ProjectStatusBadge status={project.status} />
                  </DefinitionRow>
                  <DefinitionRow label="Priority">
                    <PriorityBadge priority={project.priority} />
                  </DefinitionRow>
                  <DefinitionRow label="Started">
                    {project.startDate ? formatDate(project.startDate) : "—"}
                  </DefinitionRow>
                  <DefinitionRow label="Ends">
                    {project.deadline ? formatDate(project.deadline) : "—"}
                  </DefinitionRow>
                  <DefinitionRow label="Time left">
                    {project.deadline ? relativeToToday(project.deadline) : "—"}
                  </DefinitionRow>
                  <DefinitionRow label="Created">
                    {project.createdAt ? formatDate(project.createdAt) : "—"}
                  </DefinitionRow>
                </dl>

                {project.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Task status</CardTitle>
                <CardDescription>
                  {stats
                    ? `All ${stats.total} tasks in ${project.name}.`
                    : "Task counts arrive with the tasks API."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {stats ? (
                  <>
                    <Meter
                      value={Math.round(stats.completionPercentage)}
                      label={`${stats.completed} of ${stats.total} complete`}
                    />
                    <StackedBar
                      segments={[
                        { label: "Pending", value: stats.pending },
                        { label: "In Progress", value: stats.inProgress },
                        {
                          label: "Pending Approval",
                          value: stats.pendingApproval,
                        },
                        { label: "Completed", value: stats.completed },
                      ]}
                    />
                  </>
                ) : (
                  <EmptyState
                    title="No task data yet"
                    description="This project has no tasks, or the tasks API is not wired up."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                      {candidates.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No other active employees
                        </SelectItem>
                      ) : (
                        candidates.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} — {employee.role}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="bg-[#2d5a4c] hover:bg-[#234539]"
                  onClick={addMember}
                  disabled={!addMemberId || savingMembers}
                >
                  {savingMembers ? "Adding…" : "Add to project"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project team</CardTitle>
              <CardDescription>
                {allMemberIds.length} members assigned. Removing someone
                unassigns their open tasks on this project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allMemberIds.length === 0 ? (
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
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMemberIds.map((memberId) => {
                        const person = personFor(memberId);
                        return (
                          <TableRow key={memberId}>
                            <TableCell>
                              {person ? (
                                <PersonCell
                                  employee={{
                                    id: person.id,
                                    name: person.name,
                                    email:
                                      ("email" in person && person.email) || "",
                                    avatarColor: person.avatarColor,
                                  }}
                                  href={`/dashboard/employees/${memberId}`}
                                />
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {memberId}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <RoleBadge role={roleInProject(memberId)} />
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Task workflow</CardTitle>
              <CardDescription>
                Each project defines its own rules, so different teams can work
                differently inside the same organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ToggleRow
                id="require-approval"
                label="Require task approval"
                hint="Tasks wait for an approver before they can close."
                checked={workflow.requireTaskApproval}
                onChange={(checked) =>
                  setWorkflow({ ...workflow, requireTaskApproval: checked })
                }
              />

              <div className="space-y-2">
                <Label htmlFor="approver-role">Approver role</Label>
                <Select
                  value={workflow.approverRole ?? "none"}
                  onValueChange={(value) =>
                    setWorkflow({
                      ...workflow,
                      approverRole: value === "none" ? null : (value as Role),
                    })
                  }
                >
                  <SelectTrigger id="approver-role" className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Inherit the organization default
                    </SelectItem>
                    {ROLES.filter((role) => role !== "Team Member").map(
                      (role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used when no specific approvers are named below.
                </p>
              </div>

              <div className="space-y-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Specific approvers</p>
                  <p className="text-xs text-muted-foreground">
                    Naming people here overrides the approver role.
                  </p>
                </div>
                {allMemberIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Add members before choosing approvers.
                  </p>
                ) : (
                  allMemberIds.map((memberId) => {
                    const person = personFor(memberId);
                    return (
                      <div key={memberId} className="flex items-center gap-2">
                        <Checkbox
                          id={`approver-${memberId}`}
                          checked={workflow.approverIds.includes(memberId)}
                          onCheckedChange={(checked) =>
                            toggleApprover(memberId, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`approver-${memberId}`}
                          className="text-sm font-normal"
                        >
                          {person?.name ?? memberId}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({roleInProject(memberId)})
                          </span>
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workflow-priority">Default task priority</Label>
                <Select
                  value={workflow.defaultPriority}
                  onValueChange={(value) =>
                    setWorkflow({
                      ...workflow,
                      defaultPriority: value as Priority,
                    })
                  }
                >
                  <SelectTrigger
                    id="workflow-priority"
                    className="w-full sm:w-56"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ToggleRow
                id="allow-create"
                label="Members can create tasks"
                hint="Team members may add tasks from the mobile app."
                checked={workflow.allowMemberTaskCreation}
                onChange={(checked) =>
                  setWorkflow({ ...workflow, allowMemberTaskCreation: checked })
                }
              />

              <ToggleRow
                id="allow-delete"
                label="Members can delete tasks"
                hint="Off by default — deletions are usually an admin action."
                checked={workflow.allowMemberTaskDeletion}
                onChange={(checked) =>
                  setWorkflow({ ...workflow, allowMemberTaskDeletion: checked })
                }
              />

              <ToggleRow
                id="auto-complete"
                label="Auto-complete the project"
                hint="Marks the project Completed once every task is done."
                checked={workflow.autoCompleteOnAllTasksDone}
                onChange={(checked) =>
                  setWorkflow({
                    ...workflow,
                    autoCompleteOnAllTasksDone: checked,
                  })
                }
              />

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
      </Tabs>

      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => !open && setPendingStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === "Completed"
                ? `Mark ${project.name} as completed?`
                : `Archive ${project.name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === "Completed"
                ? "This stamps the completion date and notifies every member of the project."
                : "Archived projects stay readable but drop out of the active list. You can restore it at any time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#2d5a4c] text-white hover:bg-[#234539]"
              onClick={() => {
                const next = pendingStatus;
                setPendingStatus(null);
                if (next) applyStatus(next);
              }}
            >
              {pendingStatus === "Completed"
                ? "Mark completed"
                : "Archive project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div>
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
