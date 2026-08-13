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
import { Badge } from "@/components/ui/badge";
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
  EmptyState,
  PageHeader,
  SampleDataNotice,
} from "@/components/dashboard/ui-bits";
import { getErrorMessage } from "@/lib/api/auth";
import { toProjects, toEmployees } from "@/lib/api/adapters";
import { listProjects } from "@/lib/api/projects";
import { listEmployees } from "@/lib/api/employees";
import {
  downloadReport,
  getReport,
  getReportCatalog,
} from "@/lib/api/reports";
import type {
  ReportData,
  ReportDefinition,
  ReportFormat,
  ReportType,
} from "@/lib/api/reports";
import { formatDateTime } from "@/lib/mock-data";
import type { Employee, Project } from "@/lib/types";
import { PRIORITIES, SETTABLE_TASK_STATUSES } from "@/lib/types";

const DEFAULT_REPORTS: ReportDefinition[] = [
  { type: "tasks", title: "Task Report", columns: [], filters: [] },
  { type: "projects", title: "Project Report", columns: [], filters: [] },
  { type: "employees", title: "Employee Report", columns: [], filters: [] },
  { type: "teams", title: "Team Report", columns: [], filters: ["projectId"] },
];

export default function ReportsClient() {
  const [catalog, setCatalog] = React.useState<ReportDefinition[]>([]);
  const [maxRows, setMaxRows] = React.useState(5000);
  const [catalogUnavailable, setCatalogUnavailable] = React.useState(false);

  const [projectOptions, setProjectOptions] = React.useState<Project[]>([]);
  const [employeeOptions, setEmployeeOptions] = React.useState<Employee[]>([]);

  const [reportType, setReportType] = React.useState<ReportType>("tasks");
  const [projectFilter, setProjectFilter] = React.useState("all");
  const [assigneeFilter, setAssigneeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [dueAfter, setDueAfter] = React.useState("");
  const [dueBefore, setDueBefore] = React.useState("");
  const [search, setSearch] = React.useState("");

  const [report, setReport] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloading, setDownloading] = React.useState<ReportFormat | null>(
    null,
  );

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [cat, projects, employees] = await Promise.allSettled([
        getReportCatalog(),
        listProjects({ limit: 100 }),
        listEmployees({ status: "Active", limit: 200 }),
      ]);
      if (cancelled) return;

      if (cat.status === "fulfilled") {
        setCatalog(cat.value.data.reports ?? DEFAULT_REPORTS);
        setMaxRows(cat.value.data.maxRows ?? 5000);
        setCatalogUnavailable(false);
      } else {
        console.error("Failed to load the report catalog:", cat.reason);
        setCatalog(DEFAULT_REPORTS);
        setCatalogUnavailable(true);
      }

      if (projects.status === "fulfilled")
        setProjectOptions(toProjects(projects.value.items));
      if (employees.status === "fulfilled")
        setEmployeeOptions(toEmployees(employees.value.items));
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const definition = catalog.find((entry) => entry.type === reportType);
  const accepts = (filter: string) =>
    definition?.filters?.includes(filter) ??
    (reportType === "tasks" ||
      (reportType === "teams" && filter === "projectId"));

  const filters = () => ({
    projectId: projectFilter,
    assignee: assigneeFilter,
    status: statusFilter === "all" ? undefined : statusFilter.toLowerCase(),
    priority:
      priorityFilter === "all" ? undefined : priorityFilter.toLowerCase(),
    dueAfter: dueAfter || undefined,
    dueBefore: dueBefore || undefined,
    search: search || undefined,
  });

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await getReport(reportType, filters());
      setReport(data);
      if (data.truncated) {
        toast.warning(`Showing the first ${maxRows} rows`, {
          description: "Narrow the filters to see the rest.",
        });
      }
    } catch (error) {
      setReport(null);
      toast.error(getErrorMessage(error, "Could not generate the report."));
    } finally {
      setLoading(false);
    }
  };

  const download = async (format: Exclude<ReportFormat, "json">) => {
    setDownloading(format);
    try {
      const filename = await downloadReport(reportType, format, filters());
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Could not download the report. Generation is rate-limited to 30 per 10 minutes.",
        ),
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Build a report from any combination of project, employee, status and date range."
      />

      {catalogUnavailable && (
        <SampleDataNotice message="Could not load the report catalog — showing the default report types." />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Report builder</CardTitle>
          <CardDescription>
            Generate a preview on screen, or download the same rows as a file.
            Capped at {maxRows.toLocaleString()} rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report</Label>
              <Select
                value={reportType}
                onValueChange={(v) => {
                  setReportType(v as ReportType);
                  setReport(null);
                }}
              >
                <SelectTrigger id="report-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((entry) => (
                    <SelectItem key={entry.type} value={entry.type}>
                      {entry.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {accepts("projectId") && (
              <div className="space-y-2">
                <Label htmlFor="report-project">Project</Label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger id="report-project" className="w-full">
                    <SelectValue />
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
              </div>
            )}

            {accepts("assignee") && (
              <div className="space-y-2">
                <Label htmlFor="report-assignee">Assignee</Label>
                <Select
                  value={assigneeFilter}
                  onValueChange={setAssigneeFilter}
                >
                  <SelectTrigger id="report-assignee" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All employees</SelectItem>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {employeeOptions.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {accepts("status") && (
              <div className="space-y-2">
                <Label htmlFor="report-status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="report-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {SETTABLE_TASK_STATUSES.map((status) => (
                      <SelectItem
                        key={status}
                        value={status.toLowerCase().replace(/\s+/g, "_")}
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {accepts("priority") && (
              <div className="space-y-2">
                <Label htmlFor="report-priority">Priority</Label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger id="report-priority" className="w-full">
                    <SelectValue />
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
              </div>
            )}

            {accepts("dueAfter") && (
              <div className="space-y-2">
                <Label htmlFor="report-from">Due after</Label>
                <Input
                  id="report-from"
                  type="date"
                  value={dueAfter}
                  onChange={(e) => setDueAfter(e.target.value)}
                />
              </div>
            )}

            {accepts("dueBefore") && (
              <div className="space-y-2">
                <Label htmlFor="report-to">Due before</Label>
                <Input
                  id="report-to"
                  type="date"
                  value={dueBefore}
                  onChange={(e) => setDueBefore(e.target.value)}
                />
              </div>
            )}

            {accepts("search") && (
              <div className="space-y-2">
                <Label htmlFor="report-search">Search</Label>
                <Input
                  id="report-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Title or description"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t pt-4">
            <Button
              size="sm"
              className="bg-[#2d5a4c] hover:bg-[#234539]"
              onClick={generate}
              disabled={loading}
            >
              <Download data-icon="inline-start" />
              {loading ? "Generating…" : "Generate preview"}
            </Button>

            <div className="ml-auto flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => download("csv")}
                disabled={downloading !== null}
              >
                <Table2 data-icon="inline-start" />
                {downloading === "csv" ? "Preparing…" : "CSV"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => download("excel")}
                disabled={downloading !== null}
              >
                <FileSpreadsheet data-icon="inline-start" />
                {downloading === "excel" ? "Preparing…" : "Excel"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => download("pdf")}
                disabled={downloading !== null}
              >
                <FileText data-icon="inline-start" />
                {downloading === "pdf" ? "Preparing…" : "PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>{definition?.title ?? "Report"} preview</CardTitle>
              <CardDescription>
                {report
                  ? `${report.rowCount.toLocaleString()} rows · generated ${formatDateTime(report.generatedAt)}`
                  : "Generate a preview to see the rows here."}
              </CardDescription>
            </div>
            {report?.truncated && (
              <Badge variant="outline">Truncated at {maxRows}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !report ? (
            <EmptyState
              title="No preview yet"
              description="Pick your filters and generate the report."
              action={
                <Button size="sm" onClick={generate}>
                  Generate preview
                </Button>
              }
            />
          ) : report.rows.length === 0 ? (
            <EmptyState
              title="No rows match"
              description="Widen the filters and try again."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {report.columns.map((column) => (
                      <TableHead key={column.key}>{column.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.rows.map((row, index) => (
                    <TableRow key={index}>
                      {report.columns.map((column) => (
                        <TableCell key={column.key} className="text-sm">
                          {renderCell(row[column.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function renderCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);

  if (typeof value === "string") {
    return /^\d{4}-\d{2}-\d{2}T/.test(value) ? formatDateTime(value) : value;
  }

  return JSON.stringify(value);
}
