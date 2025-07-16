import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import SearchFilters from "../components/SearchFilter";
import BrandFooter from "@/components/BrandFooter";
import { Button } from "../components/ui/button"; // Adjust the import path as necessary
import HomepageRideList from "../components/HomepageRideList"; // Adjust the import path as necessary
import UpcomingRideBar from "@/components/UpcomingRideBar";

const UserHomePage = () => {
  const Navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 pb-6 flex flex-col space-y-3 flex-grow">
        <UpcomingRideBar />
        <SearchFilters />

        <div
          className="flex flex-col md:flex-row gap-4 flex-grow
                items-stretch   // Mobile: Align children to the left
                md:items-start // Desktop: Vertically center children in the row
                w-[90%] mx-auto"
        >
          <div className="flex-grow md:flex-grow-[3]">
            <HomepageRideList />
          </div>
          <div className="flex flex-col flex-grow items-center justify-center py-6">
            <Button
              type="submit"
              className="h-16 w-48 text-lg mx-auto bg-green-600 hover:bg-green-700 text-white py-3"
              onClick={() => {
                Navigate("/create-ride");
              }}
            >
              Create Ride
            </Button>
          </div>
        </div>
      </main>{" "}
      <BrandFooter />
    </div>
  );
};

export default UserHomePage;
