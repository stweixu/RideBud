import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/authContext";
import { useNavigate } from "react-router-dom";
import LogoBar from "@/components/LogoBar";
import BrandFooter from "@/components/BrandFooter";
import ForgotPassword from "@/components/ForgotPassword";

const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex flex-col h-screen bg-gray-50">
      <LogoBar />
      <div className="flex-grow flex p-4">
        <ForgotPassword />
      </div>
      <BrandFooter />
    </div>
  );
};

export default ForgotPasswordPage;
