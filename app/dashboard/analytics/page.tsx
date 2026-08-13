import { pageMetadata } from "@/lib/metadata";
import AnalyticsClient from "./analytics-client";

export const metadata = pageMetadata({
  title: "Analytics",
  description:
    "Productivity and delivery metrics across the whole organization.",
  path: "/dashboard/analytics",
});

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
