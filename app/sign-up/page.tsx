"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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
import { axiosPublic } from "../axios/Axios";
import { useAppSelector } from "@/lib/redux/hooks";

export default function SignUp() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
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

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

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
      const payload = {
        organizationName: formData.organizationName,
        name: formData.adminFullName,
        email: formData.workEmail,
        password: formData.password,
        phoneNumber: formData.phoneNumber || undefined,
        organizationSize: formData.organizationSize || undefined,
      };

      await axiosPublic.post("/admin/register", payload);

      toast.success("Organization created successfully!");

      // Redirect to sign-in page
      setTimeout(() => {
        router.push("/sign-in");
      }, 1000);
    } catch (error: unknown) {
      let errorMessage = "Failed to create organization. Please try again.";

      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
