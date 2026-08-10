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

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Map short day names to API format (lowercase full names). */
const DAY_TO_API: Record<string, string> = {
  Mon: "monday",
  Tue: "tuesday",
  Wed: "wednesday",
  Thu: "thursday",
  Fri: "friday",
  Sat: "saturday",
  Sun: "sunday",
};

/** Map API day format back to short names for display. */
const API_TO_DAY: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

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
  const [workingHours, setWorkingHours] = React.useState({
    start: "09:00",
    end: "18:00",
  });

  const [savingOrganization, setSavingOrganization] = React.useState(false);
  const [savingWorkflow, setSavingWorkflow] = React.useState(false);
  const [savingSecurity, setSavingSecurity] = React.useState(false);
  const [savingNotifications, setSavingNotifications] = React.useState(false);

  /* Workflow -------------------------------------------------------------- */
  const [workflow, setWorkflow] = React.useState({
    requireTaskApproval: organizationSettings.workflow.approvalRequired,
    defaultApproverRole: "manager" as string,
    defaultTaskPriority: "medium" as string,
    allowEmployeeTaskCreation: true,
    allowEmployeeTaskDeletion: false,
    autoApproveEmployeeRegistration: false,
  });

  /* Security -------------------------------------------------------------- */
  const [security, setSecurity] = React.useState({
    passwordPolicy: {
      minLength: organizationSettings.security.minPasswordLength,
      requireUppercase: organizationSettings.security.requireUppercase,
      requireLowercase: false,
      requireNumber: organizationSettings.security.requireNumber,
      requireSpecialChar: organizationSettings.security.requireSymbol,
    },
    sessionTimeoutMinutes: organizationSettings.security.sessionTimeoutMinutes,
    enforceSingleSession: false,
  });

  /* Notifications --------------------------------------------------------- */
  const [notifications, setNotifications] = React.useState({
    employeeRegistration: true,
    taskApprovalRequests: true,
    projectDeadlineReminders: true,
    overdueTasks: true,
    projectCompletion: true,
    reportGeneration: true,
    emailNotifications: false,
    pushNotifications: true,
  });

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
          email: org.contactEmail ?? org.email ?? "",
          phoneNumber: org.contactPhone ?? org.phoneNumber ?? "",
        });
        if (org.logo) setLogoUrl(org.logo);
        if (org.timezone) setTimezone(org.timezone);
        if (org.workingDays?.length) {
          // Convert API format (monday) to UI format (Mon)
          const uiDays = org.workingDays
            .map((day: string) => API_TO_DAY[day.toLowerCase()])
            .filter(Boolean);
          if (uiDays.length) setWorkingDays(uiDays);
        }
        if (org.workingHours) setWorkingHours(org.workingHours);
      } else {
        console.error(
          "Failed to load organization:",
          organizationResult.reason,
        );
      }

      if (settingsResult.status === "fulfilled") {
        const settings = settingsResult.value.data.settings;
        if (settings?.timezone) setTimezone(settings.timezone);
        if (settings?.workingDays?.length) {
          // Convert API format (monday) to UI format (Mon)
          const uiDays = settings.workingDays
            .map((day: string) => API_TO_DAY[day.toLowerCase()])
            .filter(Boolean);
          if (uiDays.length) setWorkingDays(uiDays);
        }
        if (settings?.workingHours) setWorkingHours(settings.workingHours);
        if (settings?.workflow) {
          setWorkflow({
            requireTaskApproval:
              settings.workflow.requireTaskApproval ??
              workflow.requireTaskApproval,
            defaultApproverRole:
              settings.workflow.defaultApproverRole ??
              workflow.defaultApproverRole,
            defaultTaskPriority:
              settings.workflow.defaultTaskPriority ??
              workflow.defaultTaskPriority,
            allowEmployeeTaskCreation:
              settings.workflow.allowEmployeeTaskCreation ??
              workflow.allowEmployeeTaskCreation,
            allowEmployeeTaskDeletion:
              settings.workflow.allowEmployeeTaskDeletion ??
              workflow.allowEmployeeTaskDeletion,
            autoApproveEmployeeRegistration:
              settings.workflow.autoApproveEmployeeRegistration ??
              workflow.autoApproveEmployeeRegistration,
          });
        }
        if (settings?.security) {
          setSecurity({
            passwordPolicy: {
              minLength:
                settings.security.passwordPolicy?.minLength ??
                security.passwordPolicy.minLength,
              requireUppercase:
                settings.security.passwordPolicy?.requireUppercase ??
                security.passwordPolicy.requireUppercase,
              requireLowercase:
                settings.security.passwordPolicy?.requireLowercase ??
                security.passwordPolicy.requireLowercase,
              requireNumber:
                settings.security.passwordPolicy?.requireNumber ??
                security.passwordPolicy.requireNumber,
              requireSpecialChar:
                settings.security.passwordPolicy?.requireSpecialChar ??
                security.passwordPolicy.requireSpecialChar,
            },
            sessionTimeoutMinutes:
              settings.security.sessionTimeoutMinutes ??
              security.sessionTimeoutMinutes,
            enforceSingleSession:
              settings.security.enforceSingleSession ??
              security.enforceSingleSession,
          });
        }
        if (settings?.notifications) setNotifications(settings.notifications);
      } else {
        console.error("Failed to load settings:", settingsResult.reason);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const toggleDay = (day: string, on: boolean) =>
    setWorkingDays((prev) =>
      on ? [...prev, day] : prev.filter((d) => d !== day),
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
      // Convert UI days (Mon, Tue) to API format (monday, tuesday)
      const apiWorkingDays = workingDays.map((day) => DAY_TO_API[day]);

      const [organizationResponse] = await Promise.all([
        updateOrganization({
          name: orgName,
          industry: profile.industry || undefined,
          website: profile.website || undefined,
          contactEmail: profile.email || undefined,
          contactPhone: profile.phoneNumber || undefined,
          timezone,
          workingDays: apiWorkingDays,
          workingHours,
        }),
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
    setSavingWorkflow(true);
    try {
      const { message } = await updateOrganizationSettings({ workflow });
      toast.success(message || "Workflow settings saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not save the workflow rules."));
    } finally {
      setSavingWorkflow(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const { message } = await updateOrganizationSettings({ notifications });
      toast.success(message || "Notification settings saved.");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Could not save notification preferences."),
      );
    } finally {
      setSavingNotifications(false);
    }
  };

  const saveSecurity = async () => {
    setSavingSecurity(true);
    try {
      const { message } = await updateOrganizationSettings({ security });
      toast.success(message || "Security settings saved.");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Could not save the security policy."),
      );
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
    if (passwords.next.length < security.passwordPolicy.minLength) {
      toast.error(
        `Password must be at least ${security.passwordPolicy.minLength} characters`,
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
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
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

              <div className="space-y-2">
                <Label>Working hours</Label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="work-start">Start time</Label>
                    <Input
                      id="work-start"
                      type="time"
                      value={workingHours.start}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          start: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work-end">End time</Label>
                    <Input
                      id="work-end"
                      type="time"
                      value={workingHours.end}
                      onChange={(e) =>
                        setWorkingHours({
                          ...workingHours,
                          end: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Standard working hours for task scheduling and reports.
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
                    Require task approval by default
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    New projects start with the approval gate switched on.
                  </p>
                </div>
                <Switch
                  id="org-approval"
                  checked={workflow.requireTaskApproval}
                  onCheckedChange={(checked) =>
                    setWorkflow({ ...workflow, requireTaskApproval: checked })
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="employee-task-creation" className="text-sm">
                    Allow employee task creation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Employees can create new tasks from the mobile app.
                  </p>
                </div>
                <Switch
                  id="employee-task-creation"
                  checked={workflow.allowEmployeeTaskCreation}
                  onCheckedChange={(checked) =>
                    setWorkflow({
                      ...workflow,
                      allowEmployeeTaskCreation: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="employee-task-deletion" className="text-sm">
                    Allow employee task deletion
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Employees can delete tasks they created.
                  </p>
                </div>
                <Switch
                  id="employee-task-deletion"
                  checked={workflow.allowEmployeeTaskDeletion}
                  onCheckedChange={(checked) =>
                    setWorkflow({
                      ...workflow,
                      allowEmployeeTaskDeletion: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label
                    htmlFor="auto-approve-registration"
                    className="text-sm"
                  >
                    Auto-approve employee registration
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    New employees are approved automatically without admin
                    review.
                  </p>
                </div>
                <Switch
                  id="auto-approve-registration"
                  checked={workflow.autoApproveEmployeeRegistration}
                  onCheckedChange={(checked) =>
                    setWorkflow({
                      ...workflow,
                      autoApproveEmployeeRegistration: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-approver">Default approver role</Label>
                <Select
                  value={workflow.defaultApproverRole}
                  onValueChange={(value) =>
                    setWorkflow({ ...workflow, defaultApproverRole: value })
                  }
                >
                  <SelectTrigger
                    id="default-approver"
                    className="w-full sm:w-56"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="team_lead">Team Lead</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-priority">Default task priority</Label>
                <Select
                  value={workflow.defaultTaskPriority}
                  onValueChange={(value) =>
                    setWorkflow({ ...workflow, defaultTaskPriority: value })
                  }
                >
                  <SelectTrigger id="org-priority" className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
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
                  value={security.passwordPolicy.minLength}
                  onChange={(e) =>
                    setSecurity({
                      ...security,
                      passwordPolicy: {
                        ...security.passwordPolicy,
                        minLength: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full sm:w-32"
                />
              </div>

              {(
                [
                  ["requireUppercase", "Require an uppercase letter"],
                  ["requireLowercase", "Require a lowercase letter"],
                  ["requireNumber", "Require a number"],
                  ["requireSpecialChar", "Require a special character"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={key}
                    checked={security.passwordPolicy[key]}
                    onCheckedChange={(checked) =>
                      setSecurity({
                        ...security,
                        passwordPolicy: {
                          ...security.passwordPolicy,
                          [key]: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor={key} className="text-sm">
                    {label}
                  </Label>
                </div>
              ))}

              <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="single-session" className="text-sm">
                    Enforce single session
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Users are logged out from other devices when signing in.
                  </p>
                </div>
                <Switch
                  id="single-session"
                  checked={security.enforceSingleSession}
                  onCheckedChange={(checked) =>
                    setSecurity({ ...security, enforceSingleSession: checked })
                  }
                />
              </div>

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

        {/* Notifications --------------------------------------------------- */}
        <TabsContent value="notifications" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification preferences</CardTitle>
              <CardDescription>
                Control which events trigger notifications to admins.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  [
                    "employeeRegistration",
                    "Employee registration",
                    "Notify when a new employee registers from the mobile app.",
                  ],
                  [
                    "taskApprovalRequests",
                    "Task approval requests",
                    "Notify when a task is submitted for approval.",
                  ],
                  [
                    "projectDeadlineReminders",
                    "Project deadline reminders",
                    "Notify about upcoming project deadlines.",
                  ],
                  [
                    "overdueTasks",
                    "Overdue tasks",
                    "Notify when tasks become overdue.",
                  ],
                  [
                    "projectCompletion",
                    "Project completion",
                    "Notify when a project is marked as complete.",
                  ],
                  [
                    "reportGeneration",
                    "Report generation",
                    "Notify when scheduled reports are ready.",
                  ],
                ] as const
              ).map(([key, title, description]) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 rounded-lg border p-3"
                >
                  <div>
                    <Label htmlFor={key} className="text-sm">
                      {title}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={notifications[key]}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, [key]: checked })
                    }
                  />
                </div>
              ))}

              <div className="space-y-3 rounded-lg border p-4">
                <Label className="text-base font-semibold">
                  Delivery methods
                </Label>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="email-notifications" className="text-sm">
                      Email notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Send notifications via email.
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        emailNotifications: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="push-notifications" className="text-sm">
                      Push notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Send in-app push notifications.
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        pushNotifications: checked,
                      })
                    }
                  />
                </div>
              </div>

              <Button
                className="bg-[#2d5a4c] hover:bg-[#234539]"
                onClick={saveNotifications}
                disabled={savingNotifications}
              >
                {savingNotifications ? "Saving…" : "Save notifications"}
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
                    At least {security.passwordPolicy.minLength} characters
                    {security.passwordPolicy.requireUppercase &&
                      ", one uppercase letter"}
                    {security.passwordPolicy.requireLowercase &&
                      ", one lowercase letter"}
                    {security.passwordPolicy.requireNumber && ", one number"}
                    {security.passwordPolicy.requireSpecialChar &&
                      ", one special character"}
                    .
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
