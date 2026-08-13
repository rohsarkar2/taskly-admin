import { pageMetadata } from "@/lib/metadata";
import TasksClient from "./tasks-client";

export const metadata = pageMetadata({
  title: "Tasks",
  description:
    "Every task in the organization, across all projects and employees.",
  path: "/dashboard/tasks",
});

export default function TasksPage() {
  return <TasksClient />;
}
