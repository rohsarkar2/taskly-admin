"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage, resetPassword } from "@/lib/api/auth";

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
        <Input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`At least ${minLength} characters`}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
        <Input
          id="confirm-new-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter the password"
        />
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

/** Counts down to `expiresAt`, rendering `mm:ss`, then reports expiry. */
export function ExpiryCountdown({
  expiresAt,
  onExpired,
  label,
}: {
  expiresAt: string;
  onExpired?: () => void;
  label: string;
}) {
  // Starts null so the server render and first client render agree; the real
  // value lands after mount.
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
