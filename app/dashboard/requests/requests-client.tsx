"use client";

import * as React from "react";
import { CheckCircle2, Clock, UserPlus, XCircle } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toEmployee, toEmployees } from "@/lib/api/adapters";
import {
  approveEmployee,
  listEmployees,
  listPendingEmployees,
  rejectEmployee,
} from "@/lib/api/employees";
import {
  REFERENCE_TODAY,
  daysBetween,
  employees as seedEmployees,
  formatDate,
  organizationSettings,
  relativeToToday,
} from "@/lib/mock-data";
import { ROLES, type Employee, type Role } from "@/lib/types";
import { useAppDispatch } from "@/lib/redux/hooks";
import { fetchBadgeCounts } from "@/lib/redux/thunks/badges";

type Decision = "approve" | "reject" | null;

export default function EmployeeRequestsClient() {
  const dispatch = useAppDispatch();
  const [roster, setRoster] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const [target, setTarget] = React.useState<Employee | null>(null);
  const [decision, setDecision] = React.useState<Decision>(null);
  const [role, setRole] = React.useState<Role>("Team Member");
  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState<Employee | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  const pending = roster.filter((e) => e.status === "Pending");
  const decided = roster.filter(
    (e) => e.status === "Rejected" || (e.status === "Active" && e.joinedAt),
  );

  const visible = pending.filter((e) =>
    `${e.name} ${e.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [pending, decided] = await Promise.all([
          listPendingEmployees(),
          listEmployees({ limit: 100 }),
        ]);
        if (cancelled) return;

        const merged = new Map<string, Employee>();
        for (const employee of toEmployees(decided.items)) {
          merged.set(employee.id, employee);
        }
        for (const employee of toEmployees(pending.items)) {
          merged.set(employee.id, { ...employee, status: "Pending" });
        }

        setRoster([...merged.values()]);
        setUsingSampleData(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load employee requests:", error);
        setRoster(seedEmployees);
        setUsingSampleData(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const openApprove = (employee: Employee) => {
    setTarget(employee);
    setRole(employee.role);
    setDecision("approve");
  };

  const openReject = (employee: Employee) => {
    setTarget(employee);
    setReason("");
    setDecision("reject");
  };

  const closeDialog = () => {
    setDecision(null);
    setTarget(null);
  };

  const applyDecision = (id: string, patch: Partial<Employee>) =>
    setRoster((prev) =>
      prev.map((employee) =>
        employee.id === id ? { ...employee, ...patch } : employee,
      ),
    );

  const confirmApprove = async () => {
    if (!target) return;

    setSubmitting(true);
    try {
      if (!usingSampleData) {
        const { message, data } = await approveEmployee(target.id, { role });
        applyDecision(target.id, {
          ...(data?.employee ? toEmployee(data.employee) : {}),
          status: "Active",
          role,
          joinedAt: todayIso(),
        });
        toast.success(message || `${target.name} approved as ${role}`, {
          description: "They now have access to the organization from the app.",
        });
        dispatch(fetchBadgeCounts());
      } else {
        applyDecision(target.id, {
          status: "Active",
          role,
          joinedAt: todayIso(),
        });
        toast.success(`${target.name} approved as ${role}`, {
          description: "Sample data — nothing was sent to the server.",
        });
      }
      closeDialog();
    } catch (error) {
      toast.error(
        getErrorMessage(error, `Could not approve ${target.name}. Try again.`),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReject = async () => {
    if (!target) return;

    setSubmitting(true);
    try {
      if (!usingSampleData) {
        const { message } = await rejectEmployee(target.id, {
          reason: reason || undefined,
        });
        applyDecision(target.id, { status: "Rejected" });
        toast.success(message || `${target.name}'s request was rejected`, {
          description: reason || "No reason recorded.",
        });
        dispatch(fetchBadgeCounts());
      } else {
        applyDecision(target.id, { status: "Rejected" });
        toast.success(`${target.name}'s request was rejected`, {
          description: "Sample data — nothing was sent to the server.",
        });
      }
      closeDialog();
    } catch (error) {
      toast.error(
        getErrorMessage(error, `Could not reject ${target.name}. Try again.`),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Employee Requests"
        description={`Employees who registered from the mobile app with ${organizationSettings.uniqueOrganizationId}. They cannot open projects or tasks until you approve them.`}
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the employees API — showing sample data. Approvals will not be saved."
          onRetry={refresh}
        />
      )}

      <StatGrid>
        <StatTile
          label="Pending Approval"
          value={pending.length}
          hint="Awaiting your decision"
          icon={Clock}
          accent="var(--viz-warning)"
        />
        <StatTile
          label="Approved"
          value={roster.filter((e) => e.status === "Active").length}
          hint="Active in the organization"
          icon={CheckCircle2}
          accent="var(--viz-good)"
        />
        <StatTile
          label="Rejected"
          value={roster.filter((e) => e.status === "Rejected").length}
          hint="Access denied"
          icon={XCircle}
          accent="var(--viz-critical)"
        />
        <StatTile
          label="Registered this week"
          value={
            roster.filter(
              (e) => daysBetween(e.registeredAt, REFERENCE_TODAY) <= 7,
            ).length
          }
          hint="Last 7 days"
          icon={UserPlus}
        />
      </StatGrid>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Pending registrations</CardTitle>
              <CardDescription>
                Approving assigns a role and flips the employee to Active
                immediately.
              </CardDescription>
            </div>
            <Input
              placeholder="Search name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title="Nothing waiting for approval"
              description="New registrations from the mobile app will land here."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <PersonCell employee={employee} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(employee.registeredAt)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {relativeToToday(employee.registeredAt)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {organizationSettings.name}
                        <span className="block font-mono text-xs text-muted-foreground">
                          {organizationSettings.uniqueOrganizationId}
                        </span>
                      </TableCell>
                      <TableCell>
                        <EmployeeStatusBadge status={employee.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetails(employee)}
                          >
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReject(employee)}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#2d5a4c] hover:bg-[#234539]"
                            onClick={() => openApprove(employee)}
                          >
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently decided</CardTitle>
          <CardDescription>
            Approved and rejected registrations, most recent first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decided
                  .slice()
                  .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
                  .slice(0, 8)
                  .map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <PersonCell
                          employee={employee}
                          href={
                            employee.status === "Active"
                              ? `/dashboard/employees/${employee.id}`
                              : undefined
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={employee.role} />
                      </TableCell>
                      <TableCell>
                        <EmployeeStatusBadge status={employee.status} />
                      </TableCell>
                      <TableCell className="text-right text-xs whitespace-nowrap">
                        {formatDate(employee.registeredAt)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={decision === "approve"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {target?.name}</DialogTitle>
            <DialogDescription>
              Pick the role this employee joins with. You can change it later
              from Employees.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="approve-role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger id="approve-role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Team Members work on tasks. Team Leads and Managers can also
              approve tasks, depending on each project&apos;s workflow.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              className="bg-[#2d5a4c] hover:bg-[#234539]"
              onClick={confirmApprove}
              disabled={submitting}
            >
              {submitting ? "Approving…" : `Approve as ${role}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={decision === "reject"}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {target?.name}?</DialogTitle>
            <DialogDescription>
              They will not be able to access {organizationSettings.name}. They
              can register again with the organization ID.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Shared with the employee in the rejection email."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={submitting}
            >
              {submitting ? "Rejecting…" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={details !== null}
        onOpenChange={(open) => !open && setDetails(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{details?.name}</DialogTitle>
            <DialogDescription>Registration details</DialogDescription>
          </DialogHeader>

          {details && (
            <dl className="space-y-0">
              <Row label="Email">{details.email}</Row>
              <Row label="Phone">{details.phone ?? "—"}</Row>
              <Row label="Organization">
                {organizationSettings.name} (
                {organizationSettings.uniqueOrganizationId})
              </Row>
              <Row label="Registered">{formatDate(details.registeredAt)}</Row>
              <Row label="Requested role">Team Member (default)</Row>
              <Row label="Status">
                <EmployeeStatusBadge status={details.status} />
              </Row>
            </dl>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetails(null)}>
              Close
            </Button>
            {details?.status === "Pending" && (
              <Button
                className="bg-[#2d5a4c] hover:bg-[#234539]"
                onClick={() => {
                  const employee = details;
                  setDetails(null);
                  if (employee) openApprove(employee);
                }}
              >
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-2.5 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
