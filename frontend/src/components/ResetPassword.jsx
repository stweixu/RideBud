import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
// Import the new password hint component
import PasswordInputWithHints from "./PasswordInputWithHints"; // Adjust path as necessary

export default function ResetPassword({ token, email, onBackToLogin }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Only need this for confirm field now
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Keep this validation function for the handleSubmit logic
  // as PasswordInputWithHints only provides visual feedback for one field
  const validatePassword = (pwd) => {
    const minLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    // Adjust hasSpecialChar to match PasswordInputWithHints's allowedSymbols if needed
    // For now, keeping the original broader regex
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
      isValid:
        minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token || !email) {
      setError(
        "Invalid or missing reset link parameters. Please request a new link."
      );
      return;
    }

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    // Use the passwordValidation from this component for form submission
    if (!passwordValidation.isValid) {
      setError("Password does not meet the requirements");
      return;
    }

    if (!passwordsMatch) {
      // Use the passwordsMatch state
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/forgot-password/reset-password/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newPassword: password, token, email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to reset password. Please try again."
        );
        return;
      }

      setSuccess(true);
      // Removed the setTimeout here for quicker transition, assuming onPasswordReset handles navigation
      onPasswordReset();
    } catch (err) {
      console.error("Error resetting password:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className=" bg-gray-50 flex items-center justify-center p-4">
        {" "}
        {/* Centered for consistency */}
        <Card className="w-full max-w-xl">
          {" "}
          {/* Use max-w-md for consistency with form */}
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Password Reset Successful!
                </h2>
                <p className="text-gray-600 mt-2">
                  Your password has been successfully reset. You can now log in
                  with your new password.
                </p>
              </div>
              <Button
                onClick={onBackToLogin}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className=" bg-gray-50 flex p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below. Make sure it meets all the
            requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password Input using the new component */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <PasswordInputWithHints
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword} // Pass confirmPassword for matching hint
                showHints={true} // Always show hints for new password
              />
            </div>

            {/* Confirm New Password Input (kept separate with Eye/EyeOff) */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* Remove the explicit password requirements list here
                as PasswordInputWithHints handles it visually */}
            {/* You might want a simple "Passwords do not match" error if passwordValidation.isValid is true but passwordsMatch is false
                and no general error is set yet */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              // Disable if loading, or if password isn't valid, or if passwords don't match
              disabled={
                isLoading || !passwordValidation.isValid || !passwordsMatch
              }
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBackToLogin}
              disabled={isLoading}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
