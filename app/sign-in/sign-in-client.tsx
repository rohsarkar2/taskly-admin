"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getErrorMessage, login } from "@/lib/api/auth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setTokens } from "@/lib/redux/slices/authSlice";
import { setUser } from "@/lib/redux/slices/userSlice";
import { consumeRedirect } from "@/lib/auth-redirect";
import { getRememberedEmail, rememberEmail } from "@/lib/auth-storage";
import {
  Mail,
  Lock,
  ArrowRight,
  Users,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react";

const subscribeToNothing = () => () => {};

export default function SignInClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isRestored = useAppSelector((state) => state.auth.isRestored);

  const rememberedEmail = useSyncExternalStore(
    subscribeToNothing,
    getRememberedEmail,
    () => null,
  );

  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const [rememberChoice, setRememberChoice] = useState<boolean | null>(null);

  const email = typedEmail ?? rememberedEmail ?? "";
  const rememberMe = rememberChoice ?? rememberedEmail !== null;

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isRestored || !isAuthenticated) return;
    router.replace(consumeRedirect() ?? "/dashboard");
  }, [isRestored, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { message, data } = await login({ email, password });

      rememberEmail(rememberMe ? email : null);

      dispatch(
        setTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          remember: rememberMe,
        }),
      );

      dispatch(setUser(data.user));

      toast.success(message || "Logged in successfully!");

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#2d5a4c] via-[#3a6f5c] to-[#4a8570] p-12 flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center  mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-start">
              <Image
                src="/images/taskly-logo.png"
                alt="Taskly"
                width={48}
                height={48}
                className="rounded-2xl"
              />
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
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
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
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
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

      <div className="w-full lg:w-1/2 flex items-start justify-center p-4 sm:p-6 md:p-8 md:pt-14 bg-linear-to-br from-gray-50 to-white overflow-y-auto shrink-0 min-h-screen">
        <div className="w-full max-w-md py-2 sm:py-0">
          <div className="lg:hidden ">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-[#2d5a4c]/30 mb-4">
                <Image
                  src="/images/taskly-logo.png"
                  alt="Taskly"
                  width={64}
                  height={64}
                  className="rounded-2xl"
                />
              </div>
              <h1 className="text-3xl font-bold bg-linear-to-r from-[#2d5a4c] to-[#3a6f5c] bg-clip-text text-transparent">
                Taskly
              </h1>
              <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
            </div>
          </div>

          <div className="hidden lg:block mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">Sign in to your admin account</p>
          </div>

          <div className="lg:hidden mb-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Sign in to continue
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 block"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setTypedEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="pl-11 h-12 sm:h-14 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c] text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 block"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-11 pr-12 h-12 sm:h-14 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c] text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 touch-manipulation"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberChoice(e.target.checked)}
                  className="h-4 w-4 sm:h-5 sm:w-5 rounded border-gray-300 accent-[#2d5a4c] focus:ring-[#2d5a4c] cursor-pointer touch-manipulation"
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm sm:text-base text-gray-600 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm sm:text-base font-medium text-[#2d5a4c] hover:text-[#234539] transition-colors touch-manipulation"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 sm:h-14 bg-linear-to-r from-[#2d5a4c] to-[#3a6f5c] hover:from-[#234539] hover:to-[#2d5a4c] text-white font-semibold shadow-lg shadow-[#2d5a4c]/20 transition-all duration-200 text-base touch-manipulation"
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
                <span className="px-4 bg-white text-gray-500 sm:text-base">
                  New to Taskly?
                </span>
              </div>
            </div>

            <Link href="/sign-up" className="block">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 sm:h-14 border-2 cursor-pointer border-gray-300 hover:border-[#2d5a4c] hover:text-[#2d5a4c] font-medium transition-all duration-200 text-base touch-manipulation"
              >
                Create an account
              </Button>
            </Link>
          </form>

          <div className="lg:hidden mt-6 pt-4 border-t border-gray-200">
            <p className="text-center text-xs sm:text-sm text-gray-500">
              By signing in, you agree to our{" "}
              <Link
                href="#"
                className="text-[#2d5a4c] hover:underline font-medium"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="#"
                className="text-[#2d5a4c] hover:underline font-medium"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
