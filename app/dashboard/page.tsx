import { pageMetadata } from "@/lib/metadata";
import DashboardClient from "./dashboard-client";

export const metadata = pageMetadata({
  title: "Dashboard",
  description:
    "Organization overview: task and project progress, pending registrations and recent activity at a glance.",
  path: "/dashboard",
});

export default function DashboardPage() {
  return <DashboardClient />;
}
