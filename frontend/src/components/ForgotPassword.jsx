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
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const onBackToLogin = () => {
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    // Removed type annotation for 'e'
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/forgot-password/send-reset-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        setError(
          errorData.message || "Failed to send reset email. Please try again."
        );
        return;
      }

      // This block runs ONLY if the fetch was successful (HTTP status 2xx)
      const data = await res.json(); // Parse the success message from the server
      setMessage(data.message || "Password reset instructions have been sent.");
      setEmail(""); // Optionally clear the email input on success
    } catch (err) {
      console.error("Error sending reset email:", err);
      setError(
        "Could not connect to the server. Please check your internet connection or try again later."
      );
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" bg-gray-50 flex items-start justify-center p-4 w-full">
      <Card className="w-full max-w-xl">
        <CardHeader className="">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLogin}
              className="p-1 h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl font-bold my-auto">
              Forgot Password
            </CardTitle>
          </div>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-gray-400" />
                <Label htmlFor="email">Email Address</Label>
              </div>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert>
                <AlertDescription className="text-green-700">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
