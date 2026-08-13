"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Users,
  Copy,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";

interface CreatedOrganization {
  organizationId: string | null;
  signedIn: boolean;
}

export default function SignUpClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const isRestored = useAppSelector((state) => state.auth.isRestored);
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState<CreatedOrganization | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  useEffect(() => {
    if (!isRestored || !isAuthenticated) return;
    router.replace("/dashboard");
  }, [isRestored, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      if (data?.accessToken && data?.refreshToken) {
        dispatch(
          setTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            remember: false,
          }),
        );
        dispatch(setUser(data.user));
      }

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

  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-white px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-linear-to-r from-[#2d5a4c] to-[#3a6f5c] p-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image
                  src="/images/taskly-logo.png"
                  alt="Taskly"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {formData.organizationName} is ready!
              </h1>
              <p className="text-white/90">
                Your organization has been created successfully
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-linear-to-br from-[#2d5a4c]/5 to-[#3a6f5c]/5 rounded-xl p-6 border-2 border-[#2d5a4c]/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#2d5a4c]" />
                    <p className="text-sm font-semibold text-gray-700">
                      Organization ID
                    </p>
                  </div>
                  {created.organizationId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyOrganizationId}
                      className="text-[#2d5a4c] hover:text-[#234539] hover:bg-[#2d5a4c]/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  )}
                </div>
                <p className="font-mono text-3xl font-bold text-[#2d5a4c] tracking-wider text-center">
                  {created.organizationId ?? "Check your email"}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#2d5a4c]" />
                  Next Steps
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      step: "1",
                      title: "Share Organization ID",
                      description:
                        "Employees need this ID to register on the Taskly mobile app",
                    },
                    {
                      step: "2",
                      title: "Review Employee Requests",
                      description:
                        "Pending requests will appear in Employee Requests section",
                    },
                    {
                      step: "3",
                      title: "Approve & Assign Roles",
                      description:
                        "Approve employees and set their role (Manager, Team Lead, etc.)",
                    },
                    {
                      step: "4",
                      title: "Create Projects",
                      description:
                        "Set up projects and assign employees to get started",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#2d5a4c] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full h-12 bg-linear-to-r from-[#2d5a4c] to-[#3a6f5c] hover:from-[#234539] hover:to-[#2d5a4c] text-white font-medium shadow-lg shadow-[#2d5a4c]/20"
                onClick={() =>
                  router.push(created.signedIn ? "/dashboard" : "/sign-in")
                }
              >
                {created.signedIn ? (
                  <span className="flex items-center justify-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </span>
                ) : (
                  "Sign in to continue"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="relative hidden shrink-0 overflow-hidden bg-linear-to-br from-[#2d5a4c] via-[#3a6f5c] to-[#4a8570] lg:flex lg:w-1/2">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex h-full w-full flex-col justify-between gap-10 overflow-y-auto p-12">
          <div className="relative z-10">
            <div className="flex items-center mb-8">
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
              Start managing
              <br />
              your team today
            </h2>
            <p className="text-lg text-white/90 max-w-md">
              Join thousands of organizations using Taskly to streamline their
              operations.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Quick Setup</h3>
                <p className="text-white/80 text-sm">
                  Get started in minutes with our intuitive onboarding
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">
                  Enterprise Security
                </h3>
                <p className="text-white/80 text-sm">
                  Bank-level security to keep your data safe
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-y-auto bg-linear-to-br from-gray-50 to-white lg:w-1/2">
        <div className="flex min-h-full items-center justify-center px-4 py-6 lg:px-6">
          <div className="w-full max-w-md">
            <div className="mb-6  ">
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
                Create your organization
              </h2>
              <p className="text-gray-600">Get started with a free account</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="organizationName"
                  className="text-sm font-medium text-gray-700"
                >
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="organizationName"
                    name="organizationName"
                    type="text"
                    required
                    value={formData.organizationName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organizationName: e.target.value,
                      })
                    }
                    placeholder="Acme Corp"
                    className="pl-11 h-12 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="adminFullName"
                  className="text-sm font-medium text-gray-700"
                >
                  Admin Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="adminFullName"
                    name="adminFullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.adminFullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adminFullName: e.target.value,
                      })
                    }
                    placeholder="John Doe"
                    className="pl-11 h-12 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="workEmail"
                  className="text-sm font-medium text-gray-700"
                >
                  Work Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    placeholder="john@acmecorp.com"
                    className="pl-11 h-12 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="••••••••"
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

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    Confirm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="••••••••"
                      className="pl-11 pr-11 h-12 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="phoneNumber"
                    className="text-sm font-medium text-gray-700"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="+1 234 567 8900"
                      className="pl-11 h-12 border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="organizationSize"
                    className="text-sm font-medium text-gray-700"
                  >
                    Team Size
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <Select
                      value={formData.organizationSize}
                      onValueChange={(value) =>
                        setFormData({ ...formData, organizationSize: value })
                      }
                    >
                      <SelectTrigger
                        id="organizationSize"
                        className="w-full pl-11 h-12! border border-gray-300 focus:border-[#2d5a4c] focus:ring-[#2d5a4c]"
                        style={{ height: "3rem" }}
                      >
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Small-Team">Small (1-10)</SelectItem>
                        <SelectItem value="Medium-Team">
                          Medium (11-50)
                        </SelectItem>
                        <SelectItem value="Large-Team">
                          Large (51-200)
                        </SelectItem>
                        <SelectItem value="Enterprise">
                          Enterprise (200+)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      termsAccepted: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#2d5a4c] focus:ring-[#2d5a4c] mt-0.5"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{" "}
                  <Link
                    href="#"
                    className="text-[#2d5a4c] hover:text-[#234539] font-medium underline"
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="#"
                    className="text-[#2d5a4c] hover:text-[#234539] font-medium underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-linear-to-r from-[#2d5a4c] to-[#3a6f5c] hover:from-[#234539] hover:to-[#2d5a4c] text-white font-medium shadow-lg shadow-[#2d5a4c]/20 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  "Creating Organization..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Organization
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
                    Already have an account?
                  </span>
                </div>
              </div>

              <Link href="/sign-in">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-2 cursor-pointer border-gray-300 hover:border-[#2d5a4c] hover:text-[#2d5a4c] font-medium transition-all duration-200"
                >
                  Sign in instead
                </Button>
              </Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
