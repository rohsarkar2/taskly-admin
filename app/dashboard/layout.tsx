"use client";

import * as React from "react";
import Link from "next/link";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Bell, Copy, User, Settings, LogOut, Building2 } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthGuard } from "@/components/AuthGuard";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { toNotifications } from "@/lib/api/adapters";
import { listNotifications } from "@/lib/api/notifications";
import {
  formatDateTime,
  organizationSettings,
  initialsOf,
} from "@/lib/mock-data";
import type { AppNotification } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { clearTokens } from "@/lib/redux/slices/authSlice";
import { clearUser } from "@/lib/redux/slices/userSlice";
import { logout as logoutRequest } from "@/lib/api/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const organization = useAppSelector((state) => state.user.organization);
  const orgId =
    organization?.uniqueOrganizationId ??
    organizationSettings.uniqueOrganizationId;

  /**
   * The bell shows the five most recent notifications. Failures are silent —
   * an unreachable inbox should not block the dashboard chrome.
   */
  const [notifications, setNotifications] = React.useState<AppNotification[]>(
    [],
  );

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const result = await listNotifications({ limit: 20 });
        if (!cancelled) setNotifications(toNotifications(result.items));
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleSignOut = async () => {
    try {
      const { message } = await logoutRequest();
      dispatch(clearTokens());
      dispatch(clearUser());
      toast.success(message || "Logged out successfully.");
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(clearTokens());
      dispatch(clearUser());
      router.push("/sign-in");
    }
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-4" />

            {/* Organization Info */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-1.5">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">
                  {organization?.name || "Taskly"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyOrgId}
                className="hidden lg:inline-flex font-mono text-xs h-8 border-gray-200 hover:bg-gray-50 hover:border-[#2d5a4c] transition-colors"
                title="Copy organization ID"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                {orgId}
              </Button>
            </div>

            <div className="ml-auto flex items-center gap-2">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 hover:bg-gray-100"
                    aria-label={`Notifications, ${unread.length} unread`}
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unread.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#2d5a4c] text-[0.6rem] font-bold text-white ring-2 ring-white">
                        {unread.length > 9 ? "9+" : unread.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[380px] max-h-[500px] overflow-y-auto"
                >
                  <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
                    <span className="text-base font-semibold">
                      Notifications
                    </span>
                    {unread.length > 0 && (
                      <Badge className="bg-[#2d5a4c] hover:bg-[#234539]">
                        {unread.length} new
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <Bell className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-600">
                        No notifications
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        You&apos;re all caught up!
                      </p>
                    </div>
                  )}
                  {notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      asChild
                      className="cursor-pointer"
                    >
                      <Link
                        href={n.href ?? "/dashboard/notifications"}
                        className="flex flex-col items-start gap-1.5 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <span className="text-sm font-medium text-gray-900 line-clamp-1">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-[#2d5a4c] flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <span className="line-clamp-2 text-xs text-gray-600 leading-relaxed">
                          {n.body}
                        </span>
                        <span className="text-[0.7rem] text-gray-500 mt-0.5">
                          {formatDateTime(n.at)}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  {notifications.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link
                          href="/dashboard/notifications"
                          className="flex items-center justify-center py-3 text-sm font-medium text-[#2d5a4c] hover:text-[#234539] hover:bg-gray-50 transition-colors"
                        >
                          View all notifications
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-9 px-2 hover:bg-gray-100"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-gradient-to-br from-[#2d5a4c] to-[#3a6f5c] text-white text-xs font-semibold">
                        {user ? initialsOf(user.name) : "AD"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm font-medium text-gray-700">
                      {user?.name || "Admin"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-900">
                      {user?.name || "Admin"}
                    </span>
                    <span className="text-xs font-normal text-gray-500">
                      {user?.email || "admin@taskly.com"}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 bg-gray-50/30">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  );
}
