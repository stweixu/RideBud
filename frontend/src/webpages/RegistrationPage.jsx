import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Eye, EyeOff, Calendar } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import LogoBar from "@/components/LogoBar";
import BrandFooter from "@/components/BrandFooter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import PasswordInputWithHints from "@/components/PasswordInputWithHints";

export default function RegistrationPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: undefined,
    agreeToTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordsMatch = formData.password === formData.confirmPassword;

  // Password strength rules (for validation)
  const isStrong = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSymbol: /[~!@#$%^&*()_+\-=[\]{}|\\:;"'<>,.?/]/.test(formData.password),
  };
  const passwordValid = Object.values(isStrong).every(Boolean);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
    if (apiError) setApiError(null);
    if (notification) setNotification(null);
  };

  const handleDateOfBirthChange = (date) => {
    setFormData({ ...formData, dateOfBirth: date });
    if (validationErrors.dateOfBirth) {
      setValidationErrors({ ...validationErrors, dateOfBirth: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!passwordValid) {
      newErrors.password =
        "Password must be at least 8 characters, and include uppercase, lowercase, number, and symbol.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (
      formData.dateOfBirth instanceof Date &&
      isNaN(formData.dateOfBirth.getTime())
    ) {
      newErrors.dateOfBirth = "Invalid Date of birth";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setNotification(null);

    if (validateForm()) {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: formData.displayName,
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
              dateOfBirth: formData.dateOfBirth,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          const errorMsg =
            data.errors?.[0]?.msg || data.message || "Registration failed";
          throw new Error(errorMsg);
        }

        setNotification("A verification link has been sent to your email.");
        setApiError(null);
        setFormData({
          displayName: "",
          email: "",
          password: "",
          confirmPassword: "",
          dateOfBirth: undefined,
          agreeToTerms: false,
        });
      } catch (err) {
        console.error("Registration error:", err);
        setApiError(
          err.message || "An unexpected error occurred during registration."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <LogoBar />

      <div className="max-w-sm w-full flex-grow">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-700">
            Create your account
          </h2>
          <p className="text-gray-500 mt-2">
            Join our community of eco-friendly commuters
          </p>
        </div>

        <Card className="bg-white shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="displayName"
                  className="flex items-center gap-2 text-sm"
                >
                  <User className="h-4 w-4 text-green-600" />
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  placeholder="Your Display Name"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className={`h-10 placeholder-text-sm ${
                    validationErrors.displayName ? "border-red-500" : ""
                  }`}
                />
                {validationErrors.displayName && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.displayName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-sm"
                >
                  <Mail className="h-4 w-4 text-green-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`h-10 placeholder-text-sm ${
                    validationErrors.email ? "border-red-500" : ""
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Password with hints */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-2 text-sm"
                >
                  <Lock className="h-4 w-4 text-green-600" />
                  Password
                </Label>
                <PasswordInputWithHints
                  password={formData.password}
                  setPassword={(val) =>
                    setFormData((prev) => ({ ...prev, password: val }))
                  }
                  confirmPassword={formData.confirmPassword}
                  showHints={true}
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="flex items-center gap-2 text-sm"
                >
                  <Lock className="h-4 w-4 text-green-600" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`h-10 pr-10 ${
                      validationErrors.confirmPassword || !passwordsMatch
                        ? "border-red-500 focus-visible:ring-1 focus-visible:ring-red-500 focus-visible:outline-none"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {(validationErrors.confirmPassword || !passwordsMatch) && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.confirmPassword ||
                      "Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Date of Birth picker */}
              <div className="space-y-2">
                <Label
                  htmlFor="dateOfBirth"
                  className="flex items-center gap-2 text-sm"
                >
                  <Calendar className="h-4 w-4 text-green-600" />
                  Date of Birth
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`h-10 flex items-center justify-start gap-2 w-full font-normal ${
                        validationErrors.dateOfBirth ? "border-red-500" : ""
                      }`}
                    >
                      <Calendar className="size-4" />
                      {formData.dateOfBirth ? (
                        <span className="font-normal">
                          {formData.dateOfBirth.toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Select your date of birth
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.dateOfBirth}
                      onSelect={handleDateOfBirthChange}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                {validationErrors.dateOfBirth && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      agreeToTerms: checked,
                    }));
                    if (validationErrors.agreeToTerms) {
                      setValidationErrors((prev) => ({
                        ...prev,
                        agreeToTerms: "",
                      }));
                    }
                  }}
                />
                <Label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the{" "}
                  <span
                    onClick={(e) => e.preventDefault()}
                    className="text-green-600 cursor-not-allowed underline"
                    title="Coming soon"
                  >
                    Terms and Conditions
                  </span>{" "}
                  and{" "}
                  <span
                    onClick={(e) => e.preventDefault()}
                    className="text-green-600 cursor-not-allowed underline"
                    title="Coming soon"
                  >
                    Privacy Policy
                  </span>
                </Label>
              </div>
              {validationErrors.agreeToTerms && (
                <p className="text-red-500 text-xs">
                  {validationErrors.agreeToTerms}
                </p>
              )}

              {/* API error & notification */}
              {apiError && (
                <p className="text-red-500 text-xs text-center">{apiError}</p>
              )}
              {notification && (
                <p className="text-green-600 text-xs text-center">
                  {notification}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 h-11"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-green-600 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BrandFooter />
    </div>
  );
}
