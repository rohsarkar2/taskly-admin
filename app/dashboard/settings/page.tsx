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
import {
  changePassword as changePasswordRequest,
  getErrorMessage,
} from "@/lib/api/auth";
import {
  getOrganization,
  getOrganizationSettings,
  updateOrganization,
  updateOrganizationSettings,
  uploadOrganizationLogo,
} from "@/lib/api/organization";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setOrganization } from "@/lib/redux/slices/userSlice";
import { organizationSettings } from "@/lib/mock-data";
import { PRIORITIES, TASK_STATUSES, type Priority } from "@/lib/types";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Value is the IANA identifier the API stores; the label is for humans. */
const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (GMT+5:30)" },
  { value: "UTC", label: "UTC (GMT+0:00)" },
  { value: "Europe/London", label: "Europe/London (GMT+1:00)" },
  { value: "America/New_York", label: "America/New_York (GMT-4:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (GMT+8:00)" },
];

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const organization = useAppSelector((state) => state.user.organization);

  const orgId =
    organization?.uniqueOrganizationId ??
    organizationSettings.uniqueOrganizationId;

  /* Organization ---------------------------------------------------------- */
  const [orgName, setOrgName] = React.useState(
    organization?.name ?? organizationSettings.name,
  );
  const [profile, setProfile] = React.useState({
    industry: "",
    website: "",
    email: "",
    phoneNumber: "",
  });
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = React.useState(false);
  const [timezone, setTimezone] = React.useState("Asia/Kolkata");
  const [workingDays, setWorkingDays] = React.useState<string[]>(
    organizationSettings.workingDays,
  );

  const [savingOrganization, setSavingOrganization] = React.useState(false);
  const [savingWorkflow, setSavingWorkflow] = React.useState(false);
  const [savingSecurity, setSavingSecurity] = React.useState(false);

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

  /**
   * Load the live organization and settings.
   *
   * Failures are logged rather than surfaced: the form falls back to the seeded
   * defaults so the page stays usable while the endpoints are being built.
   */
  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [organizationResult, settingsResult] = await Promise.allSettled([
        getOrganization(),
        getOrganizationSettings(),
      ]);

      if (cancelled) return;

      if (organizationResult.status === "fulfilled") {
        const org = organizationResult.value.data.organization;
        dispatch(setOrganization(org));
        setOrgName(org.name);
        setProfile({
          industry: org.industry ?? "",
          website: org.website ?? "",
          email: org.email ?? "",
          phoneNumber: org.phoneNumber ?? "",
        });
        if (org.logoUrl) setLogoUrl(org.logoUrl);
        if (org.timezone) setTimezone(org.timezone);
      } else {
        console.error("Failed to load organization:", organizationResult.reason);
      }

      if (settingsResult.status === "fulfilled") {
        const settings = settingsResult.value.data;
        if (settings?.timezone) setTimezone(settings.timezone);
        if (settings?.workingDays?.length) setWorkingDays(settings.workingDays);
        if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
        if (settings?.workflow) {
          setApprovalRequired(settings.workflow.approvalRequired);
          setDefaultPriority(settings.workflow.defaultPriority as Priority);
          setStatusFlow(settings.workflow.statusFlow);
        }
        if (settings?.security) setSecurity(settings.security);
      } else {
        console.error("Failed to load settings:", settingsResult.reason);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const toggleDay = (day: string, on: boolean) =>
    setWorkingDays((prev) =>
      on ? [...prev, day] : prev.filter((d) => d !== day),
    );

  const toggleStatus = (status: string, on: boolean) =>
    setStatusFlow((prev) =>
      on ? [...prev, status] : prev.filter((s) => s !== status),
    );

  /**
   * The profile fields belong to the organization record, while working days
   * belong to settings. Timezone is accepted by both, so it goes in each
   * payload to keep them from drifting.
   */
  const saveOrganization = async () => {
    if (!orgName.trim()) {
      toast.error("Organization name cannot be empty");
      return;
    }

    setSavingOrganization(true);
    try {
      const [organizationResponse] = await Promise.all([
        updateOrganization({
          name: orgName,
          industry: profile.industry || undefined,
          website: profile.website || undefined,
          email: profile.email || undefined,
          phoneNumber: profile.phoneNumber || undefined,
          timezone,
        }),
        updateOrganizationSettings({ timezone, workingDays }),
      ]);

      const updated = organizationResponse.data?.organization;
      if (updated) dispatch(setOrganization(updated));

      toast.success(
        organizationResponse.message || "Organization updated successfully.",
      );
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Could not save the organization details."),
      );
    } finally {
      setSavingOrganization(false);
    }
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { message, data } = await uploadOrganizationLogo(file);
      if (data?.logoUrl) setLogoUrl(data.logoUrl);
      toast.success(message || "Logo uploaded successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not upload the logo."));
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveWorkflow = async () => {
    if (statusFlow.length < 2) {
      toast.error("Pick at least two statuses for the task flow");
      return;
    }

    setSavingWorkflow(true);
    try {
      const { message } = await updateOrganizationSettings({
        workflow: { approvalRequired, defaultPriority, statusFlow },
      });
      toast.success(message || "Workflow settings saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the workflow rules."));
    } finally {
      setSavingWorkflow(false);
    }
  };

  const saveSecurity = async () => {
    setSavingSecurity(true);
    try {
      const { message } = await updateOrganizationSettings({ security });
      toast.success(message || "Security settings saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the security policy."));
    } finally {
      setSavingSecurity(false);
    }
  };

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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-industry">Industry</Label>
                  <Input
                    id="org-industry"
                    value={profile.industry}
                    onChange={(e) =>
                      setProfile({ ...profile, industry: e.target.value })
                    }
                    placeholder="Software"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-website">Website</Label>
                  <Input
                    id="org-website"
                    type="url"
                    value={profile.website}
                    onChange={(e) =>
                      setProfile({ ...profile, website: e.target.value })
                    }
                    placeholder="https://abctech.io"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-email">Contact email</Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    placeholder="contact@abctech.io"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-phone">Phone number</Label>
                  <Input
                    id="org-phone"
                    type="tel"
                    value={profile.phoneNumber}
                    onChange={(e) =>
                      setProfile({ ...profile, phoneNumber: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-logo">Logo</Label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote host is not known at build time
                    <img
                      src={logoUrl}
                      alt={`${orgName} logo`}
                      className="size-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[#2d5a4c] text-lg font-bold text-white">
                      {orgName[0]?.toUpperCase() ?? "T"}
                    </span>
                  )}
                  <Input
                    id="org-logo"
                    type="file"
                    accept="image/*"
                    disabled={uploadingLogo}
                    onChange={(e) => uploadLogo(e.target.files?.[0])}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {uploadingLogo
                    ? "Uploading…"
                    : "Square PNG or SVG, at least 256×256. Uploads as soon as you pick a file."}
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
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
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
                onClick={saveOrganization}
                disabled={savingOrganization}
              >
                {savingOrganization ? "Saving…" : "Save organization"}
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
                onClick={saveWorkflow}
                disabled={savingWorkflow}
              >
                {savingWorkflow ? "Saving…" : "Save workflow"}
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
                onClick={saveSecurity}
                disabled={savingSecurity}
              >
                {savingSecurity ? "Saving…" : "Save security"}
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
