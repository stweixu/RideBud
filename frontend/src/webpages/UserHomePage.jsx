import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import Navbar from "../components/navbar";
import SearchFilters from "../components/searchfilter";
import { Button } from "../components/ui/button"; // Adjust the import path as necessary

const UserHomePage = () => {
  const Navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 flex flex-col">
        <SearchFilters />
        <Button
          type="submit"
          className="h-16 w-48 text-lg mx-auto bg-green-600 hover:bg-green-700 text-white py-3"
          onClick={() => {
            Navigate("/create-ride");
          }}
        >
          Create Ride
        </Button>
      </main>
    </div>
  );
};

export default UserHomePage;
