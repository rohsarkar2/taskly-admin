"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { getErrorMessage, login } from "@/lib/api/auth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setTokens } from "@/lib/redux/slices/authSlice";
import { setUser } from "@/lib/redux/slices/userSlice";
import { consumeRedirect } from "@/lib/auth-redirect";

export default function SignIn() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isRestored = useAppSelector((state) => state.auth.isRestored);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Already signed in — skip the form. Waits for the restore so this does not
  // fire against a not-yet-known session.
  useEffect(() => {
    if (!isRestored || !isAuthenticated) return;
    router.replace(consumeRedirect() ?? "/dashboard");
  }, [isRestored, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { message, data } = await login({
        email: formData.email,
        password: formData.password,
      });

      // Store tokens in Redux (which also stores in sessionStorage)
      dispatch(
        setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      );

      // Store the user whole — the payload carries role, avatar and
      // designation too, and cherry-picking fields would drop them.
      dispatch(setUser(data.user));

      toast.success(message || "Logged in successfully!");

      // Return to whatever the admin was trying to open, if anything.
      router.push(consumeRedirect() ?? "/dashboard");
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, "Failed to sign in. Please try again."),
      );
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Taskly Admin
          </CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm text-muted-foreground"
                >
                  Remember me
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#2d5a4c] hover:text-[#234539]"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2d5a4c] hover:bg-[#234539]"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="font-medium text-[#2d5a4c] hover:text-[#234539]"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
