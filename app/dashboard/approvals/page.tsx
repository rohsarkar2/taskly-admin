"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Clock, RotateCcw, XCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  PageHeader,
  PersonCell,
  PriorityBadge,
  SampleDataNotice,
  StatGrid,
  StatTile,
} from "@/components/dashboard/ui-bits";
import { getErrorMessage } from "@/lib/api/auth";
import { toProjects, toTasks } from "@/lib/api/adapters";
import { listProjects } from "@/lib/api/projects";
import {
  approveTask,
  listPendingApprovals,
  rejectTask,
  returnTask,
} from "@/lib/api/tasks";
import {
  REFERENCE_TODAY,
  employeeById,
  formatDate,
  projectNameOf,
  projects as seedProjects,
  relativeToToday,
  tasks as seedTasks,
} from "@/lib/mock-data";
import type { Project, Task } from "@/lib/types";

type Verdict = "approve" | "reject" | "return";

const VERDICT_COPY: Record<
  Verdict,
  { title: string; body: string; cta: string; needsComment: boolean }
> = {
  approve: {
    title: "Approve task",
    body: "The task is marked Completed and the assignee is notified.",
    cta: "Approve",
    needsComment: false,
  },
  reject: {
    title: "Reject task",
    body: "The task is closed as Rejected. Your comment is shown to the assignee.",
    cta: "Reject task",
    needsComment: true,
  },
  return: {
    title: "Return for changes",
    body: "The task goes back to the assignee as Returned, so they can rework and resubmit it.",
    cta: "Return task",
    needsComment: true,
  },
};

export default function ApprovalsPage() {
  const [queue, setQueue] = React.useState<Task[]>([]);
  const [projectOptions, setProjectOptions] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [handled, setHandled] = React.useState<
    { task: Task; verdict: Verdict; comment: string }[]
  >([]);
  const [projectFilter, setProjectFilter] = React.useState("all");

  const [target, setTarget] = React.useState<Task | null>(null);
  const [verdict, setVerdict] = React.useState<Verdict>("approve");
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const signal = { cancelled: false };

    const load = async () => {
      try {
        const [pending, projectList] = await Promise.all([
          listPendingApprovals({ projectId: projectFilter, limit: 100 }),
          listProjects({ limit: 100 }).catch(() => null),
        ]);
        if (signal.cancelled) return;

        setQueue(toTasks(pending.items));
        setProjectOptions(
          projectList ? toProjects(projectList.items) : seedProjects,
        );
        setUsingSampleData(false);
      } catch (error) {
        if (signal.cancelled) return;
        console.error("Failed to load approvals:", error);
        setQueue(seedTasks.filter((t) => t.status === "Pending Approval"));
        setProjectOptions(seedProjects);
        setUsingSampleData(true);
      } finally {
        if (!signal.cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      signal.cancelled = true;
    };
  }, [projectFilter, reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  // The server already filtered by project; sample mode filters locally.
  const visible = usingSampleData
    ? queue.filter(
        (task) => projectFilter === "all" || task.projectId === projectFilter,
      )
    : queue;

  const taskIsOverdue = (task: Task) =>
    !!task.dueDate &&
    task.status !== "Completed" &&
    task.status !== "Rejected" &&
    task.dueDate < REFERENCE_TODAY;

  const open = (task: Task, next: Verdict) => {
    setTarget(task);
    setVerdict(next);
    setComment("");
  };

  const confirm = async () => {
    if (!target) return;
    if (VERDICT_COPY[verdict].needsComment && !comment.trim()) {
      toast.error("Add a comment so the assignee knows what to change");
      return;
    }

    const decided = target;
    const note = comment;

    setSubmitting(true);
    try {
      let message = "";
      if (!usingSampleData) {
        // All three decisions post `comments`; reject and return require it.
        const payload = note.trim() ? { comments: note.trim() } : {};
        const response =
          verdict === "approve"
            ? await approveTask(decided.id, payload)
            : verdict === "reject"
              ? await rejectTask(decided.id, payload)
              : await returnTask(decided.id, payload);
        message = response.message;
      }

      setQueue((prev) => prev.filter((t) => t.id !== decided.id));
      setHandled((prev) => [{ task: decided, verdict, comment: note }, ...prev]);
      setTarget(null);

      toast.success(
        message ||
          (verdict === "approve"
            ? "Task approved"
            : verdict === "reject"
              ? "Task rejected"
              : "Returned to the assignee"),
        {
          description: usingSampleData
            ? "Sample data — nothing was sent to the server."
            : undefined,
        },
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not record the decision."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Approval Center"
        description="Tasks whose project requires approval before work can be closed."
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the approvals API — showing sample data. Decisions will not be saved."
          onRetry={refresh}
        />
      )}

      <StatGrid>
        <StatTile
          label="Awaiting Decision"
          value={queue.length}
          icon={Clock}
          accent="var(--viz-warning)"
        />
        <StatTile
          label="Approved"
          value={handled.filter((h) => h.verdict === "approve").length}
          icon={CheckCircle2}
          accent="var(--viz-good)"
          hint="This session"
        />
        <StatTile
          label="Returned"
          value={handled.filter((h) => h.verdict === "return").length}
          icon={RotateCcw}
          accent="var(--viz-1)"
          hint="Sent back for changes"
        />
        <StatTile
          label="Rejected"
          value={handled.filter((h) => h.verdict === "reject").length}
          icon={XCircle}
          accent="var(--viz-critical)"
          hint="Closed with comments"
        />
      </StatGrid>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projectOptions.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {visible.length} awaiting a decision
        </span>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nothing waiting for approval"
          description="Tasks submitted for approval from the mobile app appear here."
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/tasks">Browse all tasks</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((task) => {
            const projectName =
              task.projectName ?? projectNameOf(task.projectId);
            return (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        <Link
                          href={`/dashboard/tasks/${task.id}`}
                          className="hover:underline"
                        >
                          {task.title}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {projectName} · {task.id}
                      </CardDescription>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        Submitted by
                      </p>
                      {task.creatorId ? (
                        <PersonCell
                          employee={{
                            id: task.creatorId,
                            name:
                              task.people?.find(
                                (person) => person.id === task.creatorId,
                              )?.name ??
                              employeeById(task.creatorId)?.name ??
                              "Unknown",
                            email: "",
                            avatarColor:
                              task.people?.find(
                                (person) => person.id === task.creatorId,
                              )?.avatarColor ?? "#2d5a4c",
                          }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">
                        Assignee
                      </p>
                      {task.assigneeId ? (
                        <PersonCell
                          employee={{
                            id: task.assigneeId,
                            name:
                              task.people?.find(
                                (person) => person.id === task.assigneeId,
                              )?.name ??
                              employeeById(task.assigneeId)?.name ??
                              "Unknown",
                            email: "",
                            avatarColor:
                              task.people?.find(
                                (person) => person.id === task.assigneeId,
                              )?.avatarColor ?? "#2d5a4c",
                          }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div className="flex justify-between border-b py-1">
                      <dt className="text-muted-foreground">Approver</dt>
                      <dd className="font-medium">
                        {task.approverIds?.length
                          ? (task.people?.find(
                              (person) => person.id === task.approverId,
                            )?.name ?? `${task.approverIds.length} approver(s)`)
                          : "Admin"}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <dt className="text-muted-foreground">Due</dt>
                      <dd className="font-medium">
                        {formatDate(task.dueDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <dt className="text-muted-foreground">Submitted</dt>
                      <dd className="font-medium">
                        {relativeToToday(task.createdAt)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b py-1">
                      <dt className="text-muted-foreground">Overdue</dt>
                      <dd className="font-medium">
                        {taskIsOverdue(task) ? "Yes" : "No"}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-[#2d5a4c] hover:bg-[#234539]"
                      onClick={() => open(task, "approve")}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => open(task, "return")}
                    >
                      Return for changes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => open(task, "reject")}
                    >
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {handled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Decided this session</CardTitle>
            <CardDescription>
              Rejected and returned tasks carry your comment back to the
              assignee.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {handled.map(({ task, verdict: v, comment: c }) => (
                <li key={task.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {task.title}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground capitalize">
                      {v === "return" ? "returned" : `${v}d`}
                    </span>
                  </div>
                  {c && (
                    <p className="mt-1 text-xs text-muted-foreground">“{c}”</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={target !== null}
        onOpenChange={(isOpen) => !isOpen && setTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{VERDICT_COPY[verdict].title}</DialogTitle>
            <DialogDescription>{VERDICT_COPY[verdict].body}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="rounded-lg border p-3 text-sm">{target?.title}</p>
            <div className="space-y-2">
              <Label htmlFor="verdict-comment">
                Comment
                {VERDICT_COPY[verdict].needsComment ? "" : " (optional)"}
              </Label>
              <Textarea
                id="verdict-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={
                  verdict === "approve"
                    ? "Anything the assignee should know…"
                    : "Explain what needs to change…"
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              className={
                verdict === "reject"
                  ? "bg-(--viz-critical) text-white hover:bg-(--viz-critical)/90"
                  : "bg-[#2d5a4c] hover:bg-[#234539]"
              }
              onClick={confirm}
              disabled={submitting}
            >
              {submitting ? "Saving…" : VERDICT_COPY[verdict].cta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
