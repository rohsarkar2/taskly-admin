import { pageMetadata } from "@/lib/metadata";
import ForgotPasswordClient from "./forgot-password-client";

export const metadata = pageMetadata({
  title: "Forgot Password",
  description:
    "Request a password reset link for your Taskly Admin account and regain access to your organization.",
  path: "/forgot-password",
});

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
