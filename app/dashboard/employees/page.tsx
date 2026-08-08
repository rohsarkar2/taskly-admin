"use client";

import * as React from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  ShieldCheck,
  UserCheck,
  UserCog,
  Users,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmployeeStatusBadge,
  EmptyState,
  PageHeader,
  PersonCell,
  RoleBadge,
  SampleDataNotice,
  StatGrid,
  StatTile,
} from "@/components/dashboard/ui-bits";
import { getErrorMessage } from "@/lib/api/auth";
import { toEmployees } from "@/lib/api/adapters";
import {
  changeEmployeeRole,
  changeEmployeeStatus,
  listEmployees,
  removeEmployee,
} from "@/lib/api/employees";
import { employees as seedEmployees, formatDate, tasks } from "@/lib/mock-data";
import {
  EMPLOYEE_STATUSES,
  ROLES,
  type Employee,
  type EmployeeStatus,
  type Role,
} from "@/lib/types";

export default function EmployeesPage() {
  const [roster, setRoster] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [total, setTotal] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<
    EmployeeStatus | "all"
  >("all");

  const [roleTarget, setRoleTarget] = React.useState<Employee | null>(null);
  const [nextRole, setNextRole] = React.useState<Role>("Team Member");
  const [removeTarget, setRemoveTarget] = React.useState<Employee | null>(null);

  /**
   * Filtering is the server's job, so the fetch is re-run when the filters
   * change — debounced, since `query` updates on every keystroke. In sample
   * mode there is no server, so the same predicates run locally instead.
   */
  const load = React.useCallback(
    async (signal?: { cancelled: boolean }) => {
      try {
        const result = await listEmployees({
          search: query || undefined,
          role: roleFilter,
          status: statusFilter,
          limit: 100,
        });
        if (signal?.cancelled) return;

        setRoster(toEmployees(result.items));
        setTotal(result.total);
        setUsingSampleData(false);
      } catch (error) {
        if (signal?.cancelled) return;
        console.error("Failed to load employees:", error);
        setRoster(seedEmployees);
        setTotal(seedEmployees.length);
        setUsingSampleData(true);
      } finally {
        if (!signal?.cancelled) setLoading(false);
      }
    },
    [query, roleFilter, statusFilter],
  );

  React.useEffect(() => {
    const signal = { cancelled: false };
    const timer = setTimeout(
      () => {
        setLoading(true);
        load(signal);
      },
      query ? 300 : 0,
    );
    return () => {
      signal.cancelled = true;
      clearTimeout(timer);
    };
  }, [load, query]);

  const matchesFilters = (employee: Employee) => {
    if (employee.status === "Pending") return false; // handled on Employee Requests
    if (roleFilter !== "all" && employee.role !== roleFilter) return false;
    if (statusFilter !== "all" && employee.status !== statusFilter)
      return false;
    return `${employee.name} ${employee.email} ${employee.jobTitle ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
  };

  // The server already applied the filters; re-running them locally would be
  // wrong if its matching differs, so only sample mode filters here.
  const visible = usingSampleData
    ? roster.filter(matchesFilters)
    : roster.filter((employee) => employee.status !== "Pending");

  const taskCount = (employeeId: string) =>
    tasks.filter((t) => t.assigneeId === employeeId).length;

  const setStatus = async (employee: Employee, status: EmployeeStatus) => {
    const previous = roster;
    // Optimistic: the row flips immediately and rolls back if the call fails.
    setRoster((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, status } : e)),
    );

    const fallback =
      status === "Active"
        ? `${employee.name} is active again`
        : `${employee.name} was suspended`;

    if (usingSampleData) {
      toast.success(fallback, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await changeEmployeeStatus(employee.id, status);
      toast.success(message || fallback);
    } catch (error) {
      setRoster(previous);
      toast.error(
        getErrorMessage(error, `Could not update ${employee.name}'s status.`),
      );
    }
  };

  const confirmRoleChange = async () => {
    if (!roleTarget) return;

    const target = roleTarget;
    const previous = roster;
    setRoster((prev) =>
      prev.map((e) => (e.id === target.id ? { ...e, role: nextRole } : e)),
    );
    setRoleTarget(null);

    if (usingSampleData) {
      toast.success(`${target.name} is now a ${nextRole}`, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await changeEmployeeRole(target.id, nextRole);
      toast.success(message || `${target.name} is now a ${nextRole}`);
    } catch (error) {
      setRoster(previous);
      toast.error(
        getErrorMessage(error, `Could not change ${target.name}'s role.`),
      );
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;

    const target = removeTarget;
    const previous = roster;
    setRoster((prev) => prev.filter((e) => e.id !== target.id));
    setRemoveTarget(null);

    if (usingSampleData) {
      toast.success(`${target.name} was removed from the organization`, {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await removeEmployee(target.id);
      setTotal((count) => Math.max(0, count - 1));
      toast.success(
        message || `${target.name} was removed from the organization`,
      );
    } catch (error) {
      setRoster(previous);
      toast.error(getErrorMessage(error, `Could not remove ${target.name}.`));
    }
  };

  const active = roster.filter((e) => e.status === "Active");

  return (
    <>
      <PageHeader
        title="Employees"
        description="Everyone who has been approved into the organization."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/requests">Pending requests</Link>
          </Button>
        }
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the employees API — showing sample data. Changes will not be saved."
          onRetry={() => {
            setLoading(true);
            load();
          }}
        />
      )}

      <StatGrid>
        <StatTile
          label="Active Employees"
          value={active.length}
          icon={Users}
          hint="Can sign in from the app"
        />
        <StatTile
          label="Managers"
          value={active.filter((e) => e.role === "Manager").length}
          icon={ShieldCheck}
          accent="var(--viz-6)"
        />
        <StatTile
          label="Team Leads"
          value={active.filter((e) => e.role === "Team Lead").length}
          icon={UserCog}
          accent="var(--viz-3)"
        />
        <StatTile
          label="Team Members"
          value={active.filter((e) => e.role === "Team Member").length}
          icon={UserCheck}
          accent="var(--viz-2)"
        />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <CardDescription>
            Search, change roles, suspend access or remove people from the
            organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters — one row above the table */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search name, email or title…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:max-w-xs"
            />
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v as Role | "all")}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as EmployeeStatus | "all")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {EMPLOYEE_STATUSES.filter((s) => s !== "Pending").map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(query || roleFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
              >
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
              title="No employees match these filters"
              description="Try a different role or status."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Tasks</TableHead>
                    <TableHead className="text-right">Joined</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <PersonCell
                          employee={employee}
                          href={`/dashboard/employees/${employee.id}`}
                          subtitle={employee.jobTitle ?? employee.email}
                        />
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={employee.role} />
                      </TableCell>
                      <TableCell>
                        <EmployeeStatusBadge status={employee.status} />
                      </TableCell>
                      {/*
                        The list endpoint returns neither project membership
                        nor task counts, and both would otherwise read as a
                        real zero for everyone. Show them only for fixtures.
                      */}
                      <TableCell className="text-right tabular-nums">
                        {usingSampleData ? employee.projectIds.length : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {usingSampleData ? taskCount(employee.id) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">
                        {employee.joinedAt
                          ? formatDate(employee.joinedAt)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${employee.name}`}
                            >
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {employee.name}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/employees/${employee.id}`}
                              >
                                View profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setRoleTarget(employee);
                                setNextRole(employee.role);
                              }}
                            >
                              Change role
                            </DropdownMenuItem>
                            {employee.status === "Active" ? (
                              <DropdownMenuItem
                                onSelect={() =>
                                  setStatus(employee, "Suspended")
                                }
                              >
                                Suspend employee
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onSelect={() => setStatus(employee, "Active")}
                              >
                                Activate employee
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setRemoveTarget(employee)}
                            >
                              Remove from organization
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

      {/* Change role */}
      <Dialog
        open={roleTarget !== null}
        onOpenChange={(open) => !open && setRoleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role</DialogTitle>
            <DialogDescription>
              {roleTarget?.name} is currently a {roleTarget?.role}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="next-role">New role</Label>
            <Select
              value={nextRole}
              onValueChange={(v) => setNextRole(v as Role)}
            >
              <SelectTrigger id="next-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-[#2d5a4c] hover:bg-[#234539]"
              onClick={confirmRoleChange}
            >
              Save role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove */}
      <AlertDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removeTarget?.name} from the organization?
            </AlertDialogTitle>
            <AlertDialogDescription>
              They lose access immediately. Their tasks stay in the system but
              become unassigned, so reassign anything in flight first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--viz-critical)] text-white hover:bg-[var(--viz-critical)]/90"
              onClick={confirmRemove}
            >
              Remove employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
