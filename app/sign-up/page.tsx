"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage, registerOrganization } from "@/lib/api/auth";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setTokens } from "@/lib/redux/slices/authSlice";
import { setUser } from "@/lib/redux/slices/userSlice";

/** Set once registration succeeds, so we can reveal the organization ID. */
interface CreatedOrganization {
  organizationId: string | null;
  signedIn: boolean;
}

export default function SignUp() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isRestored = useAppSelector((state) => state.auth.isRestored);
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState<CreatedOrganization | null>(null);
  const [formData, setFormData] = useState({
    organizationName: "",
    adminFullName: "",
    workEmail: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    organizationSize: "",
    termsAccepted: false,
  });

  // Already signed in — skip the form, once the session is actually known.
  useEffect(() => {
    if (!isRestored || !isAuthenticated) return;
    router.replace("/dashboard");
  }, [isRestored, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!formData.termsAccepted) {
      toast.error("Please accept the Terms & Conditions");
      return;
    }

    setIsLoading(true);

    try {
      const { message, data } = await registerOrganization({
        organizationName: formData.organizationName,
        name: formData.adminFullName,
        email: formData.workEmail,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
        organizationSize: formData.organizationSize || undefined,
      });

      toast.success(message || "Organization created successfully!");

      // Registration signs the admin in, so store the session straight away.
      // Guarded because the success card still works without tokens — it just
      // routes to sign-in instead of the dashboard.
      if (data?.accessToken && data?.refreshToken) {
        dispatch(
          setTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }),
        );
        dispatch(setUser(data.user));
      }

      // Show the generated organization ID before moving on — employees need
      // it to register from the mobile app.
      setCreated({
        organizationId: data?.user?.uniqueOrganizationId ?? null,
        signedIn: Boolean(data?.accessToken),
      });
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(
          error,
          "Failed to create organization. Please try again.",
        ),
      );
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyOrganizationId = async () => {
    if (!created?.organizationId) return;
    try {
      await navigator.clipboard.writeText(created.organizationId);
      toast.success("Organization ID copied");
    } catch {
      toast.error("Could not copy the organization ID");
    }
  };

  // Registration succeeded — hand over the organization ID before anything else.
  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {formData.organizationName} is ready
            </CardTitle>
            <CardDescription>
              Share the organization ID with your employees so they can register
              from the Taskly app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs text-muted-foreground">Organization ID</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-wider">
                {created.organizationId ?? "Check your email"}
              </p>
            </div>

            {created.organizationId && (
              <Button
                variant="outline"
                className="w-full"
                onClick={copyOrganizationId}
              >
                Copy organization ID
              </Button>
            )}

            <ol className="space-y-1.5 rounded-lg border p-3 text-xs text-muted-foreground">
              <li>1. Employees install the Taskly app and register with this ID.</li>
              <li>2. Their request lands in Employee Requests as Pending.</li>
              <li>3. You approve them and pick their role.</li>
              <li>4. They get access to the projects you assign them to.</li>
            </ol>

            <Button
              className="w-full bg-[#2d5a4c] hover:bg-[#234539]"
              onClick={() =>
                router.push(created.signedIn ? "/dashboard" : "/sign-in")
              }
            >
              {created.signedIn ? "Go to dashboard" : "Sign in to continue"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Taskly Admin
          </CardTitle>
          <CardDescription>Create your organization account</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="organizationName" className="text-sm font-medium">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="adminFullName" className="text-sm font-medium">
                Admin Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="adminFullName"
                name="adminFullName"
                type="text"
                autoComplete="name"
                required
                value={formData.adminFullName}
                onChange={(e) =>
                  setFormData({ ...formData, adminFullName: e.target.value })
                }
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="workEmail" className="text-sm font-medium">
                Work Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="workEmail"
                name="workEmail"
                type="email"
                autoComplete="email"
                required
                value={formData.workEmail}
                onChange={(e) =>
                  setFormData({ ...formData, workEmail: e.target.value })
                }
                placeholder="Enter your work email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Create a password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm your password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="text-sm font-medium">
                Phone Number (Optional)
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="organizationSize" className="text-sm font-medium">
                Organization Size (Optional)
              </label>
              <Select
                value={formData.organizationSize}
                onValueChange={(value) =>
                  setFormData({ ...formData, organizationSize: value })
                }
              >
                <SelectTrigger id="organizationSize" className="w-full">
                  <SelectValue placeholder="Select organization size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small-Team">Small Team (1-10)</SelectItem>
                  <SelectItem value="Medium-Team">
                    Medium Team (11-50)
                  </SelectItem>
                  <SelectItem value="Large-Team">
                    Large Team (51-200)
                  </SelectItem>
                  <SelectItem value="Enterprise">Enterprise (200+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) =>
                  setFormData({ ...formData, termsAccepted: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to{" "}
                <Link
                  href="#"
                  className="text-[#2d5a4c] hover:text-[#234539] font-medium"
                >
                  Terms & Conditions
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#2d5a4c] hover:bg-[#234539]"
              disabled={isLoading}
            >
              {isLoading ? "Creating Organization..." : "Create Organization"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-[#2d5a4c] hover:text-[#234539]"
              >
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
