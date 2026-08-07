"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, FolderKanban, MoreHorizontal, PauseCircle, Plus } from "lucide-react";
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
  AvatarStack,
  EmptyState,
  PageHeader,
  ProjectStatusBadge,
  StatGrid,
  StatTile,
} from "@/components/dashboard/ui-bits";
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
  key: "",
  description: "",
  deadline: "",
  defaultPriority: "Medium" as Priority,
  approvalRequired: true,
};

export default function ProjectsPage() {
  const [list, setList] = React.useState<Project[]>(seedProjects);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ProjectStatus | "all">(
    "all",
  );

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [form, setForm] = React.useState(BLANK_FORM);
  const [deleteTarget, setDeleteTarget] = React.useState<Project | null>(null);

  const stats = React.useMemo(() => projectPerformance(), []);
  const rateOf = (projectId: string) =>
    stats.find((s) => s.projectId === projectId)?.completionRate ?? 0;
  const totalsOf = (projectId: string) =>
    stats.find((s) => s.projectId === projectId);

  const visible = list.filter((project) => {
    if (statusFilter !== "all" && project.status !== statusFilter) return false;
    return `${project.name} ${project.key} ${project.description}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const openCreate = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setFormOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setForm({
      name: project.name,
      key: project.key,
      description: project.description,
      deadline: project.deadline,
      defaultPriority: project.workflow.defaultPriority,
      approvalRequired: project.workflow.approvalRequired,
    });
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!form.name.trim()) {
      toast.error("Give the project a name");
      return;
    }

    if (editing) {
      setList((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                name: form.name,
                key: form.key || p.key,
                description: form.description,
                deadline: form.deadline || p.deadline,
                workflow: {
                  ...p.workflow,
                  defaultPriority: form.defaultPriority,
                  approvalRequired: form.approvalRequired,
                },
              }
            : p,
        ),
      );
      toast.success(`${form.name} updated`);
    } else {
      const id = `p-new-${list.length + 1}`;
      setList((prev) => [
        {
          id,
          name: form.name,
          key: form.key || form.name.slice(0, 3).toUpperCase(),
          description: form.description,
          status: "Active",
          startDate: new Date().toISOString().slice(0, 10),
          deadline: form.deadline || "2026-12-31",
          memberIds: [],
          leadIds: [],
          managerIds: [],
          workflow: {
            approvalRequired: form.approvalRequired,
            autoApprove: !form.approvalRequired,
            approvers: ["Team Lead", "Manager"],
            adminCanApprove: true,
            defaultPriority: form.defaultPriority,
          },
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
      toast.success(`${form.name} created`, {
        description: "Add members so they can see it in the mobile app.",
      });
    }

    setFormOpen(false);
  };

  const setStatus = (project: Project, status: ProjectStatus) => {
    setList((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, status } : p)),
    );
    toast.success(`${project.name} is now ${status}`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setList((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    toast.success(`${deleteTarget.name} deleted`);
    setDeleteTarget(null);
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

      <StatGrid>
        <StatTile
          label="All Projects"
          value={list.length}
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
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {visible.length} of {list.length}
        </span>
      </div>

      {visible.length === 0 ? (
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
            const totals = totalsOf(project.id);
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
                        {project.key}
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
                        {project.status !== "Archived" ? (
                          <DropdownMenuItem
                            onSelect={() => setStatus(project, "Archived")}
                          >
                            Archive project
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => setStatus(project, "Active")}
                          >
                            Restore project
                          </DropdownMenuItem>
                        )}
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
                    {project.description}
                  </p>

                  <Meter
                    value={rateOf(project.id)}
                    label={`${totals?.completed ?? 0} of ${totals?.total ?? 0} tasks complete`}
                  />

                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg border py-2">
                      <dt className="text-[0.65rem] text-muted-foreground">
                        Open
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums">
                        {totals?.pending ?? 0}
                      </dd>
                    </div>
                    <div className="rounded-lg border py-2">
                      <dt className="text-[0.65rem] text-muted-foreground">
                        Overdue
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums">
                        {totals?.overdue ?? 0}
                      </dd>
                    </div>
                    <div className="rounded-lg border py-2">
                      <dt className="text-[0.65rem] text-muted-foreground">
                        Blocked
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums">
                        {totals?.blocked ?? 0}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <AvatarStack employeeIds={project.memberIds} />
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Deadline {formatDate(project.deadline)} ·{" "}
                    {relativeToToday(project.deadline)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
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
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mobile App"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-key">Key</Label>
                <Input
                  id="project-key"
                  value={form.key}
                  onChange={(e) =>
                    setForm({ ...form, key: e.target.value.toUpperCase() })
                  }
                  placeholder="MOB"
                  maxLength={5}
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
                <Label htmlFor="project-deadline">Deadline</Label>
                <Input
                  id="project-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({ ...form, deadline: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-priority">Default priority</Label>
                <Select
                  value={form.defaultPriority}
                  onValueChange={(v) =>
                    setForm({ ...form, defaultPriority: v as Priority })
                  }
                >
                  <SelectTrigger id="project-priority" className="w-full">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-approval">Task approval</Label>
              <Select
                value={form.approvalRequired ? "required" : "auto"}
                onValueChange={(v) =>
                  setForm({ ...form, approvalRequired: v === "required" })
                }
              >
                <SelectTrigger id="project-approval" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="required">
                    Approval required before a task starts
                  </SelectItem>
                  <SelectItem value="auto">
                    Auto-approve — tasks start immediately
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Fine-grained approver rules live on the project&apos;s Workflow
                tab.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2d5a4c] hover:bg-[#234539]"
              onClick={submitForm}
            >
              {editing ? "Save changes" : "Create project"}
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
              This removes the project and every task inside it. Archive it
              instead if you only want it out of the way.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--viz-critical)] text-white hover:bg-[var(--viz-critical)]/90"
              onClick={confirmDelete}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
