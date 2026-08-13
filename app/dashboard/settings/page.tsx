import { pageMetadata } from "@/lib/metadata";
import SettingsClient from "./settings-client";

export const metadata = pageMetadata({
  title: "Settings",
  description:
    "Organization profile, task workflow defaults and security policy for your Taskly workspace.",
  path: "/dashboard/settings",
});

export default function SettingsPage() {
  return <SettingsClient />;
}
