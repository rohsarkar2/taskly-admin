"use client";

import Link from "next/link";
import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewPasswordForm } from "@/components/auth/new-password-form";

/**
 * Direct entry into the last step of the reset flow, for a link that already
 * carries a reset token: `/reset-password?token=…`.
 *
 * The normal path is the `/forgot-password` wizard, which obtains that token by
 * verifying the emailed code. Without a token there is nothing this page can
 * do, so it points back there.
 */
export default function ResetPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Suspense fallback={<Skeleton className="h-80 w-full max-w-md" />}>
        <ResetPasswordCard />
      </Suspense>
    </div>
  );
}

function ResetPasswordCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const handleDone = useCallback(
    (message: string) => {
      toast.success(message, { description: "Sign in with your new password." });
      router.push("/sign-in");
    },
    [router],
  );

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold tracking-tight">
          Set a new password
        </CardTitle>
        <CardDescription>
          Choose a password you have not used before.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {token ? (
          <NewPasswordForm token={token} onDone={handleDone} />
        ) : (
          <p className="rounded-lg border border-l-4 border-l-(--viz-critical) p-3 text-sm text-muted-foreground">
            This link is missing its reset token. Start the reset from{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-[#2d5a4c] hover:text-[#234539]"
            >
              forgot password
            </Link>{" "}
            — we will email you a verification code.
          </p>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-[#2d5a4c] hover:text-[#234539]"
          >
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
