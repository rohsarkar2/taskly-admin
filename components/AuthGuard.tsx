"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/lib/redux/hooks";
import { rememberRedirect } from "@/lib/auth-redirect";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isRestored = useAppSelector((state) => state.auth.isRestored);

  useEffect(() => {
    if (!isRestored || isAuthenticated) return;

    rememberRedirect(pathname);
    router.replace("/sign-in");
  }, [isRestored, isAuthenticated, pathname, router]);

  if (!isRestored) return <DashboardLoading />;

  if (!isAuthenticated) return null;

  return <>{children}</>;
}

function DashboardLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col gap-6 p-6" aria-busy>
      <span className="sr-only">Restoring your session…</span>
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}
