"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  CheckSquare,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  LogOut,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clearTokens } from "@/lib/redux/slices/authSlice";
import {
  clearUser,
  setUser,
  setOrganization,
} from "@/lib/redux/slices/userSlice";
import {
  getAdminDetails,
  getOrganization,
  logout as logoutRequest,
} from "@/lib/api/auth";
import { toast } from "sonner";
import {
  initialsOf,
  notifications,
  pendingApprovalTasks,
  pendingEmployees,
} from "@/lib/mock-data";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Count shown as a badge; omitted when zero. */
  badge?: number;
  /** Nested routes that should also light this item up. */
  matchPrefix?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const unreadNotifications = notifications.filter((n) => !n.read).length;

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
      { title: "Reports", url: "/dashboard/reports", icon: FileText },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "Employee Requests",
        url: "/dashboard/requests",
        icon: UserPlus,
        badge: pendingEmployees.length,
      },
      {
        title: "Employees",
        url: "/dashboard/employees",
        icon: Users,
        matchPrefix: true,
      },
    ],
  },
  {
    label: "Work",
    items: [
      {
        title: "Projects",
        url: "/dashboard/projects",
        icon: FolderKanban,
        matchPrefix: true,
      },
      {
        title: "Tasks",
        url: "/dashboard/tasks",
        icon: ClipboardList,
        matchPrefix: true,
      },
      {
        title: "Approvals",
        url: "/dashboard/approvals",
        icon: CheckSquare,
        badge: pendingApprovalTasks.length,
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        title: "Notifications",
        url: "/dashboard/notifications",
        icon: Bell,
        badge: unreadNotifications,
      },
      { title: "Activity Log", url: "/dashboard/activity", icon: Activity },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const organization = useAppSelector((state) => state.user.organization);

  // Fetch user and organization details on mount
  React.useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const [details, organizationResponse] = await Promise.all([
          getAdminDetails(),
          getOrganization(),
        ]);

        dispatch(setUser(details.data.user));
        dispatch(setOrganization(organizationResponse.data.organization));
      } catch (error) {
        console.error("Failed to fetch user/organization details:", error);
      }
    };

    if (!user || !organization) {
      fetchUserDetails();
    }
  }, [dispatch, user, organization]);

  const handleSignOut = async () => {
    try {
      const { message } = await logoutRequest();
      dispatch(clearTokens());
      dispatch(clearUser());
      toast.success(message || "Logged out successfully.");
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear tokens and redirect even if logout call fails
      dispatch(clearTokens());
      dispatch(clearUser());
      router.push("/sign-in");
    }
  };

  const isActive = (item: NavItem) =>
    item.matchPrefix ? pathname.startsWith(item.url) : pathname === item.url;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#2d5a4c] text-white">
                  <span className="text-lg font-bold">
                    {organization?.name?.[0]?.toUpperCase() || "T"}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {organization?.name || "Taskly Admin"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {organization?.uniqueOrganizationId || "Task Management"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item)}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {!!item.badge && (
                      <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={user?.name || "Admin"}>
              <Link href="/dashboard/settings">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-[#2d5a4c] text-white">
                    {user ? initialsOf(user.name) : "AD"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.name || "Admin"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || "admin@taskly.com"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
