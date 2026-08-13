import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import EmployeeProfileClient from "./employee-profile-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return pageMetadata({
    title: "Employee Profile",
    description:
      "Profile, projects and task history for an employee in your organization.",
    path: `/dashboard/employees/${id}`,
  });
}

export default function EmployeeProfilePage({ params }: Props) {
  return <EmployeeProfileClient params={params} />;
}
