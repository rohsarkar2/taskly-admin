import { pageMetadata } from "@/lib/metadata";
import ActivityLogClient from "./activity-client";

export const metadata = pageMetadata({
  title: "Activity Log",
  description:
    "Every important action taken in the organization, newest first.",
  path: "/dashboard/activity",
});

export default function ActivityLogPage() {
  return <ActivityLogClient />;
}
