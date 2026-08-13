import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { siteDescription } from "@/lib/metadata";

export const metadata: Metadata = {
  title: { absolute: "Taskly Admin — Task Management Dashboard" },
  description: siteDescription,
  alternates: { canonical: "/" },
};

export default function Home() {
  redirect("/sign-in");
}
