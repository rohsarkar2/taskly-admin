"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ExpiryCountdown,
  NewPasswordForm,
} from "@/components/auth/new-password-form";
import {
  forgotPassword,
  getErrorMessage,
  verifyResetOtp,
} from "@/lib/api/auth";
import {
  Mail,
  ArrowRight,
  Shield,
  Clock,
  KeyRound,
  ArrowLeft,
} from "lucide-react";

type Step = "email" | "otp" | "password";

const OTP_LENGTH = 6;

export default function ForgotPasswordClient() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!email) {
      toast.error("Enter the email address on your admin account");
      return;
    }

    setIsLoading(true);
    try {
      const { message, data } = await forgotPassword({ email });

      setResetToken("");
      setOtp("");
      setDevOtp(data?.otp ?? null);
      setOtpExpiresAt(data?.expiresAt ?? null);
      setStep("otp");

      toast.success(
        message ||
          "If an account exists for that email, a verification code has been sent.",
      );
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Could not send the verification code. Please try again.",
        ),
      );
      console.error("Forgot password error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();

    if (otp.length !== OTP_LENGTH) {
      toast.error(`Enter the ${OTP_LENGTH}-digit code`);
      return;
    }

    setIsLoading(true);
    try {
      const { message, data } = await verifyResetOtp({ email, otp });
      setResetToken(data.resetToken);
      setTokenExpiresAt(data.expiresAt ?? null);
      setStep("password");
      toast.success(message || "Verification code accepted");
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "The verification code is invalid or has expired",
        ),
      );
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDone = useCallback(
    (message: string) => {
      toast.success(message, {
        description: "Sign in with your new password.",
      });
      router.push("/sign-in");
    },
    [router],
  );

  return (
    <div className="h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#2d5a4c] via-[#3a6f5c] to-[#4a8570] p-12 flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
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
            Secure account
            <br />
            recovery
          </h2>
          <p className="text-lg text-white/90 max-w-md">
            Reset your password in just a few simple steps.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">
                Secure verification
              </h3>
              <p className="text-white/80 text-sm">
                Your identity is verified through a secure one-time code
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Quick recovery</h3>
              <p className="text-white/80 text-sm">
                Regain access to your account in under a minute
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-linear-to-br from-gray-50 to-white overflow-y-auto shrink-0">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                <Image
                  src="/images/taskly-logo.png"
                  alt="Taskly"
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Taskly</h1>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reset your password
            </h2>
            <p className="text-gray-600">
              {step === "email" &&
                "We will email you a six-digit verification code."}
              {step === "otp" && `Enter the code we sent to ${email}.`}
              {step === "password" &&
                "Choose a password you have not used before."}
            </p>
          </div>

          <div className="mb-6">
            <StepIndicator step={step} />
          </div>

          {step === "email" && (
            <form className="space-y-5" onSubmit={requestCode}>
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
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="pl-11 h-12 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-linear-to-r from-[#2d5a4c] to-[#3a6f5c] hover:from-[#234539] hover:to-[#2d5a4c] text-white font-medium shadow-lg shadow-[#2d5a4c]/20 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Sending…"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send verification code
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Remembered it?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-[#2d5a4c] hover:text-[#234539] transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}

          {step === "otp" && (
            <form className="space-y-5" onSubmit={submitCode}>
              {devOtp && (
                <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
                  <p className="text-xs text-amber-800 font-medium mb-1">
                    Development mode only
                  </p>
                  <p className="text-sm text-amber-900">
                    Your code is{" "}
                    <span className="font-mono font-bold text-lg text-amber-950">
                      {devOtp}
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="otp"
                  className="text-sm font-medium text-gray-700"
                >
                  Verification code
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern={`\\d{${OTP_LENGTH}}`}
                    maxLength={OTP_LENGTH}
                    required
                    autoFocus
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH),
                      )
                    }
                    placeholder="000000"
                    className="pl-11 h-14 text-center font-mono text-2xl tracking-[0.6em] border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                  />
                </div>
                {otpExpiresAt && (
                  <div className="pt-1">
                    <ExpiryCountdown
                      expiresAt={otpExpiresAt}
                      label="This code"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                  <Shield className="w-3.5 h-3.5" />
                  Five incorrect attempts will invalidate the code.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-linear-to-r from-[#2d5a4c] to-[#3a6f5c] hover:from-[#234539] hover:to-[#2d5a4c] text-white font-medium shadow-lg shadow-[#2d5a4c]/20 transition-all duration-200"
                disabled={isLoading || otp.length !== OTP_LENGTH}
              >
                {isLoading ? (
                  "Verifying…"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Verify code
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("email")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Change email
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => requestCode()}
                  disabled={isLoading}
                  className="text-[#2d5a4c] hover:text-[#234539] font-medium"
                >
                  Resend code
                </Button>
              </div>
            </form>
          )}

          {step === "password" && (
            <div className="space-y-5">
              {tokenExpiresAt && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <ExpiryCountdown
                    expiresAt={tokenExpiresAt}
                    label="This reset window"
                  />
                </div>
              )}
              <NewPasswordForm token={resetToken} onDone={handleDone} />
              <div className="text-center pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("otp")}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to the code
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STEPS: { key: Step; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "otp", label: "Code" },
  { key: "password", label: "Password" },
];

function StepIndicator({ step }: { step: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="w-full">
      <div className="flex items-center mb-3">
        {STEPS.map((entry, index) => {
          const state =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "upcoming";

          return (
            <div
              key={entry.key}
              className="flex items-center flex-1 last:flex-none"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                  state === "upcoming"
                    ? "bg-gray-200 text-gray-500"
                    : state === "current"
                      ? "bg-linear-to-br from-[#2d5a4c] to-[#3a6f5c] text-white shadow-lg shadow-[#2d5a4c]/30"
                      : "bg-[#2d5a4c] text-white"
                }`}
              >
                {state === "done" ? (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20 6L9 17L4 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-3">
                  <div
                    className={`h-full transition-all duration-300 ${
                      index < currentIndex ? "bg-[#2d5a4c]" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center">
        {STEPS.map((entry, index) => {
          const state =
            index < currentIndex
              ? "done"
              : index === currentIndex
                ? "current"
                : "upcoming";

          return (
            <div
              key={`label-${entry.key}`}
              className="flex items-center flex-1 last:flex-none"
            >
              <span
                className={`w-10 text-center text-xs font-medium ${
                  state === "current"
                    ? "text-gray-900"
                    : state === "done"
                      ? "text-gray-600"
                      : "text-gray-400"
                }`}
              >
                {entry.label}
              </span>
              {index < STEPS.length - 1 && <div className="flex-1 mx-3" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
