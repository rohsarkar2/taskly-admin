"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/charts/bar-chart";
import { employeeById, initialsOf } from "@/lib/mock-data";
import type {
  Employee,
  EmployeeStatus,
  Priority,
  ProjectStatus,
  Role,
  TaskStatus,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/* Page chrome                                                                */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="space-y-1">
      {backHref && (
        <Link
          href={backHref}
          className="inline-block text-xs text-muted-foreground hover:text-foreground"
        >
          ← {backLabel ?? "Back"}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-base font-semibold">{children}</h2>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/**
 * Shown when an endpoint could not be reached and the page fell back to the
 * seeded fixtures. Labelling it is the point — unlabelled sample data reads as
 * real data.
 */
export function SampleDataNotice({
  message = "Could not reach the API — showing sample data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-l-4 border-l-(--viz-warning) bg-muted/40 px-3 py-2">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-(--viz-warning)"
      />
      <p className="text-xs text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="xs" className="ml-auto" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-55 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat tiles — a headline number is a tile, never a one-bar chart            */
/* -------------------------------------------------------------------------- */

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Small colour cue on the icon only; the number itself stays in text ink. */
  accent?: string;
  href?: string;
}) {
  const body = (
    <Card
      className={cn(href && "transition-colors hover:border-foreground/20")}
    >
      <CardContent className="flex items-start justify-between gap-3 pt-1 pb-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {hint && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
        {Icon && (
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-lg"
            style={{
              background: `color-mix(in oklch, ${accent ?? "var(--viz-1)"} 12%, transparent)`,
              color: accent ?? "var(--viz-1)",
            }}
          >
            <Icon className="size-4" />
          </span>
        )}
      </CardContent>
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  );
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Status colours are reserved and always ship with their label — a dot plus
 * text, never a colour on its own.
 */
function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="size-1.5 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  "To Do": "var(--viz-axis)",
  "In Progress": "var(--viz-1)",
  "Pending Approval": "var(--viz-warning)",
  Returned: "var(--viz-2)",
  Blocked: "var(--viz-serious)",
  Completed: "var(--viz-good)",
  Rejected: "var(--viz-critical)",
};

export function TaskStatusBadge({
  status,
  overdue,
}: {
  status: TaskStatus;
  overdue?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge variant="outline" className="gap-1.5">
        <Dot color={TASK_STATUS_COLOR[status]} />
        {status}
      </Badge>
      {overdue && (
        <Badge variant="outline" className="gap-1.5">
          <Dot color="var(--viz-critical)" />
          Overdue
        </Badge>
      )}
    </span>
  );
}

const EMPLOYEE_STATUS_COLOR: Record<EmployeeStatus, string> = {
  Active: "var(--viz-good)",
  Pending: "var(--viz-warning)",
  Suspended: "var(--viz-serious)",
  Rejected: "var(--viz-critical)",
  Removed: "var(--viz-axis)",
};

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <Dot color={EMPLOYEE_STATUS_COLOR[status]} />
      {status}
    </Badge>
  );
}

const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  Active: "var(--viz-good)",
  "On Hold": "var(--viz-warning)",
  Completed: "var(--viz-1)",
  Archived: "var(--viz-axis)",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <Dot color={PROJECT_STATUS_COLOR[status]} />
      {status}
    </Badge>
  );
}

const PRIORITY_COLOR: Record<Priority, string> = {
  Low: "var(--viz-axis)",
  Medium: "var(--viz-1)",
  High: "var(--viz-warning)",
  Urgent: "var(--viz-critical)",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <Dot color={PRIORITY_COLOR[priority]} />
      {priority}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant="secondary">{role}</Badge>;
}

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Renders a person as avatar + name + subtitle.
 *
 * Takes either a full `employee` (API-backed pages) or an `employeeId` to look
 * up in the fixtures (pages still running on static data).
 */
export function PersonCell({
  employee: provided,
  employeeId,
  subtitle,
  href,
}: {
  employee?: Pick<Employee, "id" | "name" | "email" | "avatarColor">;
  employeeId?: string;
  subtitle?: string;
  href?: string;
}) {
  const employee =
    provided ?? (employeeId ? employeeById(employeeId) : undefined);

  if (!employee) {
    return (
      <span className="flex items-center gap-2">
        <Avatar className="size-7 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">Unknown</span>
        </span>
      </span>
    );
  }

  const inner = (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar className="size-7 shrink-0">
        <AvatarFallback
          className="text-[0.65rem] font-semibold text-white"
          style={{ background: employee.avatarColor }}
        >
          {initialsOf(employee.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {employee.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle ?? employee.email}
        </span>
      </span>
    </span>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

export function AvatarStack({
  employeeIds,
  max = 4,
}: {
  employeeIds: string[];
  max?: number;
}) {
  const shown = employeeIds.slice(0, max);
  const overflow = employeeIds.length - shown.length;

  return (
    <span className="flex items-center">
      {shown.map((id) => {
        const employee = employeeById(id);
        if (!employee) return null;
        return (
          <Avatar
            key={id}
            className="-ml-1.5 size-6 ring-2 ring-background first:ml-0"
            title={employee.name}
          >
            <AvatarFallback
              className="text-[0.6rem] font-semibold text-white"
              style={{ background: employee.avatarColor }}
            >
              {initialsOf(employee.name)}
            </AvatarFallback>
          </Avatar>
        );
      })}
      {overflow > 0 && (
        <span className="-ml-1.5 grid size-6 place-items-center rounded-full bg-muted text-[0.6rem] font-semibold ring-2 ring-background">
          +{overflow}
        </span>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

export function ProgressCell({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2">
      <Meter value={value} className="w-20" />
      <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums">
        {value}%
      </span>
    </span>
  );
}

export function DefinitionRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2.5 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
  );
}
