"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import {
  activeEmployees,
  employeeById,
  formatDate,
  initialsOf,
  isOverdue,
  projectById,
  relativeToToday,
  taskById,
} from "@/lib/mock-data";
import {
  PRIORITIES,
  TASK_STATUSES,
  type Priority,
  type TaskEvent,
  type TaskStatus,
} from "@/lib/types";

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const seed = taskById(id);

  if (!seed) notFound();

  const [task, setTask] = React.useState(seed);
  const [timeline, setTimeline] = React.useState<TaskEvent[]>(seed.timeline);
  const [comment, setComment] = React.useState("");

  const project = projectById(task.projectId);

  const log = (action: string, detail?: string) => {
    setTimeline((prev) => [
      ...prev,
      {
        id: `${task.id}-ev-${prev.length + 1}`,
        at: new Date().toISOString().slice(0, 10),
        actorId: "admin",
        action,
        detail,
      },
    ]);
  };

  const updateStatus = (status: TaskStatus) => {
    setTask((prev) => ({
      ...prev,
      status,
      completedAt:
        status === "Completed"
          ? new Date().toISOString().slice(0, 10)
          : prev.completedAt,
    }));
    log(`moved the task to ${status}`);
    toast.success(`Task moved to ${status}`);
  };

  const updatePriority = (priority: Priority) => {
    setTask((prev) => ({ ...prev, priority }));
    log(`changed the priority to ${priority}`);
    toast.success(`Priority set to ${priority}`);
  };

  const updateAssignee = (assigneeId: string) => {
    setTask((prev) => ({ ...prev, assigneeId }));
    log("reassigned the task", employeeById(assigneeId)?.name);
    toast.success(`Reassigned to ${employeeById(assigneeId)?.name}`);
  };

  const addComment = () => {
    if (!comment.trim()) return;
    log("commented", comment.trim());
    setComment("");
    toast.success("Comment added to the task history");
  };

  const decide = (decision: "approve" | "reject" | "return") => {
    if (decision === "approve") {
      setTask((prev) => ({
        ...prev,
        status: "Completed",
        completedAt: new Date().toISOString().slice(0, 10),
      }));
      log("approved and closed the task");
      toast.success("Task approved");
    } else if (decision === "reject") {
      setTask((prev) => ({
        ...prev,
        status: "Rejected",
        reviewComment: comment || undefined,
      }));
      log("rejected the task", comment || undefined);
      toast.success("Task rejected");
    } else {
      setTask((prev) => ({ ...prev, status: "In Progress" }));
      log("returned the task for changes", comment || undefined);
      toast.success("Returned to the assignee for changes");
    }
    setComment("");
  };

  return (
    <>
      <PageHeader
        title={task.title}
        description={`${task.id} · ${project?.name ?? "Unknown project"}`}
        backHref="/dashboard/tasks"
        backLabel="Tasks"
        action={
          <>
            <TaskStatusBadge status={task.status} overdue={isOverdue(task)} />
            <PriorityBadge priority={task.priority} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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

          {/* Approval decision — only while a decision is outstanding */}
          {task.status === "Pending Approval" && (
            <Card className="border-l-4 border-l-(--viz-warning)">
              <CardHeader>
                <CardTitle>Approval needed</CardTitle>
                <CardDescription>
                  {task.approverId
                    ? `Assigned approver: ${employeeById(task.approverId)?.name}. As admin you can decide directly.`
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
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!comment.trim()) {
                        toast.error("Add a comment before returning the task");
                        return;
                      }
                      decide("return");
                    }}
                  >
                    Return for changes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (!comment.trim()) {
                        toast.error("Add a comment before rejecting");
                        return;
                      }
                      decide("reject");
                    }}
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
                Every state change on this task, oldest first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-6">
                {timeline.map((event) => {
                  const actor =
                    event.actorId === "admin"
                      ? { name: "Admin", avatarColor: "#2d5a4c" }
                      : employeeById(event.actorId);

                  return (
                    <li key={event.id} className="relative">
                      <span className="absolute top-1 -left-[1.9rem]">
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
                        {formatDate(event.at)}
                      </p>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-5 space-y-2 border-t pt-4">
                <Label htmlFor="task-comment">Add a comment</Label>
                <Textarea
                  id="task-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Leave a note on this task…"
                />
                <Button size="sm" variant="outline" onClick={addComment}>
                  Post comment
                </Button>
              </div>
            </CardContent>
          </Card>
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
                    {project?.name ?? "—"}
                  </Link>
                </DefinitionRow>
                <DefinitionRow label="Created by">
                  {employeeById(task.creatorId)?.name ?? "—"}
                </DefinitionRow>
                <DefinitionRow label="Approver">
                  {task.approverId
                    ? (employeeById(task.approverId)?.name ?? "—")
                    : "Not required"}
                </DefinitionRow>
                <DefinitionRow label="Created">
                  {formatDate(task.createdAt)}
                </DefinitionRow>
                <DefinitionRow label="Due">
                  {formatDate(task.dueDate)} ({relativeToToday(task.dueDate)})
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
              <PersonCell
                employeeId={task.assigneeId}
                href={`/dashboard/employees/${task.assigneeId}`}
              />
              <div className="space-y-2">
                <Label htmlFor="reassign">Reassign to</Label>
                <Select
                  value={task.assigneeId}
                  onValueChange={updateAssignee}
                >
                  <SelectTrigger id="reassign" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEmployees.map((employee) => (
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
                >
                  <SelectTrigger id="task-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={task.priority}
                  onValueChange={(v) => updatePriority(v as Priority)}
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
