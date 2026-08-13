import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import TaskDetailClient from "./task-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return pageMetadata({
    title: "Task Details",
    description:
      "Status, assignee, comments and approval history for a single task.",
    path: `/dashboard/tasks/${id}`,
  });
}

export default function TaskDetailPage({ params }: Props) {
  return <TaskDetailClient params={params} />;
}
