import { pageMetadata } from "@/lib/metadata";
import ProjectsClient from "./projects-client";

export const metadata = pageMetadata({
  title: "Projects",
  description:
    "Create and manage the organization's projects and the members assigned to them.",
  path: "/dashboard/projects",
});

export default function ProjectsPage() {
  return <ProjectsClient />;
}
