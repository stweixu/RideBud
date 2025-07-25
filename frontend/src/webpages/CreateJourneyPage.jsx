import Navbar from "../components/Navbar";
import React from "react";
import CreateJourney from "@/components/CreateJourney";
import BrandFooter from "@/components/BrandFooter";

const CreateJourneyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-grow">
        <CreateJourney />
      </main>
      <BrandFooter />
    </div>
  );
};

export default CreateJourneyPage;
