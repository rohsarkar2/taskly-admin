"use client";

import * as React from "react";
import { Download, FileSpreadsheet, FileText, Table2 } from "lucide-react";
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
  EmptyState,
  PageHeader,
  PriorityBadge,
  TaskStatusBadge,
} from "@/components/dashboard/ui-bits";
import {
  activeEmployees,
  employeeById,
  formatDate,
  isOverdue,
  projects,
  projectNameOf,
  tasks,
} from "@/lib/mock-data";
import { ROLES, TASK_STATUSES } from "@/lib/types";

type ReportType = "tasks" | "employees" | "projects";

const REPORT_LABEL: Record<ReportType, string> = {
  tasks: "Task report",
  employees: "Employee report",
  projects: "Project report",
};

export default function ReportsPage() {
  const [reportType, setReportType] = React.useState<ReportType>("tasks");
  const [projectFilter, setProjectFilter] = React.useState("all");
  const [employeeFilter, setEmployeeFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [from, setFrom] = React.useState("2026-06-01");
  const [to, setTo] = React.useState("2026-08-07");

  const filteredTasks = tasks.filter((task) => {
    if (projectFilter !== "all" && task.projectId !== projectFilter)
      return false;
    if (employeeFilter !== "all" && task.assigneeId !== employeeFilter)
      return false;
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    return task.createdAt >= from && task.createdAt <= to;
  });

  const filteredEmployees = activeEmployees.filter(
    (employee) => roleFilter === "all" || employee.role === roleFilter,
  );

  const filteredProjects = projects.filter(
    (project) => projectFilter === "all" || project.id === projectFilter,
  );

  const rowCount =
    reportType === "tasks"
      ? filteredTasks.length
      : reportType === "employees"
        ? filteredEmployees.length
        : filteredProjects.length;

  const exportAs = (format: "PDF" | "Excel" | "CSV") => {
    toast.success(`${REPORT_LABEL[reportType]} queued as ${format}`, {
      description: `${rowCount} rows · ${formatDate(from)} to ${formatDate(to)}. You will get a notification when it is ready.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Build a report from any combination of project, employee, team, date range and status."
      />

      <Card>
        <CardHeader>
          <CardTitle>Report builder</CardTitle>
          <CardDescription>
            The preview below updates as you change the filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report</Label>
              <Select
                value={reportType}
                onValueChange={(v) => setReportType(v as ReportType)}
              >
                <SelectTrigger id="report-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-from">From</Label>
              <Input
                id="report-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-to">To</Label>
              <Input
                id="report-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            {reportType !== "employees" && (
              <div className="space-y-2">
                <Label htmlFor="report-project">Project</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger id="report-project" className="w-full">
                    <SelectValue />
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
              </div>
            )}

            {reportType === "tasks" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="report-employee">Employee</Label>
                  <Select
                    value={employeeFilter}
                    onValueChange={setEmployeeFilter}
                  >
                    <SelectTrigger id="report-employee" className="w-full">
                      <SelectValue />
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="report-status">Task status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="report-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {TASK_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {reportType === "employees" && (
              <div className="space-y-2">
                <Label htmlFor="report-role">Team / role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger id="report-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <span className="text-sm text-muted-foreground">
              {rowCount} rows in this report
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAs("PDF")}
              >
                <FileText data-icon="inline-start" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAs("Excel")}
              >
                <FileSpreadsheet data-icon="inline-start" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAs("CSV")}
              >
                <Table2 data-icon="inline-start" />
                CSV
              </Button>
              <Button
                size="sm"
                className="bg-[#2d5a4c] hover:bg-[#234539]"
                onClick={() => exportAs("PDF")}
              >
                <Download data-icon="inline-start" />
                Generate report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{REPORT_LABEL[reportType]} preview</CardTitle>
          <CardDescription>
            {formatDate(from)} — {formatDate(to)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rowCount === 0 ? (
            <EmptyState
              title="Nothing in this range"
              description="Widen the date range or clear a filter."
            />
          ) : (
            <div className="overflow-x-auto">
              {reportType === "tasks" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="max-w-[18rem] truncate font-medium">
                          {task.title}
                        </TableCell>
                        <TableCell className="text-sm">
                          {projectNameOf(task.projectId)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {employeeById(task.assigneeId)?.name ?? "—"}
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
                          {formatDate(task.createdAt)}
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap">
                          {formatDate(task.dueDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {reportType === "employees" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Assigned</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => {
                      const assigned = tasks.filter(
                        (t) => t.assigneeId === employee.id,
                      );
                      return (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.name}
                            <span className="block text-xs text-muted-foreground">
                              {employee.email}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {employee.role}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {employee.projectIds.length}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {assigned.length}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {
                              assigned.filter((t) => t.status === "Completed")
                                .length
                            }
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap">
                            {employee.joinedAt
                              ? formatDate(employee.joinedAt)
                              : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {reportType === "projects" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Members</TableHead>
                      <TableHead className="text-right">Tasks</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const projectTasks = tasks.filter(
                        (t) => t.projectId === project.id,
                      );
                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {project.status}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {project.memberIds.length}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {projectTasks.length}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {
                              projectTasks.filter(
                                (t) => t.status === "Completed",
                              ).length
                            }
                          </TableCell>
                          <TableCell className="text-right text-xs whitespace-nowrap">
                            {formatDate(project.deadline)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
