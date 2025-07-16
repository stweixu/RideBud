import Navbar from "../components/Navbar";
import React from "react";
import CreateRide from "@/components/CreateRide";
import BrandFooter from "@/components/BrandFooter";

const CreateRidePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-grow">
        <CreateRide />
      </main>
      <BrandFooter />
    </div>
  );
};

export default CreateRidePage;
