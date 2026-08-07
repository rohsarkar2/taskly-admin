"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, ShieldCheck, UserCheck, UserCog, Users } from "lucide-react";
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
import {
  EmployeeStatusBadge,
  EmptyState,
  PageHeader,
  PersonCell,
  RoleBadge,
  StatGrid,
  StatTile,
} from "@/components/dashboard/ui-bits";
import {
  employees as seedEmployees,
  formatDate,
  tasks,
} from "@/lib/mock-data";
import {
  EMPLOYEE_STATUSES,
  ROLES,
  type Employee,
  type EmployeeStatus,
  type Role,
} from "@/lib/types";

export default function EmployeesPage() {
  const [roster, setRoster] = React.useState<Employee[]>(seedEmployees);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<EmployeeStatus | "all">(
    "all",
  );

  const [roleTarget, setRoleTarget] = React.useState<Employee | null>(null);
  const [nextRole, setNextRole] = React.useState<Role>("Team Member");
  const [removeTarget, setRemoveTarget] = React.useState<Employee | null>(null);

  const visible = roster.filter((employee) => {
    if (employee.status === "Pending") return false; // handled on Employee Requests
    if (roleFilter !== "all" && employee.role !== roleFilter) return false;
    if (statusFilter !== "all" && employee.status !== statusFilter) return false;
    return `${employee.name} ${employee.email} ${employee.jobTitle ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const taskCount = (employeeId: string) =>
    tasks.filter((t) => t.assigneeId === employeeId).length;

  const setStatus = (employee: Employee, status: EmployeeStatus) => {
    setRoster((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, status } : e)),
    );
    toast.success(
      status === "Active"
        ? `${employee.name} is active again`
        : `${employee.name} was suspended`,
    );
  };

  const confirmRoleChange = () => {
    if (!roleTarget) return;
    setRoster((prev) =>
      prev.map((e) => (e.id === roleTarget.id ? { ...e, role: nextRole } : e)),
    );
    toast.success(`${roleTarget.name} is now a ${nextRole}`);
    setRoleTarget(null);
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    setRoster((prev) => prev.filter((e) => e.id !== removeTarget.id));
    toast.success(`${removeTarget.name} was removed from the organization`);
    setRemoveTarget(null);
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
              onValueChange={(v) => setStatusFilter(v as EmployeeStatus | "all")}
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
              {visible.length} of {roster.filter((e) => e.status !== "Pending").length}
            </span>
          </div>

          {visible.length === 0 ? (
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
                          employeeId={employee.id}
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
                      <TableCell className="text-right tabular-nums">
                        {employee.projectIds.length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {taskCount(employee.id)}
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">
                        {employee.joinedAt ? formatDate(employee.joinedAt) : "—"}
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
