"use client";

import Link from "next/link";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Bell, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthGuard } from "@/components/AuthGuard";
import { useAppSelector } from "@/lib/redux/hooks";
import { formatDate, notifications, organizationSettings } from "@/lib/mock-data";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organization = useAppSelector((state) => state.user.organization);
  const orgId =
    organization?.uniqueOrganizationId ??
    organizationSettings.uniqueOrganizationId;

  const unread = notifications.filter((n) => !n.read);

  const copyOrgId = async () => {
    try {
      await navigator.clipboard.writeText(orgId);
      toast.success("Organization ID copied", {
        description: "Share it with employees so they can register in the app.",
      });
    } catch {
      toast.error("Could not copy the organization ID");
    }
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            {/* The organization ID employees need to register from the app */}
            <Button
              variant="outline"
              size="sm"
              onClick={copyOrgId}
              className="hidden font-mono text-xs sm:inline-flex"
              title="Copy organization ID"
            >
              {orgId}
              <Copy data-icon="inline-end" />
            </Button>

            <div className="ml-auto flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`Notifications, ${unread.length} unread`}
                  >
                    <Bell className="size-5" />
                    {unread.length > 0 && (
                      <span className="absolute top-1 right-1 grid size-3.5 place-items-center rounded-full bg-[var(--viz-critical)] text-[0.55rem] font-bold text-white">
                        {unread.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications
                    <Badge variant="secondary">{unread.length} new</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem key={n.id} asChild>
                      <Link
                        href={n.href ?? "/dashboard/notifications"}
                        className="flex flex-col items-start gap-0.5 py-2"
                      >
                        <span className="text-xs font-medium">{n.title}</span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </span>
                        <span className="text-[0.65rem] text-muted-foreground">
                          {formatDate(n.at)}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/notifications"
                      className="justify-center text-xs"
                    >
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
