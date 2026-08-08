"use client";

import * as React from "react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DefinitionRow,
  PageHeader,
  PersonCell,
  PriorityBadge,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import { Skeleton } from "@/components/ui/skeleton";
import { SampleDataNotice } from "@/components/dashboard/ui-bits";
import { TaskComments } from "@/components/dashboard/task-comments";
import { getErrorMessage } from "@/lib/api/auth";
import { useAppSelector } from "@/lib/redux/hooks";
import { toEmployees, toTask, toTaskEvents } from "@/lib/api/adapters";
import { listEmployees } from "@/lib/api/employees";
import {
  getTask,
  getTaskTimeline,
  reassignTask,
  updateTaskDueDate,
  updateTaskPriority,
  updateTaskStatus,
  approveTask,
  rejectTask,
  returnTask,
} from "@/lib/api/tasks";
import {
  REFERENCE_TODAY,
  activeEmployees as seedActiveEmployees,
  employeeById,
  formatDate,
  formatDateTime,
  initialsOf,
  projectNameOf,
  relativeToToday,
  taskById,
} from "@/lib/mock-data";
import {
  PRIORITIES,
  SETTABLE_TASK_STATUSES,
  type Employee,
  type Priority,
  type Task,
  type TaskEvent,
  type TaskStatus,
} from "@/lib/types";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [task, setTask] = React.useState<Task | null>(null);
  const [timeline, setTimeline] = React.useState<TaskEvent[]>([]);
  const [roster, setRoster] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [missing, setMissing] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  /** The signed-in admin, so their own actions read with their name. */
  const admin = useAppSelector((state) => state.user.user);
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // The detail payload already carries a timeline, but the dedicated
        // endpoint is authoritative and newest-first, so it wins when present.
        const [detail, events, employees] = await Promise.all([
          getTask(id),
          getTaskTimeline(id).catch(() => null),
          listEmployees({ status: "Active", limit: 200 }).catch(() => null),
        ]);
        if (cancelled) return;

        const mapped = toTask(detail.data.task);
        setTask(mapped);
        setTimeline(
          events?.data.timeline
            ? toTaskEvents(events.data.timeline)
            : mapped.timeline,
        );
        setRoster(employees ? toEmployees(employees.items) : []);
        setUsingSampleData(false);
        setMissing(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load task:", error);

        const seeded = taskById(id);
        if (!seeded) {
          setMissing(true);
        } else {
          setTask(seeded);
          setTimeline(seeded.timeline);
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

  /**
   * Commenting writes a `commented` entry to the task timeline server-side, so
   * refetch it rather than leaving the thread and the history out of step.
   * Declared before the early returns so the hook order stays stable.
   */
  const refreshTimeline = React.useCallback(async () => {
    try {
      const events = await getTaskTimeline(id);
      setTimeline(toTaskEvents(events.data.timeline));
    } catch (error) {
      console.error("Failed to refresh the timeline:", error);
    }
  }, [id]);

  if (loading) return <TaskSkeleton />;

  if (missing || !task) {
    return (
      <>
        <PageHeader
          title="Task not found"
          backHref="/dashboard/tasks"
          backLabel="Tasks"
        />
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">No task with this id</p>
          <p className="text-sm text-muted-foreground">
            It may have been deleted.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-2">
            <Link href="/dashboard/tasks">Back to tasks</Link>
          </Button>
        </div>
      </>
    );
  }

  const overdue =
    !!task.dueDate &&
    task.status !== "Completed" &&
    task.status !== "Rejected" &&
    task.dueDate < REFERENCE_TODAY;

  const nameOf = (personId: string | null | undefined) => {
    if (!personId) return null;
    if (admin && personId === admin.id) return admin.name;
    return (
      task.people?.find((person) => person.id === personId)?.name ??
      roster.find((employee) => employee.id === personId)?.name ??
      employeeById(personId)?.name ??
      null
    );
  };

  const colorOf = (personId: string) =>
    task.people?.find((person) => person.id === personId)?.avatarColor ??
    roster.find((employee) => employee.id === personId)?.avatarColor ??
    employeeById(personId)?.avatarColor ??
    "#2d5a4c";

  /** Appends a local event so the timeline reflects an action immediately. */
  const logLocally = (action: string, detail?: string) =>
    setTimeline((prev) => [
      {
        id: `${task.id}-local-${prev.length + 1}`,
        at: new Date().toISOString().slice(0, 10),
        actorId: admin?.id ?? "admin",
        actorModel: "Admin",
        actorName: admin?.name ?? "Admin",
        actorAvatarColor: "#2d5a4c",
        action,
        detail,
      },
      ...prev,
    ]);

  /** Wraps a mutation with the optimistic update, rollback and toast. */
  const mutate = async (
    optimistic: Partial<Task>,
    call: () => Promise<{ message: string }>,
    fallbackMessage: string,
    logEntry?: { action: string; detail?: string },
  ) => {
    const previous = task;
    setTask({ ...task, ...optimistic });
    if (logEntry) logLocally(logEntry.action, logEntry.detail);

    if (usingSampleData) {
      toast.success(fallbackMessage, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    setBusy(true);
    try {
      const { message } = await call();
      toast.success(message || fallbackMessage);
    } catch (error) {
      setTask(previous);
      toast.error(getErrorMessage(error, "Could not update the task."));
    } finally {
      setBusy(false);
    }
  };

  const updateStatus = (status: TaskStatus) =>
    mutate(
      {
        status,
        completedAt:
          status === "Completed"
            ? new Date().toISOString().slice(0, 10)
            : task.completedAt,
      },
      () => updateTaskStatus(task.id, status),
      `Task moved to ${status}`,
      { action: `moved the task to ${status}` },
    );

  const updatePriority = (priority: Priority) =>
    mutate(
      { priority },
      () => updateTaskPriority(task.id, priority),
      `Priority set to ${priority}`,
      { action: `changed the priority to ${priority}` },
    );

  const updateDueDate = (dueDate: string) =>
    mutate(
      { dueDate: dueDate || null },
      () => updateTaskDueDate(task.id, dueDate || null),
      dueDate ? `Due date set to ${formatDate(dueDate)}` : "Due date cleared",
      {
        action: dueDate ? "changed the due date" : "cleared the due date",
        detail: dueDate ? formatDate(dueDate) : undefined,
      },
    );

  const updateAssignee = (value: string) => {
    const assignee = value === "none" ? null : value;
    const name = nameOf(assignee) ?? "employee";
    return mutate(
      { assigneeId: assignee },
      () => reassignTask(task.id, assignee),
      assignee ? `Reassigned to ${name}` : "Task unassigned",
      { action: "reassigned the task", detail: assignee ? name : "Unassigned" },
    );
  };

  const decide = async (decision: "approve" | "reject" | "return") => {
    if (decision !== "approve" && !comment.trim()) {
      toast.error(
        decision === "reject"
          ? "Add a comment before rejecting"
          : "Add a comment before returning the task",
      );
      return;
    }

    const previous = task;
    const note = comment.trim();
    const nextStatus: TaskStatus =
      decision === "approve"
        ? "Completed"
        : decision === "reject"
          ? "Rejected"
          : "Returned";

    setTask({
      ...task,
      status: nextStatus,
      completedAt:
        decision === "approve"
          ? new Date().toISOString().slice(0, 10)
          : task.completedAt,
      reviewComment: note || task.reviewComment,
    });
    setComment("");

    const fallback =
      decision === "approve"
        ? "Task approved"
        : decision === "reject"
          ? "Task rejected"
          : "Returned to the assignee";

    if (usingSampleData) {
      toast.success(fallback, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    setBusy(true);
    try {
      const payload = note ? { comments: note } : {};
      const { message } =
        decision === "approve"
          ? await approveTask(task.id, payload)
          : decision === "reject"
            ? await rejectTask(task.id, payload)
            : await returnTask(task.id, payload);
      toast.success(message || fallback);
      refresh();
    } catch (error) {
      setTask(previous);
      toast.error(getErrorMessage(error, "Could not record the decision."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={task.title}
        description={`${task.id} · ${task.projectName ?? projectNameOf(task.projectId)}`}
        backHref="/dashboard/tasks"
        backLabel="Tasks"
        action={
          <>
            <TaskStatusBadge status={task.status} overdue={overdue} />
            <PriorityBadge priority={task.priority} />
          </>
        }
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the tasks API — showing sample data for this task."
          onRetry={refresh}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {task.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
                {task.reviewComment && (
                  <div className="rounded-lg border-l-4 border-l-(--viz-critical) bg-muted/40 p-3">
                    <p className="text-xs font-medium">Reviewer comment</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.reviewComment}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Approval decision — only while a decision is outstanding */}
          {task.status === "Pending Approval" && (
            <Card className="border-l-4 border-l-(--viz-warning)">
              <CardHeader>
                <CardTitle>Approval needed</CardTitle>
                <CardDescription>
                  {task.approverId
                    ? `Assigned approver: ${nameOf(task.approverId) ?? "unassigned"}. As admin you can decide directly.`
                    : "No approver was set on this task."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="decision-comment">
                    Comment (required when rejecting or returning)
                  </Label>
                  <Textarea
                    id="decision-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Explain what needs to change…"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-[#2d5a4c] hover:bg-[#234539]"
                    onClick={() => decide("approve")}
                    disabled={busy}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => decide("return")}
                    disabled={busy}
                  >
                    Return for changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => decide("reject")}
                    disabled={busy}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
              <CardDescription>
                Every state change on this task, newest first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-6">
                {timeline.map((event) => {
                  const actor = {
                    name:
                      event.actorName ??
                      nameOf(event.actorId) ??
                      (event.actorModel === "Admin" ? "Admin" : "Unknown"),
                    avatarColor:
                      event.actorAvatarColor ?? colorOf(event.actorId),
                  };

                  return (
                    <li key={event.id} className="relative">
                      <span className="absolute top-0.5 -left-8 ">
                        <Avatar className="size-6 ring-2 ring-background">
                          <AvatarFallback
                            className="text-[0.6rem] font-semibold text-white"
                            style={{
                              background: actor?.avatarColor ?? "#2d5a4c",
                            }}
                          >
                            {initialsOf(actor?.name ?? "??")}
                          </AvatarFallback>
                        </Avatar>
                      </span>
                      <p className="text-sm">
                        <span className="font-medium">
                          {actor?.name ?? "Unknown"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {event.action}
                        </span>
                      </p>
                      {event.detail && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {event.detail}
                        </p>
                      )}
                      <p className="text-[0.65rem] text-muted-foreground">
                        {formatDateTime(event.at)}
                      </p>
                    </li>
                  );
                })}
              </ol>

            </CardContent>
          </Card>

          <TaskComments
            taskId={task.id}
            currentUserId={admin?.id}
            onChange={refreshTimeline}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <DefinitionRow label="Project">
                  <Link
                    href={`/dashboard/projects/${task.projectId}`}
                    className="hover:underline"
                  >
                    {task.projectName ?? projectNameOf(task.projectId)}
                  </Link>
                </DefinitionRow>
                <DefinitionRow label="Created by">
                  {nameOf(task.creatorId) ?? "—"}
                </DefinitionRow>
                <DefinitionRow label="Approver">
                  {task.approverIds?.length
                    ? (nameOf(task.approverId) ??
                      `${task.approverIds.length} approver(s)`)
                    : "Not required"}
                </DefinitionRow>
                <DefinitionRow label="Created">
                  {formatDate(task.createdAt)}
                </DefinitionRow>
                <DefinitionRow label="Due">
                  {formatDate(task.dueDate)}
                  {task.dueDate && ` (${relativeToToday(task.dueDate)})`}
                </DefinitionRow>
                <DefinitionRow label="Completed">
                  {task.completedAt ? formatDate(task.completedAt) : "—"}
                </DefinitionRow>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.assigneeId ? (
                <PersonCell
                  employee={{
                    id: task.assigneeId,
                    name: nameOf(task.assigneeId) ?? "Unknown",
                    email: "",
                    avatarColor: colorOf(task.assigneeId),
                  }}
                  href={`/dashboard/employees/${task.assigneeId}`}
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  Unassigned
                </span>
              )}
              <div className="space-y-2">
                <Label htmlFor="reassign">Reassign to</Label>
                <Select
                  value={task.assigneeId ?? "none"}
                  onValueChange={updateAssignee}
                  disabled={busy}
                >
                  <SelectTrigger id="reassign" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {roster.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} — {employee.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="task-status">Status</Label>
                <Select
                  value={task.status}
                  onValueChange={(v) => updateStatus(v as TaskStatus)}
                  disabled={busy}
                >
                  <SelectTrigger id="task-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SETTABLE_TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Due date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={task.dueDate ?? ""}
                  disabled={busy}
                  onChange={(e) => updateDueDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Changing this notifies the assignee.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={task.priority}
                  onValueChange={(v) => updatePriority(v as Priority)}
                  disabled={busy}
                >
                  <SelectTrigger id="task-priority" className="w-full">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-80" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 w-full lg:col-span-2" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
