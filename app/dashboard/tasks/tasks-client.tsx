"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ListTodo,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  EmptyState,
  PageHeader,
  PersonCell,
  PriorityBadge,
  SampleDataNotice,
  StatGrid,
  StatTile,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import { getErrorMessage } from "@/lib/api/auth";
import {
  toApiTaskStatus,
  toEmployees,
  toProjects,
  toTasks,
} from "@/lib/api/adapters";
import { listEmployees } from "@/lib/api/employees";
import { listProjects } from "@/lib/api/projects";
import {
  deleteTask,
  listTasks,
  reassignTask,
  updateTaskStatus,
} from "@/lib/api/tasks";
import {
  REFERENCE_TODAY,
  activeEmployees as seedActiveEmployees,
  employeeById,
  formatDate,
  isOverdue,
  projects as seedProjects,
  projectNameOf,
  tasks as seedTasks,
} from "@/lib/mock-data";
import {
  PRIORITIES,
  SETTABLE_TASK_STATUSES,
  type Employee,
  type Priority,
  type Project,
  type Task,
  type TaskStatus,
} from "@/lib/types";

export default function TasksClient() {
  return (
    <React.Suspense fallback={<TasksSkeleton />}>
      <TasksView />
    </React.Suspense>
  );
}

function TasksSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-52" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

type SortKey = "dueDate" | "priority" | "createdAt";

const PRIORITY_RANK: Record<Priority, number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function TasksView() {
  const searchParams = useSearchParams();

  const [list, setList] = React.useState<Task[]>([]);
  const [projectOptions, setProjectOptions] = React.useState<Project[]>([]);
  const [assigneeOptions, setAssigneeOptions] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [reloadKey, setReloadKey] = React.useState(0);

  const [query, setQuery] = React.useState("");
  const [projectFilter, setProjectFilter] = React.useState(
    searchParams.get("project") ?? "all",
  );
  const [statusFilter, setStatusFilter] = React.useState(
    searchParams.get("status") ?? "all",
  );
  const [assigneeFilter, setAssigneeFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState<SortKey>("dueDate");

  const [reassignTarget, setReassignTarget] = React.useState<Task | null>(null);
  const [nextAssignee, setNextAssignee] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<Task | null>(null);

  React.useEffect(() => {
    const signal = { cancelled: false };

    const timer = setTimeout(
      () => {
        setLoading(true);

        const load = async () => {
          try {
            const [result, projectList, employeeList] = await Promise.all([
              listTasks({
                search: query || undefined,
                status:
                  statusFilter === "overdue" || statusFilter === "all"
                    ? undefined
                    : toApiTaskStatus(statusFilter as TaskStatus),
                overdue: statusFilter === "overdue" || undefined,
                projectId: projectFilter,
                assignee: assigneeFilter,
                priority:
                  priorityFilter === "all"
                    ? undefined
                    : priorityFilter.toLowerCase(),
                sortBy: sortBy === "createdAt" ? "createdAt" : sortBy,
                sortOrder: sortBy === "createdAt" ? "desc" : "asc",
                limit: 100,
              }),
              listProjects({ limit: 100 }).catch(() => null),
              listEmployees({ status: "Active", limit: 200 }).catch(() => null),
            ]);
            if (signal.cancelled) return;

            setList(toTasks(result.items));
            setTotal(result.total);
            setProjectOptions(
              projectList ? toProjects(projectList.items) : seedProjects,
            );
            setAssigneeOptions(
              employeeList
                ? toEmployees(employeeList.items)
                : seedActiveEmployees,
            );
            setUsingSampleData(false);
          } catch (error) {
            if (signal.cancelled) return;
            console.error("Failed to load tasks:", error);
            setList(seedTasks);
            setTotal(seedTasks.length);
            setProjectOptions(seedProjects);
            setAssigneeOptions(seedActiveEmployees);
            setUsingSampleData(true);
          } finally {
            if (!signal.cancelled) setLoading(false);
          }
        };

        load();
      },
      query ? 300 : 0,
    );

    return () => {
      signal.cancelled = true;
      clearTimeout(timer);
    };
  }, [
    query,
    statusFilter,
    projectFilter,
    assigneeFilter,
    priorityFilter,
    sortBy,
    reloadKey,
  ]);

  const refresh = () => setReloadKey((key) => key + 1);

  const taskIsOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    if (task.status === "Completed" || task.status === "Rejected") return false;
    return task.dueDate < REFERENCE_TODAY;
  };

  const nameOfAssignee = (task: Task) =>
    (task.assigneeId
      ? (task.people?.find((person) => person.id === task.assigneeId)?.name ??
        assigneeOptions.find((employee) => employee.id === task.assigneeId)
          ?.name ??
        employeeById(task.assigneeId)?.name)
      : undefined) ?? "";

  const visible = React.useMemo(() => {
    const filtered = usingSampleData
      ? list.filter((task) => {
          if (projectFilter !== "all" && task.projectId !== projectFilter)
            return false;
          if (statusFilter === "overdue") {
            if (!isOverdue(task)) return false;
          } else if (statusFilter !== "all" && task.status !== statusFilter) {
            return false;
          }
          if (assigneeFilter !== "all" && task.assigneeId !== assigneeFilter)
            return false;
          if (priorityFilter !== "all" && task.priority !== priorityFilter)
            return false;

          const haystack =
            `${task.title} ${task.id} ${task.projectName ?? projectNameOf(task.projectId)} ${nameOfAssignee(task)}`.toLowerCase();
          return haystack.includes(query.toLowerCase());
        })
      : [...list];

    return filtered.sort((a, b) => {
      if (sortBy === "priority")
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sortBy === "createdAt") return b.createdAt.localeCompare(a.createdAt);
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    list,
    usingSampleData,
    projectFilter,
    statusFilter,
    assigneeFilter,
    priorityFilter,
    query,
    sortBy,
  ]);

  const overdueCount = list.filter(taskIsOverdue).length;

  const clearFilters = () => {
    setQuery("");
    setProjectFilter("all");
    setStatusFilter("all");
    setAssigneeFilter("all");
    setPriorityFilter("all");
  };

  const filtersActive =
    query !== "" ||
    projectFilter !== "all" ||
    statusFilter !== "all" ||
    assigneeFilter !== "all" ||
    priorityFilter !== "all";

  const confirmReassign = async () => {
    if (!reassignTarget || !nextAssignee) return;

    const target = reassignTarget;
    const previous = list;
    const assignee = nextAssignee === "none" ? null : nextAssignee;
    const name =
      assigneeOptions.find((employee) => employee.id === assignee)?.name ??
      "employee";

    setList((prev) =>
      prev.map((t) =>
        t.id === target.id ? { ...t, assigneeId: assignee } : t,
      ),
    );
    setReassignTarget(null);
    setNextAssignee("");

    if (usingSampleData) {
      toast.success(assignee ? `Reassigned to ${name}` : "Task unassigned", {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await reassignTask(target.id, assignee);
      toast.success(
        message || (assignee ? `Reassigned to ${name}` : "Task unassigned"),
      );
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not reassign the task."));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    const target = deleteTarget;
    const previous = list;
    setList((prev) => prev.filter((t) => t.id !== target.id));
    setDeleteTarget(null);

    if (usingSampleData) {
      toast.success("Task deleted", {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await deleteTask(target.id);
      setTotal((count) => Math.max(0, count - 1));
      toast.success(message || "Task deleted");
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not delete the task."));
    }
  };

  const changeStatus = async (task: Task, status: TaskStatus) => {
    const previous = list;
    setList((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status } : t)),
    );

    if (usingSampleData) {
      toast.success(`Task moved to ${status}`, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await updateTaskStatus(task.id, status);
      toast.success(message || `Task moved to ${status}`);
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not update the task."));
    }
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Every task in the organization, across all projects and employees."
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the tasks API — showing sample data. Changes will not be saved."
          onRetry={refresh}
        />
      )}

      <StatGrid>
        <StatTile
          label="All Tasks"
          value={total || list.length}
          icon={ListTodo}
        />
        <StatTile
          label="In Progress"
          value={list.filter((t) => t.status === "In Progress").length}
          icon={Clock}
          accent="var(--viz-1)"
        />
        <StatTile
          label="Completed"
          value={list.filter((t) => t.status === "Completed").length}
          icon={CheckCircle2}
          accent="var(--viz-good)"
        />
        <StatTile
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          accent="var(--viz-critical)"
        />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>All tasks</CardTitle>
          <CardDescription>
            Filter by project, employee, status, priority or due date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search tasks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:max-w-xs"
            />

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-40">
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                {SETTABLE_TASK_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                <SelectItem value="none">Unassigned</SelectItem>
                {assigneeOptions.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortKey)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Sort by due date</SelectItem>
                <SelectItem value="priority">Sort by priority</SelectItem>
                <SelectItem value="createdAt">Sort by newest</SelectItem>
              </SelectContent>
            </Select>

            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {visible.length} of {total || visible.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="No tasks match these filters"
              description="Try widening the project, status or priority filters."
              action={
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="max-w-[18rem]">
                        <Link
                          href={`/dashboard/tasks/${task.id}`}
                          className="block truncate font-medium *:hover:**:text-[#234539] text-[#2d5a4c]"
                        >
                          {task.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {task.projectName ?? projectNameOf(task.projectId)}
                      </TableCell>
                      <TableCell>
                        {task.assigneeId ? (
                          <PersonCell
                            employee={{
                              id: task.assigneeId,
                              name: nameOfAssignee(task) || "Unknown",
                              email: "",
                              avatarColor:
                                task.people?.find(
                                  (person) => person.id === task.assigneeId,
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
                      <TableCell className="text-sm whitespace-nowrap">
                        {task.approverIds?.length
                          ? (task.people?.find(
                              (person) => person.id === task.approverId,
                            )?.name ??
                            employeeById(task.approverId ?? "")?.name ??
                            `${task.approverIds.length} approver(s)`)
                          : "Not required"}
                      </TableCell>
                      <TableCell>
                        <TaskStatusBadge
                          status={task.status}
                          overdue={taskIsOverdue(task)}
                        />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">
                        {formatDate(task.dueDate)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${task.title}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Task actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/tasks/${task.id}`}>
                                Open task
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setReassignTarget(task);
                                setNextAssignee(task.assigneeId ?? "none");
                              }}
                            >
                              Reassign
                            </DropdownMenuItem>
                            {task.status !== "Completed" && (
                              <DropdownMenuItem
                                onSelect={() => changeStatus(task, "Completed")}
                              >
                                Mark completed
                              </DropdownMenuItem>
                            )}
                            {task.status !== "In Progress" && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  changeStatus(task, "In Progress")
                                }
                              >
                                Mark in progress
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteTarget(task)}
                            >
                              Delete task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={reassignTarget !== null}
        onOpenChange={(open) => !open && setReassignTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign task</DialogTitle>
            <DialogDescription className="line-clamp-2">
              {reassignTarget?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="next-assignee">New assignee</Label>
            <Select value={nextAssignee} onValueChange={setNextAssignee}>
              <SelectTrigger id="next-assignee" className="w-full">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {assigneeOptions.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} — {employee.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2d5a4c] hover:bg-[#234539]"
              onClick={confirmReassign}
            >
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.title}” and its activity history will be removed
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-(--viz-critical) text-white hover:bg-(--viz-critical)/90"
              onClick={confirmDelete}
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
