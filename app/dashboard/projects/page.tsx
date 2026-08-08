"use client";

import * as React from "react";
import Link from "next/link";
import axios from "axios";
import {
  CheckCircle2,
  FolderKanban,
  MoreHorizontal,
  PauseCircle,
  Plus,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Meter } from "@/components/charts/bar-chart";
import {
  EmptyState,
  PageHeader,
  PriorityBadge,
  ProjectStatusBadge,
  SampleDataNotice,
  StatGrid,
  StatTile,
} from "@/components/dashboard/ui-bits";
import { getErrorMessage } from "@/lib/api/auth";
import {
  toApiProjectStatus,
  toProject,
  toProjects,
} from "@/lib/api/adapters";
import {
  archiveProject,
  createProject,
  deleteProject,
  listProjects,
  unarchiveProject,
  updateProject,
} from "@/lib/api/projects";
import {
  formatDate,
  projects as seedProjects,
  projectPerformance,
  relativeToToday,
} from "@/lib/mock-data";
import {
  PRIORITIES,
  PROJECT_STATUSES,
  type Priority,
  type Project,
  type ProjectStatus,
} from "@/lib/types";

const BLANK_FORM = {
  name: "",
  code: "",
  description: "",
  startDate: "",
  endDate: "",
  priority: "Medium" as Priority,
  tags: "",
  requireTaskApproval: true,
  defaultPriority: "Medium" as Priority,
};

export default function ProjectsPage() {
  const [list, setList] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [reloadKey, setReloadKey] = React.useState(0);

  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | "all">(
    "all",
  );

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [form, setForm] = React.useState(BLANK_FORM);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Project | null>(null);
  /** Set when a delete came back 409 because the project still has tasks. */
  const [forceDeleteTarget, setForceDeleteTarget] =
    React.useState<Project | null>(null);

  React.useEffect(() => {
    const signal = { cancelled: false };

    const timer = setTimeout(
      () => {
        setLoading(true);

        const load = async () => {
          try {
            const result = await listProjects({
              search: query || undefined,
              status: statusFilter,
              limit: 100,
            });
            if (signal.cancelled) return;

            setList(toProjects(result.items));
            setTotal(result.total);
            setUsingSampleData(false);
          } catch (error) {
            if (signal.cancelled) return;
            console.error("Failed to load projects:", error);
            setList(seedProjects);
            setTotal(seedProjects.length);
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
  }, [query, statusFilter, reloadKey]);

  const refresh = () => setReloadKey((key) => key + 1);

  /**
   * The API returns `taskStats` on every project; the fixtures do not, so those
   * fall back to the derived roll-up.
   */
  const statsFor = (project: Project) => {
    if (project.taskStats) return project.taskStats;

    const derived = projectPerformance().find((p) => p.projectId === project.id);
    return {
      total: derived?.total ?? 0,
      completed: derived?.completed ?? 0,
      pending: derived?.pending ?? 0,
      inProgress: 0,
      pendingApproval: 0,
      remaining: derived?.pending ?? 0,
      completionPercentage: derived?.completionRate ?? 0,
    };
  };

  // Sample mode has no server to filter, so the predicates run locally.
  const visible = usingSampleData
    ? list.filter((project) => {
        if (statusFilter !== "all" && project.status !== statusFilter)
          return false;
        return `${project.name} ${project.code} ${project.description}`
          .toLowerCase()
          .includes(query.toLowerCase());
      })
    : list;

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setForm({
      name: project.name,
      code: project.code,
      description: project.description,
      startDate: project.startDate,
      endDate: project.deadline,
      priority: project.priority,
      tags: project.tags.join(", "),
      requireTaskApproval: project.workflow.requireTaskApproval,
      defaultPriority: project.workflow.defaultPriority,
    });
    setFormOpen(true);
  };

  const parseTags = () =>
    form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  const submitForm = async () => {
    if (!form.name.trim()) {
      toast.error("Give the project a name");
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      toast.error("The end date cannot be before the start date");
      return;
    }

    setSaving(true);
    try {
      if (usingSampleData) {
        toast.error("Sample data — connect the projects API to save changes.");
        return;
      }

      if (editing) {
        const { message, data } = await updateProject(editing.id, {
          name: form.name,
          code: form.code || undefined,
          description: form.description,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          priority: form.priority.toLowerCase(),
          tags: parseTags(),
        });

        const updated = data?.project ? toProject(data.project) : null;
        setList((prev) =>
          prev.map((project) =>
            project.id === editing.id
              ? (updated ?? { ...project, name: form.name })
              : project,
          ),
        );
        toast.success(message || `${form.name} updated`);
      } else {
        const { message, data } = await createProject({
          name: form.name,
          code: form.code || undefined,
          description: form.description || undefined,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          priority: form.priority.toLowerCase(),
          tags: parseTags(),
          workflow: {
            requireTaskApproval: form.requireTaskApproval,
            defaultPriority: form.defaultPriority.toLowerCase(),
          },
        });

        if (data?.project) setList((prev) => [toProject(data.project), ...prev]);
        setTotal((count) => count + 1);
        toast.success(message || `${form.name} created`, {
          description: "Add members so they can see it in the mobile app.",
        });
      }

      setFormOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the project."));
    } finally {
      setSaving(false);
    }
  };

  /** Active / On Hold / Completed go through the status field on PUT. */
  const setStatus = async (project: Project, next: ProjectStatus) => {
    if (next === project.status) return;
    const previous = list;

    setList((prev) =>
      prev.map((entry) =>
        entry.id === project.id ? { ...entry, status: next } : entry,
      ),
    );

    if (usingSampleData) {
      toast.success(`${project.name} is now ${next}`, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await updateProject(project.id, {
        status: toApiProjectStatus(next),
      });
      toast.success(message || `${project.name} is now ${next}`, {
        description:
          next === "Completed" ? "Every member has been notified." : undefined,
      });
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not change the status."));
    }
  };

  const toggleArchive = async (project: Project) => {
    const archiving = project.status !== "Archived";
    const previous = list;

    setList((prev) =>
      prev.map((entry) =>
        entry.id === project.id
          ? { ...entry, status: archiving ? "Archived" : "Active" }
          : entry,
      ),
    );

    if (usingSampleData) {
      toast.success(`${project.name} ${archiving ? "archived" : "restored"}`, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = archiving
        ? await archiveProject(project.id)
        : await unarchiveProject(project.id);
      toast.success(
        message || `${project.name} ${archiving ? "archived" : "restored"}`,
      );
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not change the project."));
    }
  };

  const runDelete = async (project: Project, force: boolean) => {
    if (usingSampleData) {
      setList((prev) => prev.filter((entry) => entry.id !== project.id));
      toast.success(`${project.name} deleted`, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message, data } = await deleteProject(project.id, { force });
      setList((prev) => prev.filter((entry) => entry.id !== project.id));
      setTotal((count) => Math.max(0, count - 1));

      const deletedTasks = data?.deletedTasks ?? 0;
      toast.success(message || `${project.name} deleted`, {
        description: deletedTasks
          ? `${deletedTasks} task${deletedTasks === 1 ? "" : "s"} were removed with it.`
          : undefined,
      });
    } catch (error) {
      // 409 means the project still holds tasks; offer the forced delete.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setForceDeleteTarget(project);
        return;
      }
      toast.error(getErrorMessage(error, "Could not delete the project."));
    }
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Projects are created by the admin. Only assigned members can open one from the mobile app."
        action={
          <Button
            size="sm"
            className="bg-[#2d5a4c] hover:bg-[#234539]"
            onClick={openCreate}
          >
            <Plus data-icon="inline-start" />
            New project
          </Button>
        }
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the projects API — showing sample data. Changes will not be saved."
          onRetry={refresh}
        />
      )}

      <StatGrid>
        <StatTile
          label="All Projects"
          value={total || list.length}
          icon={FolderKanban}
        />
        <StatTile
          label="Active"
          value={list.filter((p) => p.status === "Active").length}
          icon={FolderKanban}
          accent="var(--viz-good)"
        />
        <StatTile
          label="On Hold"
          value={list.filter((p) => p.status === "On Hold").length}
          icon={PauseCircle}
          accent="var(--viz-warning)"
        />
        <StatTile
          label="Completed"
          value={list.filter((p) => p.status === "Completed").length}
          icon={CheckCircle2}
          accent="var(--viz-1)"
        />
      </StatGrid>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {PROJECT_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {visible.length} of {total || visible.length}
        </span>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No projects match"
          description="Adjust the filters, or create a new project."
          action={
            <Button size="sm" onClick={openCreate}>
              New project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((project) => {
            const stats = statsFor(project);
            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="hover:underline"
                        >
                          {project.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {project.code}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${project.name}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{project.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/projects/${project.id}`}>
                            Open project
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEdit(project)}>
                          Edit project
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                          Set status
                        </DropdownMenuLabel>
                        {/*
                          Archived is excluded here: it has its own endpoints
                          rather than going through the status field.
                        */}
                        {PROJECT_STATUSES.filter(
                          (status) =>
                            status !== "Archived" && status !== project.status,
                        ).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onSelect={() => setStatus(project, status)}
                          >
                            {status}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => toggleArchive(project)}
                        >
                          {project.status === "Archived"
                            ? "Restore project"
                            : "Archive project"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(project)}
                        >
                          Delete project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {project.description || "No description yet."}
                  </p>

                  <Meter
                    value={stats.completionPercentage}
                    label={`${stats.completed} of ${stats.total} tasks complete`}
                  />

                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border py-2">
                      <dt className="text-[0.65rem] text-muted-foreground">
                        Open
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums">
                        {stats.remaining}
                      </dd>
                    </div>
                    <div className="rounded-lg border py-2">
                      <dt className="text-[0.65rem] text-muted-foreground">
                        In progress
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums">
                        {stats.inProgress}
                      </dd>
                    </div>
                    <div className="rounded-lg border py-2">
                      <dt className="text-[0.65rem] text-muted-foreground">
                        Approval
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums">
                        {stats.pendingApproval}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <ProjectStatusBadge status={project.status} />
                    <PriorityBadge priority={project.priority} />
                    <span className="ml-auto text-xs text-muted-foreground">
                      {project.memberIds.length} members
                    </span>
                  </div>

                  {project.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(project.deadline)} ·{" "}
                      {relativeToToday(project.deadline)}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${editing.name}` : "Create project"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Changes apply to everyone assigned to this project."
                : "Members and leads are assigned after the project is created."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="project-name">
                  Project name <span className="text-(--viz-critical)">*</span>
                </Label>
                <Input
                  id="project-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mobile App"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-code">Code</Label>
                <Input
                  id="project-code"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="MOB"
                  maxLength={8}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                placeholder="What is this project for?"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-start">Start date</Label>
                <Input
                  id="project-start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-end">End date</Label>
                <Input
                  id="project-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-priority">Project priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({ ...form, priority: v as Priority })
                  }
                >
                  <SelectTrigger id="project-priority" className="w-full">
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
              <div className="space-y-2">
                <Label htmlFor="project-tags">Tags</Label>
                <Input
                  id="project-tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="mobile, q3"
                />
                <p className="text-xs text-muted-foreground">
                  Comma separated.
                </p>
              </div>
            </div>

            {!editing && (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium">Workflow</p>
                <div className="flex items-start justify-between gap-4">
                  <Label
                    htmlFor="project-approval"
                    className="text-sm font-normal"
                  >
                    Require task approval
                    <span className="block text-xs text-muted-foreground">
                      Tasks wait for an approver before they can close.
                    </span>
                  </Label>
                  <Switch
                    id="project-approval"
                    checked={form.requireTaskApproval}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, requireTaskApproval: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-default-priority">
                    Default task priority
                  </Label>
                  <Select
                    value={form.defaultPriority}
                    onValueChange={(v) =>
                      setForm({ ...form, defaultPriority: v as Priority })
                    }
                  >
                    <SelectTrigger
                      id="project-default-priority"
                      className="w-full"
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
                <p className="text-xs text-muted-foreground">
                  The remaining workflow rules live on the project&apos;s
                  Workflow tab.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2d5a4c] hover:bg-[#234539]"
              onClick={submitForm}
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create project"}
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
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project. If it still has tasks you
              will be asked to confirm those too. Archive it instead if you only
              want it out of the way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-(--viz-critical) text-white hover:bg-(--viz-critical)/90"
              onClick={() => {
                const target = deleteTarget;
                setDeleteTarget(null);
                if (target) runDelete(target, false);
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forced delete — the server refused because tasks remain */}
      <AlertDialog
        open={forceDeleteTarget !== null}
        onOpenChange={(open) => !open && setForceDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {forceDeleteTarget?.name} still has tasks
            </AlertDialogTitle>
            <AlertDialogDescription>
              The server refused to delete it while tasks remain. Deleting
              anyway also removes every task in the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep the project</AlertDialogCancel>
            <AlertDialogAction
              className="bg-(--viz-critical) text-white hover:bg-(--viz-critical)/90"
              onClick={() => {
                const target = forceDeleteTarget;
                setForceDeleteTarget(null);
                if (target) runDelete(target, true);
              }}
            >
              Delete project and tasks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
