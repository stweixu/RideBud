import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Users, Calendar } from "lucide-react";

const RideCard = ({
  driver = {
    name: "John Doe",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    rating: 4.8,
  },
  route = {
    origin: "Downtown",
    destination: "Airport",
  },
  // Removed default string value here, assuming it comes from props
  departureTime,
  departureDate = "Today", // Default value for date
  availableSeats = 3,
  price = 15.5,
  onRequestRide = () => console.log("Ride requested"),
}) => {
  // --- Start of Date Formatting Logic ---
  let displayDate = "N/A Date";
  let displayTime = "N/A Time";

  if (departureTime) {
    try {
      const dateObj = new Date(departureTime);

      if (!isNaN(dateObj.getTime())) {
        displayDate = dateObj.toLocaleDateString("en-US", {
          weekday: "short",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        displayTime = dateObj.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } else {
        displayDate = "Invalid Date";
        displayTime = ""; // Clear time if date is invalid
      }
    } catch (error) {
      console.error("Error parsing departureTime:", error);
      displayDate = "Error";
      displayTime = ""; // Clear time if error
    }
  }

  // --- End of Date Formatting Logic ---

  return (
    <Card className="w-full bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="flex items-center gap-1  w-[60%]">
            <MapPin className="h-6 w-6 text-green-600" />
            <span className="font-medium text-xl md:text-3xl ">
              {route.origin}
            </span>
            <span className="text-gray-500 text-xl">→</span>
            <span className="font-medium text-xl md:text-3xl">
              {route.destination}
            </span>
          </div>

          <div className="w-[20%} flex-shrink-0"> {"  "}</div>

          <div className="ml-auto">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 text-xs md:text-lg text-center flex flex-col justify-center items-center"
            >
              <div>Estimated Price:</div>
              <div>${price.toFixed(2)}</div>
            </Badge>
          </div>
        </div>
        <div
          className="mb-3 md:mb-4
                flex flex-col        // Default: column layout on mobile
                items-stretch           // Align content to the start (left) on mobile
                space-y-3            // Add vertical spacing between items on mobile (8px)

                md:flex-row           // On medium screens and up: switch to row layout
                md:justify-between    // Distribute items evenly horizontally on desktop
                md:items-stretch      // Make all items equal height on desktop
                md:space-y-0          // Remove vertical spacing on desktop
                md:gap-x-4            // Add horizontal spacing between items on desktop (16px, adjust as needed)
"
        >
          {/* First Child: Pick-up/Drop-off */}
          <div className="flex items-start gap-1 md:gap-2">
            {" "}
            {/* Changed items-center to items-start for consistent top alignment with multi-line text */}
            <Avatar>
              <AvatarImage src={driver.avatar} alt={driver.name} />
              <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-xs md:text-sm">{driver.name}</h3>
              <div className="flex items-center text-xs md:text-sm text-yellow-500">
                <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-500 mr-1" />
                <span>{driver.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          {/* Second Child: Date/Time */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              <p className="text-sm">{displayDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              <p className="text-sm">{displayTime}</p>
            </div>
          </div>

          {/* Third Child: Seats Available */}

          <div className="flex items-start gap-1 md:gap-2">
            {" "}
            {/* Changed items-center to items-start for consistency */}
            <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600 shrink-0" />
            <p className="text-xs md:text-sm">
              {availableSeats} {availableSeats === 1 ? "seat" : "seats"}{" "}
              available
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 md:p-4">
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm h-9 md:h-11"
          onClick={onRequestRide}
        >
          Join Ride
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RideCard;
