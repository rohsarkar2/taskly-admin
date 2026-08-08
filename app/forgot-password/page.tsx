"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
import {
  ExpiryCountdown,
  NewPasswordForm,
} from "@/components/auth/new-password-form";
import { forgotPassword, getErrorMessage, verifyResetOtp } from "@/lib/api/auth";

/**
 * Password reset, in three steps.
 *
 * email → six-digit code → new password. The code only proves the admin owns
 * the mailbox; verifying it trades it for a single-use token, and only that
 * token can set the password.
 */
type Step = "email" | "otp" | "password";

const OTP_LENGTH = 6;

export default function ForgotPassword() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  /** Only ever set outside production, where the API echoes the code back. */
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

      // A new code invalidates any token an earlier verification handed out.
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
      // The backend answers identically for a wrong code, an expired code and
      // an unknown email, so surface its message rather than guessing.
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
      toast.success(message, { description: "Sign in with your new password." });
      router.push("/sign-in");
    },
    [router],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Reset your password
          </CardTitle>
          <CardDescription>
            {step === "email" &&
              "We will email you a six-digit verification code."}
            {step === "otp" && `Enter the code we sent to ${email}.`}
            {step === "password" && "Choose a password you have not used before."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <StepIndicator step={step} />

          {/* Step 1 — email --------------------------------------------- */}
          {step === "email" && (
            <form className="space-y-4" onSubmit={requestCode}>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
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
                {isLoading ? "Sending…" : "Send verification code"}
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

          {/* Step 2 — verification code --------------------------------- */}
          {step === "otp" && (
            <form className="space-y-4" onSubmit={submitCode}>
              {devOtp && (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Development only — your code is{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {devOtp}
                  </span>
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
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
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                  }
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-[0.6em]"
                />
                {otpExpiresAt && (
                  <ExpiryCountdown expiresAt={otpExpiresAt} label="This code" />
                )}
                <p className="text-xs text-muted-foreground">
                  Five incorrect attempts will invalidate the code.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#2d5a4c] hover:bg-[#234539]"
                disabled={isLoading || otp.length !== OTP_LENGTH}
              >
                {isLoading ? "Verifying…" : "Verify code"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("email")}
                >
                  ← Change email
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => requestCode()}
                  disabled={isLoading}
                >
                  Resend code
                </Button>
              </div>
            </form>
          )}

          {/* Step 3 — new password -------------------------------------- */}
          {step === "password" && (
            <>
              {tokenExpiresAt && (
                <ExpiryCountdown
                  expiresAt={tokenExpiresAt}
                  label="This reset window"
                />
              )}
              <NewPasswordForm token={resetToken} onDone={handleDone} />
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("otp")}
                >
                  ← Back to the code
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
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
    <ol className="flex items-center gap-2" aria-label="Progress">
      {STEPS.map((entry, index) => {
        const state =
          index < currentIndex
            ? "done"
            : index === currentIndex
              ? "current"
              : "upcoming";

        return (
          <li key={entry.key} className="flex flex-1 items-center gap-2">
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={
                "grid size-5 shrink-0 place-items-center rounded-full text-[0.65rem] font-semibold " +
                (state === "upcoming"
                  ? "bg-muted text-muted-foreground"
                  : "bg-[#2d5a4c] text-white")
              }
            >
              {state === "done" ? "✓" : index + 1}
            </span>
            <span
              className={
                "text-xs " +
                (state === "current"
                  ? "font-medium text-foreground"
                  : "text-muted-foreground")
              }
            >
              {entry.label}
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden className="h-px flex-1 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
