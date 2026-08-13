"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { clearTokens } from "@/lib/redux/slices/authSlice";
import {
  clearUser,
  setUser,
  setOrganization,
} from "@/lib/redux/slices/userSlice";
import {
  clearBadgeCounts,
  type BadgeKey,
} from "@/lib/redux/slices/badgesSlice";
import { fetchBadgeCounts } from "@/lib/redux/thunks/badges";
import { getAdminDetails, logout as logoutRequest } from "@/lib/api/auth";
import { getOrganization } from "@/lib/api/organization";
import { toast } from "sonner";
import { initialsOf } from "@/lib/mock-data";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: BadgeKey;
  matchPrefix?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const formatBadge = (count: number) => (count > 99 ? "99+" : String(count));

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
        badgeKey: "employeeRequests",
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
        badgeKey: "approvals",
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
        badgeKey: "notifications",
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
  const badges = useAppSelector((state) => state.badges);

  React.useEffect(() => {
    dispatch(fetchBadgeCounts());
  }, [dispatch]);

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

  const [signOutOpen, setSignOutOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      const { message } = await logoutRequest();
      dispatch(clearTokens());
      dispatch(clearUser());
      dispatch(clearBadgeCounts());
      toast.success(message || "Logged out successfully.");
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(clearTokens());
      dispatch(clearUser());
      dispatch(clearBadgeCounts());
      router.push("/sign-in");
    }
  };

  const isActive = (item: NavItem) =>
    item.matchPrefix ? pathname.startsWith(item.url) : pathname === item.url;

  return (
    <>
      <Sidebar collapsible="icon" {...props} className="border-r-0">
        <SidebarHeader className="border-b border-gray-200 bg-linear-to-b from-white to-gray-50/50 transition-[padding] duration-200 ease-linear group-data-[collapsible=icon]:py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-gray-100 data-[state=open]:bg-gray-100 "
              >
                <Link href="/dashboard">
                  <div className="flex aspect-square size-9 shrink-0 items-center justify-center transition-[width,height] duration-200 ease-linear group-data-[collapsible=icon]:size-8">
                    <Image
                      src="/images/taskly-logo.png"
                      alt="Taskly"
                      width={36}
                      height={36}
                      className="size-full rounded-xl object-contain"
                    />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0">
                    <span className="truncate font-bold text-gray-900 text-base">
                      Taskly
                    </span>
                    <span className="truncate text-xs text-gray-500 font-medium">
                      Admin Dashboard
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="bg-white">
          {navGroups.map((group, groupIndex) => (
            <SidebarGroup
              key={group.label}
              className={groupIndex > 0 ? "mt-2" : ""}
            >
              <SidebarGroupLabel className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isActive(item);
                    const count =
                      item.badgeKey && badges.loaded ? badges[item.badgeKey] : 0;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                          className={
                            active
                              ? "bg-linear-to-r from-[#2d5a4c]/20 to-[#3a6f5c]/0 data-active:bg-transparent active:bg-transparent text-[#2d5a4c] font-semibold border-l-3 border-[#2d5a4c] hover:bg-transparent hover:from-[#2d5a4c]/30 hover:to-[#3a6f5c]/10"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }
                        >
                          <Link
                            href={item.url}
                            className="flex items-center gap-3"
                          >
                            <item.icon className={active ? "size-5" : "size-4"} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="border-t border-gray-200 bg-linear-to-t from-gray-50/50 to-white">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip={user?.name || "Admin"}
                className="hover:bg-gray-100 data-[state=open]:bg-gray-100"
              >
                <Link href="/dashboard/settings">
                  <Avatar className="size-9 shrink-0 ring-2 ring-gray-200 transition-[width,height] duration-200 ease-linear group-data-[collapsible=icon]:size-7">
                    <AvatarFallback className="bg-linear-to-br from-[#2d5a4c] to-[#3a6f5c] text-white font-semibold">
                      {user ? initialsOf(user.name) : "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight transition-opacity duration-200 ease-linear group-data-[collapsible=icon]:opacity-0">
                    <span className="truncate font-semibold text-gray-900">
                      {user?.name || "Admin"}
                    </span>
                    <span className="truncate text-xs text-gray-500">
                      {user?.email || "admin@taskly.com"}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setSignOutOpen(true)}
                tooltip="Sign Out"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
              >
                <LogOut className="size-4" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SignOutDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        onConfirm={handleSignOut}
      />
    </>
  );
}

export function SignOutDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign out of Taskly Admin?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be returned to the sign-in page and will need your
            credentials to get back in. Any unsaved changes on this page are
            lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
