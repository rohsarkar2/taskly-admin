import { pageMetadata } from "@/lib/metadata";
import NotificationsClient from "./notifications-client";

export const metadata = pageMetadata({
  title: "Notifications",
  description:
    "Registrations, approvals, deadlines and overdue work that need your attention.",
  path: "/dashboard/notifications",
});

export default function NotificationsPage() {
  return <NotificationsClient />;
}
