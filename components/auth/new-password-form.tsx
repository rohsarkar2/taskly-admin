"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, resetPassword } from "@/lib/api/auth";
import { Eye, EyeOff } from "lucide-react";

export function NewPasswordForm({
  token,
  minLength = 8,
  onDone,
  submitLabel = "Update password",
}: {
  token: string;
  minLength?: number;
  onDone: (message: string) => void;
  submitLabel?: string;
}) {
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (password.length < minLength) {
      toast.error(`Password must be at least ${minLength} characters`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { message } = await resetPassword({ token, newPassword: password });
      onDone(message || "Password reset successfully. Please log in.");
    } catch (error) {
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <div className="relative">
          <Input
            id="new-password"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`At least ${minLength} characters`}
            className="pr-10"
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

      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirm-new-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter the password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Setting a new password signs you out everywhere else.
      </p>

      <Button
        type="submit"
        className="w-full bg-[#2d5a4c] hover:bg-[#234539]"
        disabled={isLoading}
      >
        {isLoading ? "Updating…" : submitLabel}
      </Button>
    </form>
  );
}

export function ExpiryCountdown({
  expiresAt,
  onExpired,
  label,
}: {
  expiresAt: string;
  onExpired?: () => void;
  label: string;
}) {
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    const target = new Date(expiresAt).getTime();
    if (Number.isNaN(target)) return;

    const tick = () => {
      const left = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) onExpired?.();
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  if (remaining === null) return null;

  if (remaining === 0) {
    return (
      <p className="text-xs text-(--viz-critical)">
        {label} has expired. Request a new one.
      </p>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <p className="text-xs text-muted-foreground">
      {label} expires in{" "}
      <span className="font-medium tabular-nums">
        {minutes}:{seconds}
      </span>
    </p>
  );
}
