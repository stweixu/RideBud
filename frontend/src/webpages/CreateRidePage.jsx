import Navbar from "../components/navbar";
import SearchFilters from "../components/searchfilter";
import TestComponent from "../components/test"; // Import the test component
import React from "react";
import CreateRide from "@/components/createRide";

const CreateRidePage = () => {
  return (
    <div className="min-h-screen w-screen bg-gray-50">
      <CreateRide />
    </div>
  );
};

export default CreateRidePage;
