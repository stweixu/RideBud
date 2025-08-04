import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BrandFooter from "@/components/BrandFooter";
import ForgotPassword from "@/components/ForgotPassword";

const PreviewPage = () => {
  return (
    <div className="min-h-screen flex flex-col h-screen bg-gray-50">
      <Navbar />
      <div className="flex-grow flex p-4">
        <ForgotPassword />
      </div>
      <BrandFooter />
    </div>
  );
};

export default PreviewPage;
