"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getErrorMessage, login } from "@/lib/api/auth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setTokens } from "@/lib/redux/slices/authSlice";
import { setUser } from "@/lib/redux/slices/userSlice";
import { consumeRedirect } from "@/lib/auth-redirect";
import {
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2d5a4c] via-[#3a6f5c] to-[#4a8570] p-12 flex-col justify-between relative overflow-hidden flex-shrink-0">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Taskly</h1>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Manage your team
            <br />
            with confidence
          </h2>
          <p className="text-lg text-white/90 max-w-md">
            The complete task management solution for modern organizations.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">
                Team Collaboration
              </h3>
              <p className="text-white/80 text-sm">
                Seamlessly manage projects and track employee progress
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">
                Real-time Analytics
              </h3>
              <p className="text-white/80 text-sm">
                Get insights on productivity and project completion
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white overflow-y-auto flex-shrink-0">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-[#2d5a4c] rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Taskly</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">Sign in to your admin account</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  placeholder="admin@example.com"
                  className="pl-11 h-12 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="pl-11 pr-11 h-12 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-[#2d5a4c] focus:ring-[#2d5a4c]"
                />
                <label htmlFor="remember-me" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#2d5a4c] hover:text-[#234539] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#2d5a4c] to-[#3a6f5c] hover:from-[#234539] hover:to-[#2d5a4c] text-white font-medium shadow-lg shadow-[#2d5a4c]/20 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  New to Taskly?
                </span>
              </div>
            </div>

            <Link href="/sign-up">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 cursor-pointer border-gray-300 hover:border-[#2d5a4c] hover:text-[#2d5a4c] font-medium transition-all duration-200"
              >
                Create an account
              </Button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
