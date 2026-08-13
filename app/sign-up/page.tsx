import { pageMetadata } from "@/lib/metadata";
import SignUpClient from "./sign-up-client";

export const metadata = pageMetadata({
  title: "Create Account",
  description:
    "Create a Taskly Admin account and set up your organization to start managing projects, tasks and employees.",
  path: "/sign-up",
});

export default function SignUpPage() {
  return <SignUpClient />;
}
