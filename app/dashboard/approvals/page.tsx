import { pageMetadata } from "@/lib/metadata";
import ApprovalsClient from "./approvals-client";

export const metadata = pageMetadata({
  title: "Approval Center",
  description:
    "Review tasks whose project requires approval before work can be closed.",
  path: "/dashboard/approvals",
});

export default function ApprovalsPage() {
  return <ApprovalsClient />;
}
