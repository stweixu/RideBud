import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Car,
  Phone,
  Calendar,
  MessageCircle,
  Navigation, // Import Navigation for the Directions dialog icon
  DollarSign, // Assuming this is used for price if it's displayed
} from "lucide-react";

// Import Dialog components and Textarea
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import ChatBubble from "@/components/ChatBubble";

const UpcomingRideCard = ({
  upcomingRide = {
    id: "upcoming-1",
    rideBuddy: {
      id: "buddy-sarah-sm",
      name: "Sarah Smith",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      phone: "+1 (555) 123-4567",
    },
    route: {
      origin: "Downtown Plaza",
      destination: "Airport Terminal 2",
    },
    departureDate: "2025-07-12",
    departureTime: "3:30 PM",
    status: "confirmed",
    price: 18.0,
  },
  onContactRidebuddy = (buddy) => console.log("Contact ridebuddy:", buddy),
  onPayingDeposit = () => console.log("Paying deposit"),
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatReceiver, setCurrentChatReceiver] = useState(null);
  const [currentRideDetails, setCurrentRideDetails] = useState(null);
  const [directions, setDirections] = useState(""); // State for directions in the dialog

  const openChatDialog = (receiver, rideDetails) => {
    setCurrentChatReceiver(receiver);
    setCurrentRideDetails(rideDetails);
    setIsChatOpen(true);
  };

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
      {/* Dialog wraps the trigger and content */}
      <Dialog>
        {/* DialogTrigger wraps the entire CardContent */}
        <DialogTrigger asChild>
          {/* Add cursor-pointer and hover effect to the CardContent */}
          <CardContent className="p-4 cursor-pointer hover:bg-green-200 transition-colors duration-200 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={upcomingRide.rideBuddy.avatar}
                    alt={upcomingRide.rideBuddy.name}
                  />
                  <AvatarFallback>
                    {upcomingRide.rideBuddy.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Your Ridebud:</p>
                  <h4 className="font-medium text-base">
                    {upcomingRide.rideBuddy.name}
                  </h4>
                </div>
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-green-700 border-green-300 h-7 flex items-center justify-center mr-2"
                >
                  <Car className="h-5 w-5 text-green-600 mr-1" />{" "}
                  {upcomingRide.status === "confirmed"
                    ? "Next Ride"
                    : "Pending"}
                </Badge>
              </div>

              {/* Action Buttons - Add e.stopPropagation() to their onClick handlers */}
              <div className="flex flex-col md:flex-row items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white bg-green-600 border-green-300 hover:bg-green-700 hover:text-white w-20 md:w-24"
                  onClick={(e) => {
                    e.stopPropagation(); // Stop propagation to prevent dialog from opening
                    onPayingDeposit();
                  }}
                >
                  Pay Deposit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-700 border-green-300 hover:bg-green-100 w-16 md:w-24 text-xs"
                  onClick={(e) => {
                    e.stopPropagation(); // Stop propagation to prevent dialog from opening
                    onContactRidebuddy(upcomingRide.rideBuddy);
                  }}
                >
                  <Phone className="hidden md:block md:size-4" />
                  Contact
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-700 border-green-300 hover:bg-green-100 w-16 md:w-24 text-xs "
                  onClick={(e) => {
                    e.stopPropagation(); // Stop propagation to prevent dialog from opening
                    openChatDialog(upcomingRide.rideBuddy, {
                      date: upcomingRide.departureDate,
                      time: upcomingRide.departureTime,
                      origin: upcomingRide.route.origin,
                      destination: upcomingRide.route.destination,
                    });
                  }}
                >
                  <MessageCircle className="hidden md:block md:size-4 mr-1" />
                  Message
                </Button>
              </div>
            </div>

            <div className="mt-3 flex items-center pt-3 border-t border-green-200">
              <div className="flex items-center gap-4 text-sm gap-x-6 md:gap-x-16 w-full">
                <div className="flex items-center gap-1 text-md md:text-xl">
                  <MapPin className="size-9 md:size-6 text-green-600" />
                  <span className="font-medium ">
                    {upcomingRide.route.origin}
                  </span>
                  <span className="text-gray-500 text-xl">→</span>
                  <span className="font-medium">
                    {upcomingRide.route.destination}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="size-8 md:size-5 text-green-600" />
                    <p className="text-xs md:text-lg">
                      {formatDate(upcomingRide.departureDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-6 md:size-5 text-green-600" />
                    <p className="text-xs md:text-lg">
                      {upcomingRide.departureTime}
                    </p>
                  </div>
                  {/* Display Price if applicable */}
                  {upcomingRide.price && (
                    <div className="flex items-center gap-1 text-xs md:text-lg">
                      <DollarSign className="size-8 md:size-5 text-green-600" />
                      <span>Price: ${upcomingRide.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </DialogTrigger>

        {/* Dialog Content for Journey Directions */}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Journey Directions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <strong>Route:</strong> {upcomingRide.route.origin} →{" "}
              {upcomingRide.route.destination}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Detailed Directions (one per line):
              </label>
              <Textarea
                value={directions}
                onChange={(e) => setDirections(e.target.value)}
                placeholder="• Head north on Main Street for 0.5 miles&#10;• Turn right onto Highway 101 and continue for 8.2 miles&#10;• Take Exit 15 toward Airport Boulevard"
                className="min-h-[120px] resize-none"
              />
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => console.log("Directions saved:", directions)}
            >
              Save Directions
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ChatBubble
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        receiverId={currentChatReceiver?.id || null}
        receiverName={currentChatReceiver?.name || null}
        receiverAvatar={currentChatReceiver?.avatar || null}
        rideDate={currentRideDetails?.date || null}
        rideTime={currentRideDetails?.time || null}
        rideOrigin={currentRideDetails?.origin || null}
        rideDestination={currentRideDetails?.destination || null}
      />
    </Card>
  );
};

export default UpcomingRideCard;
