import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Phone, Eye, EyeOff, Car } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import LogoBar from "@/components/logoBar";
import BrandFooter from "@/components/BrandFooter";

export default function RegistrationPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
    if (apiError) {
      setApiError(null);
    }
    if (notification) {
      setNotification(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
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
        const res = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: formData.displayName,
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            phone: formData.phone,
          }),
        });

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
          firstName: "",
          lastName: "",
          phone: "",
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

  const handleLoginClick = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center mb-12">
      <LogoBar />

      <div className="max-w-sm w-full">
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

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-2 text-sm"
                >
                  <Lock className="h-4 w-4 text-green-600" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`h-10 pr-10 ${
                      validationErrors.password ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.password}
                  </p>
                )}
              </div>

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
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`h-10 pr-10 ${
                      validationErrors.confirmPassword ? "border-red-500" : ""
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
                {validationErrors.confirmPassword && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-sm"
                >
                  <Phone className="h-4 w-4 text-green-600" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`h-10 ${
                    validationErrors.phone ? "border-red-500" : ""
                  }`}
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-xs">
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* Location (Commented Out) */}
              {/*
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="City, State"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`h-10 ${validationErrors.location ? "border-red-500" : ""}`}
                />
                {validationErrors.location && (
                  <p className="text-red-500 text-xs">{validationErrors.location}</p>
                )}
              </div>
              */}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    handleInputChange({
                      target: {
                        name: "agreeToTerms",
                        value: checked,
                        type: "checkbox",
                      },
                    })
                  }
                />
                <Label htmlFor="terms" className="text-xs text-gray-600">
                  I agree to the{" "}
                  <Link to="/terms" className="text-green-600 hover:underline">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-green-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {validationErrors.agreeToTerms && (
                <p className="text-red-500 text-xs">
                  {validationErrors.agreeToTerms}
                </p>
              )}

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
                  className="text-green-600 hover:underline font-medium "
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
