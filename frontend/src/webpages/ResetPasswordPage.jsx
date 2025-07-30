import React from "react";
import ResetPassword from "@/components/ResetPassword";
import LogoBar from "@/components/LogoBar";
import BrandFooter from "@/components/BrandFooter";

import { useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const token = new URLSearchParams(window.location.search).get("token");
  const email = new URLSearchParams(window.location.search).get("email");

  const navigate = useNavigate();

  const onBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <LogoBar />
      <div className="flex-grow flex items-start justify-center bg-gray-50 p-4">
        <ResetPassword
          token={token}
          email={email}
          onBackToLogin={onBackToLogin}
        />
      </div>
      <BrandFooter />
    </div>
  );
};

export default ResetPasswordPage;
