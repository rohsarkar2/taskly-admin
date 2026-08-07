"use client";

import * as React from "react";
import { Copy } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/dashboard/ui-bits";
import { changePassword as changePasswordRequest, getErrorMessage } from "@/lib/api/auth";
import { useAppSelector } from "@/lib/redux/hooks";
import { organizationSettings } from "@/lib/mock-data";
import { PRIORITIES, TASK_STATUSES, type Priority } from "@/lib/types";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIMEZONES = [
  "Asia/Kolkata (GMT+5:30)",
  "UTC (GMT+0:00)",
  "Europe/London (GMT+1:00)",
  "America/New_York (GMT-4:00)",
  "Asia/Singapore (GMT+8:00)",
];

export default function SettingsPage() {
  const user = useAppSelector((state) => state.user.user);
  const organization = useAppSelector((state) => state.user.organization);

  const orgId =
    organization?.uniqueOrganizationId ??
    organizationSettings.uniqueOrganizationId;

  /* Organization ---------------------------------------------------------- */
  const [orgName, setOrgName] = React.useState(
    organization?.name ?? organizationSettings.name,
  );
  const [timezone, setTimezone] = React.useState(organizationSettings.timezone);
  const [workingDays, setWorkingDays] = React.useState<string[]>(
    organizationSettings.workingDays,
  );

  /* Workflow -------------------------------------------------------------- */
  const [approvalRequired, setApprovalRequired] = React.useState(
    organizationSettings.workflow.approvalRequired,
  );
  const [defaultPriority, setDefaultPriority] = React.useState<Priority>(
    organizationSettings.workflow.defaultPriority,
  );
  const [statusFlow, setStatusFlow] = React.useState<string[]>(
    organizationSettings.workflow.statusFlow,
  );

  /* Security -------------------------------------------------------------- */
  const [security, setSecurity] = React.useState(organizationSettings.security);

  /* Change password — a real auth call, unlike the rest of this page ------- */
  const [passwords, setPasswords] = React.useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [changingPassword, setChangingPassword] = React.useState(false);

  const toggleDay = (day: string, on: boolean) =>
    setWorkingDays((prev) =>
      on ? [...prev, day] : prev.filter((d) => d !== day),
    );

  const toggleStatus = (status: string, on: boolean) =>
    setStatusFlow((prev) =>
      on ? [...prev, status] : prev.filter((s) => s !== status),
    );

  const copyOrgId = async () => {
    try {
      await navigator.clipboard.writeText(orgId);
      toast.success("Organization ID copied");
    } catch {
      toast.error("Could not copy the organization ID");
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (passwords.next !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.next.length < security.minPasswordLength) {
      toast.error(
        `Password must be at least ${security.minPasswordLength} characters`,
      );
      return;
    }

    setChangingPassword(true);
    try {
      const { message } = await changePasswordRequest({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      toast.success(message || "Password changed successfully.");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error,
          "Could not change the password. Please try again.",
        ),
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Organization profile, task workflow defaults and security policy."
      />

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Organization ---------------------------------------------------- */}
        <TabsContent value="organization" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization profile</CardTitle>
              <CardDescription>
                The organization ID is what employees enter when they register
                from the mobile app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-id">Organization ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="org-id"
                      value={orgId}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyOrgId}
                      aria-label="Copy organization ID"
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-logo">Logo</Label>
                <div className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#2d5a4c] text-lg font-bold text-white">
                    {orgName[0]?.toUpperCase() ?? "T"}
                  </span>
                  <Input id="org-logo" type="file" accept="image/*" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Square PNG or SVG, at least 256×256.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="org-timezone" className="w-full sm:w-80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Working days</Label>
                <div className="flex flex-wrap gap-3">
                  {ALL_DAYS.map((day) => (
                    <div key={day} className="flex items-center gap-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={workingDays.includes(day)}
                        onCheckedChange={(checked) =>
                          toggleDay(day, checked === true)
                        }
                      />
                      <Label htmlFor={`day-${day}`} className="text-sm">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Deadlines and overdue counts skip non-working days.
                </p>
              </div>

              <Button
                className="bg-[#2d5a4c] hover:bg-[#234539]"
                onClick={() => toast.success("Organization settings saved")}
              >
                Save organization
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow -------------------------------------------------------- */}
        <TabsContent value="workflow" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval rules</CardTitle>
              <CardDescription>
                Organization-wide defaults. Each project can override these on
                its own Workflow tab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="org-approval" className="text-sm">
                    Require approval by default
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    New projects start with the approval gate switched on.
                  </p>
                </div>
                <Switch
                  id="org-approval"
                  checked={approvalRequired}
                  onCheckedChange={setApprovalRequired}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-priority">Default task priority</Label>
                <Select
                  value={defaultPriority}
                  onValueChange={(v) => setDefaultPriority(v as Priority)}
                >
                  <SelectTrigger id="org-priority" className="w-full sm:w-56">
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

              <div className="space-y-3">
                <div>
                  <Label>Task status flow</Label>
                  <p className="text-xs text-muted-foreground">
                    Statuses employees can move a task through in the app.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {TASK_STATUSES.map((status) => (
                    <div key={status} className="flex items-center gap-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={statusFlow.includes(status)}
                        onCheckedChange={(checked) =>
                          toggleStatus(status, checked === true)
                        }
                      />
                      <Label htmlFor={`status-${status}`} className="text-sm">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 rounded-lg border p-3">
                  {statusFlow.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Pick at least two statuses.
                    </span>
                  ) : (
                    statusFlow.map((status, i) => (
                      <React.Fragment key={status}>
                        <Badge variant="secondary">{status}</Badge>
                        {i < statusFlow.length - 1 && (
                          <span
                            aria-hidden
                            className="text-xs text-muted-foreground"
                          >
                            →
                          </span>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>

              <Button
                className="bg-[#2d5a4c] hover:bg-[#234539]"
                onClick={() => toast.success("Workflow settings saved")}
              >
                Save workflow
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security -------------------------------------------------------- */}
        <TabsContent value="security" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password policy</CardTitle>
              <CardDescription>
                Applies to admins and to every employee registering from the
                app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="min-length">Minimum length</Label>
                <Input
                  id="min-length"
                  type="number"
                  min={6}
                  max={32}
                  value={security.minPasswordLength}
                  onChange={(e) =>
                    setSecurity({
                      ...security,
                      minPasswordLength: Number(e.target.value),
                    })
                  }
                  className="w-full sm:w-32"
                />
              </div>

              {(
                [
                  ["requireUppercase", "Require an uppercase letter"],
                  ["requireNumber", "Require a number"],
                  ["requireSymbol", "Require a symbol"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={security[key]}
                    onCheckedChange={(checked) =>
                      setSecurity({ ...security, [key]: checked === true })
                    }
                  />
                  <Label htmlFor={key} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}

              <div className="space-y-2">
                <Label htmlFor="session-timeout">
                  Session timeout (minutes)
                </Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min={5}
                  max={1440}
                  value={security.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSecurity({
                      ...security,
                      sessionTimeoutMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full sm:w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Idle admins are signed out and the refresh token is revoked.
                </p>
              </div>

              <Button
                className="bg-[#2d5a4c] hover:bg-[#234539]"
                onClick={() => toast.success("Security settings saved")}
              >
                Save security
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account --------------------------------------------------------- */}
        <TabsContent value="account" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin account</CardTitle>
              <CardDescription>
                {user?.name ?? "Admin"} · {user?.email ?? "admin@taskly.com"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="max-w-md space-y-4" onSubmit={changePassword}>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwords.next}
                    onChange={(e) =>
                      setPasswords({ ...passwords, next: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    At least {security.minPasswordLength} characters
                    {security.requireUppercase && ", one uppercase letter"}
                    {security.requireNumber && ", one number"}
                    {security.requireSymbol && ", one symbol"}.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-[#2d5a4c] hover:bg-[#234539]"
                  disabled={changingPassword}
                >
                  {changingPassword ? "Changing…" : "Change password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
