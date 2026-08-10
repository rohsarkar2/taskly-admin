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
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  PageHeader,
  SampleDataNotice,
} from "@/components/dashboard/ui-bits";
import { getErrorMessage } from "@/lib/api/auth";
import { toNotifications } from "@/lib/api/adapters";
import {
  clearReadNotifications,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api/notifications";
import { formatDateTime, notifications as seed } from "@/lib/mock-data";
import type { AppNotification, NotificationKind } from "@/lib/types";
import { useAppDispatch } from "@/lib/redux/hooks";
import { refreshUnreadNotifications } from "@/lib/redux/thunks/badges";

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
  const dispatch = useAppDispatch();
  const [list, setList] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [usingSampleData, setUsingSampleData] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    const signal = { cancelled: false };

    const load = async () => {
      try {
        const result = await listNotifications({ limit: 100 });
        if (signal.cancelled) return;

        setList(toNotifications(result.items));
        setUsingSampleData(false);
      } catch (error) {
        if (signal.cancelled) return;
        console.error("Failed to load notifications:", error);
        setList(seed);
        setUsingSampleData(true);
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

  const unread = list.filter((n) => !n.read);

  const markRead = async (id: string) => {
    const previous = list;
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

    if (usingSampleData) return;

    try {
      await markNotificationRead(id);
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not mark it as read."));
    }

    // Outside the try: whether the write landed or rolled back, the badge
    // should end up showing whatever the server now believes.
    dispatch(refreshUnreadNotifications());
  };

  const markAllRead = async () => {
    const previous = list;
    setList((prev) => prev.map((n) => ({ ...n, read: true })));

    if (usingSampleData) {
      toast.success("All notifications marked as read", {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await markAllNotificationsRead();
      toast.success(message || "All notifications marked as read");
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not mark them as read."));
    }

    dispatch(refreshUnreadNotifications());
  };

  const remove = async (id: string) => {
    const previous = list;
    setList((prev) => prev.filter((n) => n.id !== id));

    if (usingSampleData) return;

    try {
      await deleteNotification(id);
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not delete it."));
    }

    // Deleting an unread notification drops the count too.
    dispatch(refreshUnreadNotifications());
  };

  /** Clears everything already read, leaving the unread inbox intact. */
  const clearRead = async () => {
    const previous = list;
    setList((prev) => prev.filter((n) => !n.read));

    if (usingSampleData) {
      toast.success("Read notifications cleared", {
        description: "Sample data — nothing was sent to the server.",
      });
      return;
    }

    try {
      const { message } = await clearReadNotifications();
      toast.success(message || "Read notifications cleared");
    } catch (error) {
      setList(previous);
      toast.error(getErrorMessage(error, "Could not clear them."));
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Registrations, approvals, deadlines and overdue work."
        action={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={clearRead}
              disabled={list.length === unread.length}
            >
              Clear read
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={unread.length === 0}
            >
              Mark all as read
            </Button>
          </>
        }
      />

      {usingSampleData && (
        <SampleDataNotice
          message="Could not reach the notifications API — showing sample data."
          onRetry={refresh}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs defaultValue="unread">
          <TabsList>
            <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
            <TabsTrigger value="all">All ({list.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="mt-4">
            <NotificationList
              items={unread}
              onRead={markRead}
              onDelete={remove}
              emptyTitle="You are all caught up"
              emptyBody="New registrations and approval requests will show up here."
            />
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <NotificationList
              items={list}
              onRead={markRead}
              onDelete={remove}
              emptyTitle="No notifications yet"
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

function NotificationList({
  items,
  onRead,
  onDelete,
  emptyTitle,
  emptyBody,
}: {
  items: AppNotification[];
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
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
                      {formatDateTime(notification.at)}
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
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onDelete(notification.id)}
                    >
                      Delete
                    </Button>
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
