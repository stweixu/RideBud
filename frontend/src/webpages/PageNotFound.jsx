import React from "react";
import { Button } from "@/components/ui/button";
import { Car, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import LogoBar from "../components/LogoBar";
import BrandFooter from "@/components/BrandFooter";

export default function PageNotFound() {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
  };

  const handleGoBack = () => {
    navigate(-1);
  };
  const { isAuthenticated } = useAuth(); // Access authentication status

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {isAuthenticated ? <Navbar /> : <LogoBar />}
      <div className="text-center max-w-md w-full flex-grow mt-16">
        {/* 404 Animation */}
        <div className="mb-8">
          <div className="relative">
            {/* Large 404 Text */}
            <h1 className="text-8xl font-bold text-gray-200 select-none">
              404
            </h1>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Wrong Turn?</h2>
          <p className="text-gray-600 text-md mb-2 whitespace-nowrap">
            Looks like this route doesn't exist in our carpool network.
          </p>
          <p className="text-gray-500 text-sm">
            Don't worry, we'll help you get back on track!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleGoHome}
            className="h-13 w-4/5 bg-green-600 hover:bg-green-700 text-white py-3 text-md"
          >
            <Home className="h-5 w-5 mr-1" />
            Go to Homepage
          </Button>

          <Button
            onClick={handleGoBack}
            variant="outline"
            className="h-13 w-4/5 py-3 text-md border-green-600 text-green-600 hover:bg-green-50"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Go Back
          </Button>
        </div>

        {/* Additional Help 
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Need Help?
          </h3>
          <p className="text-gray-600 text-xs mb-4">
            If you're looking for something specific, try:
          </p>
          <ul className="text-xs text-gray-500 space-y-2">
            <li>• Searching for available rides on the homepage</li>
            <li>• Checking your profile or ride history</li>
            <li>• Creating a new carpool request</li>
          </ul>
        </div>*/}
      </div>{" "}
      <BrandFooter />
    </div>
  );
}
