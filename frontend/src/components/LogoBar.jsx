import React from "react";
import { Car } from "lucide-react";
import { Link } from "react-router-dom";

const LogoBar = () => {
  return (
    <nav className="w-full h-12 md:h-14 lg:h-16 bg-green-600 text-white shadow-md z-50 mb-2 md:mb-4">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <Link className="flex items-center mx-6" to="/login">
          <Car size={40} className="mr-2" />
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold">RideBud</h1>
        </Link>
      </div>
    </nav>
  );
};

export default LogoBar;
