"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GroupedBarChart,
  HBarChart,
  StackedBar,
} from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import {
  PageHeader,
  ProgressCell,
  ProjectStatusBadge,
  RoleBadge,
  StatGrid,
  StatTile,
} from "@/components/dashboard/ui-bits";
import {
  employeeProductivity,
  monthlyTaskVolume,
  organizationOverview,
  projectPerformance,
  teamPerformance,
} from "@/lib/mock-data";

export default function AnalyticsPage() {
  const overview = organizationOverview();
  const productivity = employeeProductivity();
  const teams = teamPerformance();
  const projectStats = projectPerformance();

  const completionRate = overview.totalTasks
    ? Math.round((overview.completed / overview.totalTasks) * 100)
    : 0;

  /** Top performers, capped so the chart stays readable. */
  const topPerformers = productivity.slice(0, 8);

  const rankedProjects = [...projectStats].sort(
    (a, b) => b.completionRate - a.completionRate,
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Productivity and delivery across the whole organization."
      />

      <StatGrid>
        <StatTile
          label="Completion Rate"
          value={`${completionRate}%`}
          hint={`${overview.completed} of ${overview.totalTasks} tasks`}
        />
        <StatTile
          label="Open Work"
          value={
            overview.todo + overview.inProgress + overview.pendingApproval
          }
          hint={`${overview.blocked} blocked`}
          accent="var(--viz-2)"
        />
        <StatTile
          label="Overdue"
          value={overview.overdue}
          hint="Past due and not closed"
          accent="var(--viz-critical)"
        />
        <StatTile
          label="Active Employees"
          value={overview.activeEmployees}
          hint={`${overview.managers} managers · ${overview.teamLeads} leads`}
          accent="var(--viz-3)"
        />
      </StatGrid>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        {/* Organization ---------------------------------------------------- */}
        <TabsContent value="organization" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly task completion</CardTitle>
              <CardDescription>
                Created against completed, month by month. The gap is the
                backlog the organization is carrying.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LineChart
                categories={monthlyTaskVolume.map((m) => m.month)}
                series={[
                  {
                    label: "Created",
                    values: monthlyTaskVolume.map((m) => m.created),
                  },
                  {
                    label: "Completed",
                    values: monthlyTaskVolume.map((m) => m.completed),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task status distribution</CardTitle>
                <CardDescription>
                  Where the organization&apos;s {overview.totalTasks} tasks sit
                  right now.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StackedBar
                  segments={[
                    { label: "To Do", value: overview.todo },
                    { label: "In Progress", value: overview.inProgress },
                    {
                      label: "Pending Approval",
                      value: overview.pendingApproval,
                    },
                    { label: "Blocked", value: overview.blocked },
                    { label: "Completed", value: overview.completed },
                    { label: "Rejected", value: overview.rejected },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending vs completed</CardTitle>
                <CardDescription>
                  Open work compared with delivered work.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HBarChart
                  tableColumns={["Bucket", "Tasks"]}
                  data={[
                    { label: "Completed", value: overview.completed },
                    {
                      label: "Pending",
                      value:
                        overview.todo +
                        overview.inProgress +
                        overview.pendingApproval +
                        overview.blocked,
                    },
                    { label: "Overdue", value: overview.overdue },
                    { label: "Rejected", value: overview.rejected },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees ------------------------------------------------------- */}
        <TabsContent value="employees" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee productivity</CardTitle>
              <CardDescription>
                Completed against still-open tasks for the eight busiest
                employees.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GroupedBarChart
                seriesLabels={["Completed", "Pending"]}
                rows={topPerformers.map((p) => ({
                  label: p.name,
                  values: [p.completed, p.pending],
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productivity detail</CardTitle>
              <CardDescription>
                Average completion time is measured from task creation to
                approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Assigned</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead className="text-right">Avg. time</TableHead>
                      <TableHead>Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productivity.map((p) => (
                      <TableRow key={p.employeeId}>
                        <TableCell>
                          <Link
                            href={`/dashboard/employees/${p.employeeId}`}
                            className="font-medium hover:underline"
                          >
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={p.role} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.assigned}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.completed}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.pending}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.overdue}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.avgCompletionDays
                            ? `${p.avgCompletionDays}d`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <ProgressCell value={p.completionRate} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams ----------------------------------------------------------- */}
        <TabsContent value="teams" className="mt-4 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Completion rate by role</CardTitle>
                <CardDescription>
                  Share of assigned tasks each role has closed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HBarChart
                  valueSuffix="%"
                  max={100}
                  tableColumns={["Role", "Completion rate"]}
                  data={teams.map((t) => ({
                    label: t.role,
                    value: t.completionRate,
                    meta: `${t.completed} of ${t.assigned} tasks · ${t.headcount} people`,
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workload by role</CardTitle>
                <CardDescription>
                  Average number of tasks per person.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HBarChart
                  tableColumns={["Role", "Avg. tasks per person"]}
                  data={teams.map((t) => ({
                    label: t.role,
                    value: t.avgWorkload,
                    meta: `${t.pending} open · ${t.overdue} overdue`,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Headcount</TableHead>
                      <TableHead className="text-right">Assigned</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead className="text-right">Avg. load</TableHead>
                      <TableHead>Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((t) => (
                      <TableRow key={t.role}>
                        <TableCell className="font-medium">{t.role}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.headcount}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.assigned}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.completed}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.pending}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.overdue}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.avgWorkload}
                        </TableCell>
                        <TableCell>
                          <ProgressCell value={t.completionRate} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects -------------------------------------------------------- */}
        <TabsContent value="projects" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects ranked by completion</CardTitle>
              <CardDescription>
                Percentage of tasks closed in each project.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HBarChart
                valueSuffix="%"
                max={100}
                tableColumns={["Project", "Completion"]}
                data={rankedProjects.map((p) => ({
                  label: p.name,
                  value: p.completionRate,
                  meta: `${p.completed}/${p.total} tasks · ${p.members} members`,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project performance</CardTitle>
              <CardDescription>
                Delays are counted as tasks past their due date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Members</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead className="text-right">Deadline</TableHead>
                      <TableHead>Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedProjects.map((p) => (
                      <TableRow key={p.projectId}>
                        <TableCell>
                          <Link
                            href={`/dashboard/projects/${p.projectId}`}
                            className="font-medium hover:underline"
                          >
                            {p.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ProjectStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.members}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.pending}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {p.overdue}
                        </TableCell>
                        <TableCell className="text-right text-xs whitespace-nowrap">
                          {deadlineLabel(p.daysToDeadline)}
                        </TableCell>
                        <TableCell>
                          <ProgressCell value={p.completionRate} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

/** `in 21 days` / `38 days ago`, measured from the reference date. */
function deadlineLabel(days: number): string {
  if (days === 0) return "today";
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}
