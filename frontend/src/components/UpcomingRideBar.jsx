import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Car, Phone, Calendar } from "lucide-react";

const UpcomingRideBar = ({
  upcomingRide = {
    id: "upcoming-1",
    driver: {
      name: "Sarah Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      phone: "+1 (555) 123-4567",
    },
    route: {
      origin: "Downtown Plaza",
      destination: "Airport Terminal 2",
    },
    departureDate: "Today, 11 July 2025",
    departureTime: "3:30 PM",
    status: "confirmed",
    price: 18.0,
  },
  onContactDriver = () => console.log("Contact driver"),
  onViewDetails = () => console.log("View details"),
}) => {
  if (!upcomingRide) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="w-[90%] mx-auto bg-green-100 border border-green-300 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-yellow-100 text-green-700 border-green-300 h-7 flex items-center justify-center"
            >
              <Car className="h-5 w-5 text-green-600 mr-1" />{" "}
              {upcomingRide.status === "confirmed" ? "Next Ride" : "Pending"}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-white bg-green-600 border-green-300 hover:bg-green-700  hover:text-white w-20 md:w-24"
              onClick={onViewDetails}
            >
              Pay Deposit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-green-700 border-green-300 hover:bg-green-100 w-16 md:w-24 text-xs"
              onClick={onContactDriver}
            >
              <Phone className="hidden md:block md:size-4" />
              Contact
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-green-700 border-green-300 hover:bg-green-100 w-16 md:w-24 text-xs "
              onClick={onViewDetails}
            >
              Message
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center">
          <div className="flex items-center gap-4 text-sm gap-x-6 md:gap-x-16 w-full">
            <div className="flex items-center gap-1 text-md md:text-xl">
              <MapPin className="size-9 md:size-6 text-green-600" />
              <span className="font-medium ">{upcomingRide.route.origin}</span>
              <span className="text-gray-500 text-xl">→</span>
              <span className="font-medium">
                {upcomingRide.route.destination}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-8 md:size-4 text-green-600" />
                <p className="text-xs md:text-lg">
                  {formatDate(upcomingRide.departureDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-8 md:size-4 text-green-600" />
                <p className="text-xs md:text-lg">
                  {upcomingRide.departureTime}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingRideBar;
