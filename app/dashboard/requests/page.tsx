import { pageMetadata } from "@/lib/metadata";
import EmployeeRequestsClient from "./requests-client";

export const metadata = pageMetadata({
  title: "Employee Requests",
  description:
    "Approve or reject employees who registered for your organization from the mobile app.",
  path: "/dashboard/requests",
});

export default function EmployeeRequestsPage() {
  return <EmployeeRequestsClient />;
}
