import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  Clock,
  Calendar,
  Navigation,
  ArrowRight,
  Users,
  Loader2, // Import Loader2 for potential loading states in the dialog
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose for closing the dialog programmatically
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const MarketplaceRideCard = ({ ride, onJoinRide, isLoading, message }) => {
  const {
    carpoolPickupLocation: pickup,
    carpoolDropoffLocation: dropoff,
    carpoolStartTime: time,
    estimatedPrice: price,
    carpoolDistanceText: distance,
    carpoolDurationText: duration,
    passengersCount, // This is the existing passengers in the carpool
    rideBuddy = { name: "Unknown", avatar: null, rating: 0 },
  } = ride;

  const [selectedPassengers, setSelectedPassengers] = useState("1"); // State for selected passengers in dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog open/close

  // Format time and date display
  let displayDate = "N/A Date";
  let displayTime = "N/A Time";

  if (time) {
    try {
      const dateObj = new Date(time);
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
        displayTime = "";
      }
    } catch (e) {
      displayDate = "Error";
      displayTime = "";
    }
  }

  // Handle the confirmation from the dialog
  const handleConfirmJoinRide = () => {
    // Call the original onJoinRide prop, passing the selected passenger count
    // Convert selectedPassengers to a number
    onJoinRide?.(ride, parseInt(selectedPassengers, 10));
    // The dialog will close automatically if `onJoinRide` is successful and
    // triggers a state update that re-renders the parent, or you can manually close it.
    // For now, let's assume parent handles loading and closing.
    // If you need to explicitly close it here regardless of parent's isLoading:
    // setIsDialogOpen(false);
  };

  return (
    <Card className="max-w-4xl bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-3 md:p-4">
        {/* Route info */}
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="flex items-center gap-1 md:w-[65%]">
            <MapPin className=" size-0 md:size-12 text-green-600 mx-2" />
            <span className="font-medium text-md md:text-xl">{pickup}</span>
            <span className="text-black text-md md:text-xl flex items-center justify-center mx-1 md:mx-10">
              {" "}
              <ArrowRight
                className="size-3 md:size-6 "
                style={{ transform: "scaleX(2)" }}
              />
            </span>
            <MapPin className="size-0 md:size-12 text-green-600  md:mx-2" />
            <span className="font-medium text-md md:text-xl">{dropoff}</span>
          </div>

          <div className="ml-auto">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 text-xs md:text-sm text-center flex flex-col justify-center items-center "
            >
              <div>Approx. ${price?.toFixed(2)}</div>
            </Badge>
          </div>
        </div>

        {/* Bottom info row */}
        <div
          className={`md:mt-6
          flex flex-col items-stretch 
          md:flex-row md:justify-between md:items-stretch md:space-y-0 md:gap-x-4`}
        >
          {/* Driver info */}
          <div className="flex items-start gap-1 md:gap-2 text-sm md:text-base">
            <Avatar>
              {rideBuddy.avatar ? (
                <AvatarImage src={rideBuddy.avatar} alt={rideBuddy.name} />
              ) : (
                <AvatarFallback>{rideBuddy.name?.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-medium text-sm md:text-base">
                {rideBuddy.name}
              </h3>

              <div className="flex items-center text-sm md:text-md ">
                <Users className="size-6 text-green-600 mt-1 mr-1" />
                <p className="text-sm">
                  {" "}
                  {passengersCount} passenger
                  {passengersCount > 1 ? "s" : ""}
                </p>
              </div>
              {/* RATING FUNCTIONALITY*/}
            </div>
          </div>

          {/* Date and time */}
          <div className="hidden md:flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 md:size-6 text-green-600" />
              <p className="text-sm">{displayDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 md:size-6 text-green-600" />
              <p className="text-sm">{displayTime}</p>
            </div>
          </div>

          {/* Distance and duration */}
          <div className="hidden md:flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Navigation className="size-4 md:size-6 text-green-600" />
              <p className="text-sm md:text-base">
                {distance || "N/A distance"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 md:size-6 text-green-600" />
              <p className="text-sm md:text-base">
                {duration || "N/A duration"}
              </p>
            </div>
          </div>

          <div className="flex flex-row justify-between mt-3 mx-2 md:hidden">
            {/* Date and time */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 md:size-6 text-green-600" />
                <p className="text-sm">{displayDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 md:size-6 text-green-600" />
                <p className="text-sm">{displayTime}</p>
              </div>
            </div>

            {/* Distance and duration */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="size-4 md:size-6 text-green-600" />
                <p className="text-sm md:text-base">
                  {distance || "N/A distance"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 md:size-6 text-green-600" />
                <p className="text-sm md:text-base">
                  {duration || "N/A duration"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 md:p-4 flex flex-col gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs md:text-sm h-9 md:h-11 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                "Join Ride"
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-6">
            <DialogHeader>
              <DialogTitle>Select Passengers</DialogTitle>
              <DialogDescription>
                How many passengers will be joining this ride (including
                yourself)?
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <RadioGroup
                defaultValue="1"
                value={selectedPassengers}
                onValueChange={setSelectedPassengers}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="r1" />
                  <Label htmlFor="r1">1 Passenger</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="2" id="r2" />
                  <Label htmlFor="r2">2 Passengers</Label>
                </div>
              </RadioGroup>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleConfirmJoinRide}
                disabled={isLoading} // Disable confirm button during loading
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Confirm"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {message && (
          <p
            className={`text-center text-sm ${
              message.type === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default MarketplaceRideCard;
