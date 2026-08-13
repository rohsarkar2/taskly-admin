import { pageMetadata } from "@/lib/metadata";
import ReportsClient from "./reports-client";

export const metadata = pageMetadata({
  title: "Reports",
  description:
    "Build a report from any combination of project, employee, status and date range.",
  path: "/dashboard/reports",
});

export default function ReportsPage() {
  return <ReportsClient />;
}
