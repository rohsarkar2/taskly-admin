import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ProjectDetailClient from "./project-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return pageMetadata({
    title: "Project Details",
    description:
      "Status, members, tasks and progress for a single project in your organization.",
    path: `/dashboard/projects/${id}`,
  });
}

export default function ProjectDetailPage({ params }: Props) {
  return <ProjectDetailClient params={params} />;
}
