import { Car } from "lucide-react";
import React from "react";

const BrandFooter = () => {
  return (
    <div className="my-6 flex items-center justify-center text-gray-400">
      <Car className="h-5 w-5 mr-2" />
      <span className="text-xs">RideBud - Connecting Commuters</span>
    </div>
  );
};

export default BrandFooter;
