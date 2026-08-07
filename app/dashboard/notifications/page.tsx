"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckSquare,
  FolderKanban,
  ListTodo,
  UserPlus,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyState,
  PageHeader,
} from "@/components/dashboard/ui-bits";
import { formatDate, notifications as seed, relativeToToday } from "@/lib/mock-data";
import type { AppNotification, NotificationKind } from "@/lib/types";

const KIND_ICON: Record<
  NotificationKind,
  React.ComponentType<{ className?: string }>
> = {
  registration: UserPlus,
  approval: CheckSquare,
  deadline: CalendarClock,
  overdue: AlertTriangle,
  project: FolderKanban,
  task: ListTodo,
};

const KIND_COLOR: Record<NotificationKind, string> = {
  registration: "var(--viz-1)",
  approval: "var(--viz-warning)",
  deadline: "var(--viz-2)",
  overdue: "var(--viz-critical)",
  project: "var(--viz-3)",
  task: "var(--viz-6)",
};

export default function NotificationsPage() {
  const [list, setList] = React.useState<AppNotification[]>(seed);

  const unread = list.filter((n) => !n.read);

  const markRead = (id: string) =>
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const markAllRead = () => {
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Registrations, approvals, deadlines and overdue work."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={unread.length === 0}
          >
            Mark all as read
          </Button>
        }
      />

      <Tabs defaultValue="unread">
        <TabsList>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
          <TabsTrigger value="all">All ({list.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-4">
          <NotificationList
            items={unread}
            onRead={markRead}
            emptyTitle="You are all caught up"
            emptyBody="New registrations and approval requests will show up here."
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <NotificationList
            items={list}
            onRead={markRead}
            emptyTitle="No notifications yet"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

function NotificationList({
  items,
  onRead,
  emptyTitle,
  emptyBody,
}: {
  items: AppNotification[];
  onRead: (id: string) => void;
  emptyTitle: string;
  emptyBody?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyBody} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inbox</CardTitle>
        <CardDescription>Most recent first.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {items.map((notification) => {
            const Icon = KIND_ICON[notification.kind] ?? Bell;
            return (
              <li key={notification.id} className="flex gap-3 py-3">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-lg"
                  style={{
                    background: `color-mix(in oklch, ${KIND_COLOR[notification.kind]} 12%, transparent)`,
                    color: KIND_COLOR[notification.kind],
                  }}
                >
                  <Icon className="size-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{notification.title}</p>
                    {!notification.read && (
                      <Badge variant="secondary" className="shrink-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.at)} ·{" "}
                      {relativeToToday(notification.at)}
                    </span>
                    {notification.href && (
                      <Button variant="ghost" size="xs" asChild>
                        <Link
                          href={notification.href}
                          onClick={() => onRead(notification.id)}
                        >
                          Open
                        </Link>
                      </Button>
                    )}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
