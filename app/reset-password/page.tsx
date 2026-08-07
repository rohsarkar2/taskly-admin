"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getErrorMessage, resetPassword } from "@/lib/api/auth";

export default function ResetPassword() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Suspense fallback={<Skeleton className="h-80 w-full max-w-md" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The email link carries the single-use token: /reset-password?token=…
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { message } = await resetPassword({ token, password });
      toast.success(message || "Password reset successfully.", {
        description: "Sign in with your new password.",
      });
      router.push("/sign-in");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error,
          "Could not reset the password. The link may have expired.",
        ),
      );
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      <CardContent>
        {!token && (
          <p className="mb-4 rounded-lg border border-l-4 border-l-(--viz-critical) p-3 text-sm text-muted-foreground">
            This link is missing its reset token.{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-[#2d5a4c] hover:text-[#234539]"
            >
              Request a new one
            </Link>
            .
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter the password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#2d5a4c] hover:bg-[#234539]"
            disabled={isLoading || !token}
          >
            {isLoading ? "Updating…" : "Update password"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <Link
              href="/sign-in"
              className="font-medium text-[#2d5a4c] hover:text-[#234539]"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
