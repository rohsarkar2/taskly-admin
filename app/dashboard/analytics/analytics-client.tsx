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
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  PageHeader,
  ProgressCell,
  SampleDataNotice,
  StatGrid,
  StatTile,
} from "@/components/dashboard/ui-bits";
import {
  getAnalyticsOverview,
  getEmployeeAnalytics,
  getProjectAnalytics,
  getTaskAnalytics,
  getTeamAnalytics,
} from "@/lib/api/analytics";
import type {
  AnalyticsOverviewData,
  EmployeeAnalyticsRow,
  ProjectAnalyticsRow,
  TeamAnalyticsRow,
  TrendPoint,
} from "@/lib/api/analytics";
import { formatDate, formatShortDate } from "@/lib/mock-data";

const TREND_DAYS = 30;

export default function AnalyticsClient() {
  const [overview, setOverview] = React.useState<AnalyticsOverviewData | null>(
    null,
  );
  const [projectRows, setProjectRows] = React.useState<ProjectAnalyticsRow[]>(
    [],
  );
  const [employeeRows, setEmployeeRows] = React.useState<EmployeeAnalyticsRow[]>(
    [],
  );
  const [teams, setTeams] = React.useState<TeamAnalyticsRow[]>([]);
  const [trend, setTrend] = React.useState<TrendPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [unavailable, setUnavailable] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const signal = { cancelled: false };

    const load = async () => {
      try {
        const [head, projects, employees, teamRows, tasks] = await Promise.all([
          getAnalyticsOverview(),
          getProjectAnalytics({ limit: 100 }).catch(() => null),
          getEmployeeAnalytics({ limit: 100 }).catch(() => null),
          getTeamAnalytics().catch(() => null),
          getTaskAnalytics({ days: TREND_DAYS }).catch(() => null),
        ]);
        if (signal.cancelled) return;

        setOverview(head.data);
        setProjectRows(projects?.data.projects ?? []);
        setEmployeeRows(employees?.data.employees ?? []);
        setTeams(teamRows?.data.teams ?? []);
        setTrend(tasks?.data.trend ?? []);
        setUnavailable(false);
      } catch (error) {
        if (signal.cancelled) return;
        console.error("Failed to load analytics:", error);
        setUnavailable(true);
      } finally {
        if (!signal.cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      signal.cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  if (loading) return <AnalyticsSkeleton />;

  if (unavailable || !overview) {
    return (
      <>
        <PageHeader
          title="Analytics"
          description="Productivity and delivery across the whole organization."
        />
        <SampleDataNotice
          message="Could not reach the analytics API."
          onRetry={refresh}
        />
        <EmptyState
          title="Analytics are unavailable"
          description="The figures come straight from the server, so there is nothing to show until it responds."
        />
      </>
    );
  }

  const { employees: employeeCounts, projects: projectCounts, tasks } = overview;

  const openWork = tasks.pending + tasks.inProgress + tasks.pendingApproval;
  const rankedProjects = [...projectRows].sort(
    (a, b) => b.completionPercentage - a.completionPercentage,
  );
  const topPerformers = [...employeeRows]
    .sort((a, b) => b.completedTasks - a.completedTasks)
    .slice(0, 8);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Productivity and delivery across the whole organization."
      />

      <StatGrid>
        <StatTile
          label="Completion Rate"
          value={`${Math.round(tasks.completionRate)}%`}
          hint={`${tasks.completed} of ${tasks.totalTasks} tasks`}
        />
        <StatTile
          label="Open Work"
          value={openWork}
          hint={`${tasks.blocked} blocked · ${tasks.returned} returned`}
          accent="var(--viz-2)"
        />
        <StatTile
          label="Overdue"
          value={tasks.overdue}
          hint="Past due and not closed"
          accent="var(--viz-critical)"
        />
        <StatTile
          label="Active Employees"
          value={employeeCounts.activeEmployees}
          hint={`${employeeCounts.managers} managers · ${employeeCounts.teamLeads} leads`}
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

        <TabsContent value="organization" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tasks created vs completed</CardTitle>
              <CardDescription>
                Daily volume over the last {TREND_DAYS} days. The gap is the
                backlog the organization is carrying.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trend.length === 0 ? (
                <EmptyState title="No trend data for this period" />
              ) : (
                <LineChart
                  categories={trend.map((p) => formatShortDate(p.date))}
                  series={[
                    { label: "Created", values: trend.map((p) => p.created) },
                    {
                      label: "Completed",
                      values: trend.map((p) => p.completed),
                    },
                  ]}
                />
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Task status distribution</CardTitle>
                <CardDescription>
                  Where the organization&apos;s {tasks.totalTasks} tasks sit
                  right now.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StackedBar
                  segments={[
                    { label: "To Do", value: tasks.pending },
                    { label: "In Progress", value: tasks.inProgress },
                    { label: "Pending Approval", value: tasks.pendingApproval },
                    { label: "Returned", value: tasks.returned },
                    { label: "Blocked", value: tasks.blocked },
                    { label: "Completed", value: tasks.completed },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by priority</CardTitle>
                <CardDescription>
                  How the open and closed work is weighted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HBarChart
                  tableColumns={["Priority", "Tasks"]}
                  data={["urgent", "high", "medium", "low"].map((key) => ({
                    label: key[0].toUpperCase() + key.slice(1),
                    value: tasks.byPriority?.[key] ?? 0,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Headcount by role</CardTitle>
                <CardDescription>
                  {employeeCounts.activeEmployees} active of{" "}
                  {employeeCounts.totalEmployees} employees.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HBarChart
                  tableColumns={["Role", "People"]}
                  data={[
                    { label: "Team Members", value: employeeCounts.teamMembers },
                    { label: "Team Leads", value: employeeCounts.teamLeads },
                    { label: "Managers", value: employeeCounts.managers },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projects by status</CardTitle>
                <CardDescription>
                  {projectCounts.totalProjects} projects in the organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HBarChart
                  tableColumns={["Status", "Projects"]}
                  data={[
                    { label: "Active", value: projectCounts.activeProjects },
                    { label: "On Hold", value: projectCounts.onHoldProjects },
                    {
                      label: "Completed",
                      value: projectCounts.completedProjects,
                    },
                    { label: "Archived", value: projectCounts.archivedProjects },
                  ]}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="mt-4 space-y-6">
          {employeeRows.length === 0 ? (
            <EmptyState title="No employee analytics yet" />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Employee productivity</CardTitle>
                  <CardDescription>
                    Completed against still-open work for the busiest employees.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GroupedBarChart
                    seriesLabels={["Completed", "Open"]}
                    rows={topPerformers.map((row) => ({
                      label: row.name,
                      values: [row.completedTasks, row.assignedWorkload],
                    }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Productivity detail</CardTitle>
                  <CardDescription>
                    Productivity score is the completion rate minus half the
                    overdue rate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead className="text-right">Assigned</TableHead>
                          <TableHead className="text-right">Completed</TableHead>
                          <TableHead className="text-right">Open</TableHead>
                          <TableHead className="text-right">Overdue</TableHead>
                          <TableHead className="text-right">Avg. time</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead>Completion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeeRows.map((row) => (
                          <TableRow key={row.employeeId}>
                            <TableCell>
                              <Link
                                href={`/dashboard/employees/${row.employeeId}`}
                                className="font-medium hover:underline"
                              >
                                {row.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.totalTasks}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.completedTasks}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.assignedWorkload}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.overdueTasks}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.averageCompletionHours
                                ? `${Math.round((row.averageCompletionHours / 24) * 10) / 10}d`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {Math.round(row.productivityScore)}
                            </TableCell>
                            <TableCell>
                              <ProgressCell
                                value={Math.round(row.completionRate)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="teams" className="mt-4 space-y-6">
          {teams.length === 0 ? (
            <EmptyState
              title="No team analytics yet"
              description="Teams appear once projects have members with tasks."
            />
          ) : (
            teams.map((team) => (
              <Card key={team.projectId}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle>
                        <Link
                          href={`/dashboard/projects/${team.projectId}`}
                          className="hover:underline"
                        >
                          {team.projectName}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {team.completedTasks} of {team.totalTasks} tasks
                        complete · {team.openTasks} open
                      </CardDescription>
                    </div>
                    <div className="w-40">
                      <ProgressCell
                        value={Math.round(team.completionPercentage)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {team.members.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No members with tasks on this project.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead className="text-right">Tasks</TableHead>
                            <TableHead className="text-right">Done</TableHead>
                            <TableHead className="text-right">Open</TableHead>
                            <TableHead className="text-right">
                              Workload
                            </TableHead>
                            <TableHead>Completion</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {team.members.map((member) => (
                            <TableRow key={member.employeeId}>
                              <TableCell>
                                <Link
                                  href={`/dashboard/employees/${member.employeeId}`}
                                  className="font-medium hover:underline"
                                >
                                  {member.name}
                                </Link>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {member.totalTasks}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {member.completedTasks}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {member.openTasks}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {Math.round(member.workloadShare)}%
                              </TableCell>
                              <TableCell>
                                <ProgressCell
                                  value={Math.round(member.completionRate)}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="projects" className="mt-4 space-y-6">
          {projectRows.length === 0 ? (
            <EmptyState title="No project analytics yet" />
          ) : (
            <>
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
                    data={rankedProjects.map((row) => ({
                      label: row.name,
                      value: Math.round(row.completionPercentage),
                      meta: `${row.completedTasks}/${row.totalTasks} tasks · ${row.memberCount ?? 0} members`,
                    }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project performance</CardTitle>
                  <CardDescription>
                    Estimated completion extrapolates from the observed rate,
                    and is blank until a task has closed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead className="text-right">Members</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                          <TableHead className="text-right">Blocked</TableHead>
                          <TableHead className="text-right">Overdue</TableHead>
                          <TableHead className="text-right">Due</TableHead>
                          <TableHead className="text-right">Est. done</TableHead>
                          <TableHead>Completion</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rankedProjects.map((row) => (
                          <TableRow key={row.projectId}>
                            <TableCell>
                              <Link
                                href={`/dashboard/projects/${row.projectId}`}
                                className="font-medium hover:underline"
                              >
                                {row.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.memberCount ?? 0}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.remainingTasks}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.blockedTasks}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.overdueTasks}
                            </TableCell>
                            <TableCell className="text-right text-xs whitespace-nowrap">
                              {formatDate(row.endDate?.slice(0, 10))}
                            </TableCell>
                            <TableCell className="text-right text-xs whitespace-nowrap">
                              {formatDate(
                                row.estimatedCompletionDate?.slice(0, 10),
                              )}
                            </TableCell>
                            <TableCell>
                              <ProgressCell
                                value={Math.round(row.completionPercentage)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
