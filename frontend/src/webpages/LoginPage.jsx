import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext"; // Import useAuth
import LogoBar from "@/components/LogoBar";
import BrandFooter from "@/components/BrandFooter";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // <--- Access the login function from auth context
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // <--- Add loading state
  const [apiError, setApiError] = useState(null); // <--- Add state for API errors

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear validation error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
    // Clear API error when user starts typing
    if (apiError) {
      setApiError(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    // <--- Make it async
    e.preventDefault();
    setApiError(null); // Clear previous API errors

    if (validateForm()) {
      setLoading(true); // Start loading

      try {
        const res = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email.toLowerCase(),
            password: formData.password,
          }), // Use formData.email
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.msg || "Login failed");
        }

        login(); // Call the login function from auth context on success
        navigate("/"); // Redirect to home page after successful login
      } catch (err) {
        console.error("Login error:", err);
        setApiError(err.message || "An unexpected error occurred."); // Set API error
      } finally {
        setLoading(false); // End loading
      }
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
    // navigate("/forgot-password"); // You might want to navigate to a forgot password page
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <LogoBar />
      <div className="max-w-sm w-full flex-grow">
        {/* Header */}
        <div className="text-center my-6">
          <h2 className="text-2xl font-semibold text-gray-700">Sign in</h2>
          {/* <p className="text-gray-500 mt-2">
            Sign in to your account to continue
          </p>*/}
        </div>

        <Card className="bg-white shadow-md ">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="john.doe@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={"h-10 " + (errors.email ? "border-red-500" : "")}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs">{errors.email}</p>
                )}
              </div>

              {/* Password */}
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
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`pr-10 h-10 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 px-3 flex items-center "
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs">{errors.password}</p>
                )}
              </div>

              {/* API Error Display */}
              {apiError && (
                <p className="text-red-500 text-xs text-center">{apiError}</p>
              )}

              {/* Remember Me & Forgot Password 
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) =>
                      handleInputChange("rememberMe", checked)
                    }
                  />
                  <Label htmlFor="remember" className="text-xs text-gray-600">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-green-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>*/}

              {/* Submit Button */}
              <Button
                type="submit"
                className="h-11 w-full bg-green-600 hover:bg-green-700 text-white py-3 mt-6"
                disabled={loading} // Disable button when loading
              >
                {loading ? "Signing In..." : "Sign In"}{" "}
                {/* Show loading text */}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                onClick={() => console.log("Google login")}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full text-sm"
                onClick={() => console.log("Facebook login")}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </Button>
            </div>

            {/* Register Link */}
            <div className=" mt-6 text-center">
              <div>
                <p className="text-gray-600 text-sm">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={handleRegisterClick}
                    className="text-green-600 hover:underline font-medium text-sm"
                  >
                    Sign up
                  </button>{" "}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-green-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BrandFooter />
    </div>
  );
}
