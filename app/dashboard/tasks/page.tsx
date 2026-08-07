"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, ListTodo, MoreHorizontal } from "lucide-react";
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
  StatGrid,
  StatTile,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import {
  activeEmployees,
  employeeById,
  formatDate,
  isOverdue,
  projects,
  projectNameOf,
  tasks as seedTasks,
} from "@/lib/mock-data";
import {
  PRIORITIES,
  TASK_STATUSES,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/types";

export default function TasksPage() {
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

  const [list, setList] = React.useState<Task[]>(seedTasks);
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

  const visible = React.useMemo(() => {
    const filtered = list.filter((task) => {
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

      const haystack = `${task.title} ${task.id} ${projectNameOf(task.projectId)} ${
        employeeById(task.assigneeId)?.name ?? ""
      }`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });

    return filtered.sort((a, b) => {
      if (sortBy === "priority")
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (sortBy === "createdAt") return b.createdAt.localeCompare(a.createdAt);
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [
    list,
    projectFilter,
    statusFilter,
    assigneeFilter,
    priorityFilter,
    query,
    sortBy,
  ]);

  const overdueCount = list.filter(isOverdue).length;

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

  const confirmReassign = () => {
    if (!reassignTarget || !nextAssignee) return;
    setList((prev) =>
      prev.map((t) =>
        t.id === reassignTarget.id ? { ...t, assigneeId: nextAssignee } : t,
      ),
    );
    toast.success(
      `Reassigned to ${employeeById(nextAssignee)?.name ?? "employee"}`,
    );
    setReassignTarget(null);
    setNextAssignee("");
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setList((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    toast.success("Task deleted");
    setDeleteTarget(null);
  };

  const changeStatus = (task: Task, status: TaskStatus) => {
    setList((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status } : t)),
    );
    toast.success(`Task moved to ${status}`);
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Every task in the organization, across all projects and employees."
      />

      <StatGrid>
        <StatTile label="All Tasks" value={list.length} icon={ListTodo} />
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
          {/* Filters — one row above the table */}
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
                {projects.map((project) => (
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
                {TASK_STATUSES.map((status) => (
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
                {activeEmployees.map((employee) => (
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
              {visible.length} of {list.length}
            </span>
          </div>

          {visible.length === 0 ? (
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
                          className="block truncate font-medium hover:underline"
                        >
                          {task.title}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground">
                          {task.id}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {projectNameOf(task.projectId)}
                      </TableCell>
                      <TableCell>
                        <PersonCell
                          employeeId={task.assigneeId}
                          href={`/dashboard/employees/${task.assigneeId}`}
                        />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {task.approverId
                          ? (employeeById(task.approverId)?.name ?? "—")
                          : "Not required"}
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
                                setNextAssignee(task.assigneeId);
                              }}
                            >
                              Reassign
                            </DropdownMenuItem>
                            {task.status !== "Completed" && (
                              <DropdownMenuItem
                                onSelect={() =>
                                  changeStatus(task, "Completed")
                                }
                              >
                                Mark completed
                              </DropdownMenuItem>
                            )}
                            {task.status !== "Blocked" && (
                              <DropdownMenuItem
                                onSelect={() => changeStatus(task, "Blocked")}
                              >
                                Mark blocked
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

      {/* Reassign */}
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
                {activeEmployees.map((employee) => (
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

      {/* Delete */}
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
