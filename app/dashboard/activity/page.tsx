"use client";

import * as React from "react";
import {
  CheckSquare,
  FolderKanban,
  ListTodo,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/dashboard/ui-bits";
import { activityLogs, formatDate, relativeToToday } from "@/lib/mock-data";
import type { ActivityKind } from "@/lib/types";

const KIND_ICON: Record<
  ActivityKind,
  React.ComponentType<{ className?: string }>
> = {
  employee: Users,
  role: UserCog,
  project: FolderKanban,
  task: ListTodo,
  approval: CheckSquare,
  security: ShieldCheck,
};

const KIND_COLOR: Record<ActivityKind, string> = {
  employee: "var(--viz-1)",
  role: "var(--viz-6)",
  project: "var(--viz-3)",
  task: "var(--viz-2)",
  approval: "var(--viz-warning)",
  security: "var(--viz-critical)",
};

const KINDS: ActivityKind[] = [
  "employee",
  "role",
  "project",
  "task",
  "approval",
  "security",
];

export default function ActivityLogPage() {
  const [query, setQuery] = React.useState("");
  const [kindFilter, setKindFilter] = React.useState<ActivityKind | "all">(
    "all",
  );

  const visible = activityLogs.filter((log) => {
    if (kindFilter !== "all" && log.kind !== kindFilter) return false;
    return `${log.actor} ${log.message}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  /** Group by date so the log reads as a diary rather than a flat list. */
  const grouped = visible.reduce<Record<string, typeof visible>>((acc, log) => {
    (acc[log.at] ??= []).push(log);
    return acc;
  }, {});

  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <PageHeader
        title="Activity Log"
        description="Every important action taken in the organization, newest first."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search activity…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select
          value={kindFilter}
          onValueChange={(v) => setKindFilter(v as ActivityKind | "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All activity</SelectItem>
            {KINDS.map((kind) => (
              <SelectItem key={kind} value={kind} className="capitalize">
                {kind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(query || kindFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setKindFilter("all");
            }}
          >
            Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {visible.length} of {activityLogs.length} entries
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No activity matches"
          description="Try a different type or search term."
        />
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-sm">{formatDate(day)}</CardTitle>
                <CardDescription>{relativeToToday(day)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {grouped[day].map((log) => {
                    const Icon = KIND_ICON[log.kind];
                    return (
                      <li key={log.id} className="flex items-start gap-3">
                        <span
                          aria-hidden
                          className="grid size-7 shrink-0 place-items-center rounded-lg"
                          style={{
                            background: `color-mix(in oklch, ${KIND_COLOR[log.kind]} 12%, transparent)`,
                            color: KIND_COLOR[log.kind],
                          }}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <p className="text-sm">
                          <span className="font-medium">{log.actor}</span>{" "}
                          <span className="text-muted-foreground">
                            {log.message}
                          </span>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
