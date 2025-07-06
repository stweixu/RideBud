import Navbar from "../components/navbar";
import SearchFilters from "../components/searchfilter";
import TestComponent from "../components/test"; // Import the test component
import React from "react";

const UserProfile = () => {
  return (
    <div className="min-h-screen w-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <SearchFilters />
      </main>
    </div>
  );
};

export default UserProfile;
