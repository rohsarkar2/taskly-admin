"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ClipboardList,
  FolderKanban,
  Users,
  BarChart3,
  Settings,
  LogOut,
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
import { axiosPrivate } from "@/app/axios/Axios";
import { toast } from "sonner";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: ClipboardList,
  },
  {
    title: "Projects",
    url: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    title: "Team",
    url: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
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
        const [userResponse, orgResponse] = await Promise.all([
          axiosPrivate.get("/admin/details"),
          axiosPrivate.get("/admin/organization"),
        ]);

        dispatch(setUser(userResponse.data.user));
        dispatch(setOrganization(orgResponse.data.organization));
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
      await axiosPrivate.post("/admin/logout", {});
      dispatch(clearTokens());
      dispatch(clearUser());
      toast.success("Signed out successfully");
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear tokens and redirect even if logout call fails
      dispatch(clearTokens());
      dispatch(clearUser());
      router.push("/sign-in");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-[#2d5a4c] text-white">
                  <span className="font-bold text-lg">
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
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="h-8 w-8 bg-[#2d5a4c]">
                  <AvatarFallback className="bg-[#2d5a4c] text-white">
                    {user ? getInitials(user.name) : "AD"}
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
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
