"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { forgotPassword, getErrorMessage } from "@/lib/api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Enter the email address on your admin account");
      return;
    }

    setIsLoading(true);
    try {
      const { message } = await forgotPassword({ email });
      setSent(true);
      toast.success(message || "Reset link sent");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error,
          "Could not send the reset link. Please try again.",
        ),
      );
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Reset your password
          </CardTitle>
          <CardDescription>
            {sent
              ? "Check your inbox for the reset link."
              : "We will email you a link to set a new password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="rounded-lg border p-3 text-sm text-muted-foreground">
                If an admin account exists for <strong>{email}</strong>, a reset
                link is on its way. The link expires in 30 minutes and can only
                be used once.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSent(false)}
              >
                Send to a different email
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <Link
                  href="/sign-in"
                  className="font-medium text-[#2d5a4c] hover:text-[#234539]"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#2d5a4c] hover:bg-[#234539]"
                disabled={isLoading}
              >
                {isLoading ? "Sending…" : "Send reset link"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-[#2d5a4c] hover:text-[#234539]"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
