// components/UpcomingRideCard.jsx
import React from "react"; // Removed useState as it's now in OpenChatDialogButton
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Car,
  Calendar,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
// import ChatBubble from "@/components/ChatBubble"; // No longer directly imported here
// import { useAuth } from "@/contexts/AuthContext"; // No longer directly imported here

// Import the new reusable chat button component
import OpenChatDialogButton from "@/components/OpenChatDialogButton";

const UpcomingRideCard = ({
  upcomingRide,
  onPayingDeposit = () => console.log("Paying deposit"),
}) => {
  // Removed all chat-related state and functions from here
  // const [isChatOpen, setIsChatOpen] = useState(false);
  // const [currentChatReceiver, setCurrentChatReceiver] = useState(null);
  // const [currentRideDetails, setCurrentRideDetails] = useState(null);
  // const [messages, setMessages] = useState([]);
  // const [conversationId, setConversationId] = useState(null);

  const navigate = useNavigate();
  // const { user } = useAuth(); // No longer needed here as OpenChatDialogButton handles auth

  if (!upcomingRide) {
    return (
      <Card className="w-[90%] mx-auto bg-gray-200 border border-gray-200 shadow-sm p-4 text-center">
        <p>No upcoming rides</p>
      </Card>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCardClick = () => {
    navigate(`/journey-navigate/${upcomingRide.journeyId}`);
  };

  // Removed openChatDialog function from here

  return (
    <Card className="w-[90%] mx-auto bg-green-100 border border-green-300 shadow-sm">
      <CardContent
        className="p-4 cursor-pointer hover:bg-green-200 transition-colors duration-200 rounded-lg"
        onClick={handleCardClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={upcomingRide.rideBuddy?.avatar || ""}
                alt={upcomingRide.rideBuddy?.name || "Ride Buddy"}
              />
              <AvatarFallback>
                {upcomingRide.rideBuddy?.name?.charAt(0) || "R"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">Your Ridebud:</p>
              <h4 className="font-medium text-base">
                {upcomingRide.rideBuddy?.name || "Unknown"}
              </h4>
            </div>
            <Badge
              variant="outline"
              className="bg-yellow-100 text-green-700 border-green-300 h-7 flex items-center justify-center mr-2"
            >
              <Car className="h-5 w-5 text-green-600 mr-1" />
              Next Ride
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-white bg-green-600 border-green-300 hover:bg-green-600 hover:text-white w-20 md:w-24 opacity-60 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                onPayingDeposit();
              }}
            >
              Pay Deposit
            </Button>
            {/* Replaced the Message Button and ChatBubble with the new component */}
            <OpenChatDialogButton
              className="text-green-700 border-green-300 hover:bg-green-100 w-16 md:w-24 text-xs"
              rideBuddy={upcomingRide.rideBuddy}
              carpoolRideId={upcomingRide.carpoolRideId}
              rideDetails={{
                date: upcomingRide.departureDate,
                time: upcomingRide.departureTime,
                origin: upcomingRide.route.origin,
                destination: upcomingRide.route.destination,
              }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center pt-3 border-t border-green-200">
          <div className="flex items-center gap-4 text-sm gap-x-6 md:gap-x-8 w-full">
            <div className="w-3/5 flex items-center gap-1 text-md md:text-lg">
              <MapPin className="size-9 md:size-6 text-green-600" />
              <span className="font-medium text-sm md:text-lg">
                {upcomingRide.route.origin}
              </span>

              <ArrowRight
                className="size-8 md:size-4 mx-4"
                style={{ transform: "scaleX(2)" }}
              />

              <MapPin className="size-9 md:size-6 text-green-600 " />
              <span className="font-medium text-sm md:text-lg">
                {upcomingRide.route.destination}
              </span>
            </div>
            <div className="flex mr-5 flex-col md:flex-row items-start gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-6 md:size-5 text-green-600" />
                <p className="text-xs md:text-base">
                  {formatDate(upcomingRide.departureDate)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-6 md:size-5 text-green-600" />
                <p className="text-xs md:text-base">
                  {upcomingRide.departureTime}
                </p>
              </div>
              {upcomingRide.totalCostPerPax !== undefined && (
                <div className="flex items-center text-xs md:text-base">
                  <DollarSign className="size-6 md:size-6 text-green-600" />
                  <span>{upcomingRide.totalCostPerPax}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingRideCard;
