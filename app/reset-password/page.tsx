import { pageMetadata } from "@/lib/metadata";
import ResetPasswordClient from "./reset-password-client";

export const metadata = pageMetadata({
  title: "Set a New Password",
  description:
    "Choose a new password for your Taskly Admin account using the secure link sent to your email.",
  path: "/reset-password",
});

export default function ResetPasswordPage() {
  return <ResetPasswordClient />;
}
