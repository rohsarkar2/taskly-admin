import { pageMetadata } from "@/lib/metadata";
import SignInClient from "./sign-in-client";

export const metadata = pageMetadata({
  title: "Sign In",
  description:
    "Sign in to Taskly Admin to manage your organization's projects, tasks and team.",
  path: "/sign-in",
});

export default function SignInPage() {
  return <SignInClient />;
}
