import { pageMetadata } from "@/lib/metadata";
import EmployeesClient from "./employees-client";

export const metadata = pageMetadata({
  title: "Employees",
  description:
    "Everyone who has been approved into the organization.",
  path: "/dashboard/employees",
});

export default function EmployeesPage() {
  return <EmployeesClient />;
}
