import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  Users,
  Star,
  Calendar,
  Phone,
  MessageCircle,
  Navigation,
} from "lucide-react";
import Navbar from "@/components/navbar";
import BrandFooter from "@/components/BrandFooter";

import {
  // Imports for Dialog
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import ChatBubble from "@/components/ChatBubble";

export default function MyRidesPage({
  onCancelRide = () => console.log("Cancel ride"),
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatReceiver, setCurrentChatReceiver] = useState(null);
  const [currentRideDetails, setCurrentRideDetails] = useState(null);

  const openChatDialog = (receiver, rideDetails) => {
    setCurrentChatReceiver(receiver);
    setCurrentRideDetails(rideDetails);
    setIsChatOpen(true);
  };

  const [myNextUpcomingRide] = useState({
    id: "upcoming-special",
    rideBuddy: {
      id: "buddy-john-do",
      name: "John Doe",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      phone: "+1 (555) 987-6543",
    },
    route: {
      start: "Home",
      ridePickup: "Library",
      rideDropoff: "Train Station",
      destination: "Downtown",
      directions: "Take Main St, then turn left at 5th Ave.",
    },
    departureDate: "2025-07-20",
    departureTime: "10:00 AM",
    status: "confirmed", // This is an upcoming ride
    price: 9.5,
  });

  const [currentRides] = useState([
    {
      id: "1",
      rideBuddy: {
        id: "passenger-sarah-sm",
        name: "Sarah Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        rating: 4.9,
        phone: "+1 (555) 234-5678",
      },
      route: {
        origin: "Downtown Plaza",
        destination: "Airport Terminal 1",
        directions:
          "From Downtown Plaza, head towards Main St, then follow signs for Airport Terminal 1.",
      },
      date: "2024-07-25", // Changed date to be upcoming
      time: "08:30",
      status: "upcoming",
      price: 15.5,
      passengers: 2,
      notes: "Please be ready 5 minutes early",
    },
    {
      id: "2",
      rideBuddy: {
        id: "passenger-mike-jo",
        name: "Mike Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
        rating: 4.7,
        phone: "+1 (555) 345-6789",
      },
      route: {
        origin: "University Campus",
        destination: "Tech Park",
        directions:
          "From University Campus, take the shuttle to Innovation Drive, then walk to Tech Park.",
      },
      date: "2024-07-28", // Changed date to be upcoming
      time: "17:00",
      status: "upcoming",
      price: 8.5,
      passengers: 2,
    },
    {
      id: "6",
      rideBuddy: null,
      route: {
        origin: "Home",
        destination: "Gym",
        directions:
          "Simple route: Left on Elm Street, right on Oak Avenue. Gym is on the left.",
      },
      date: "2024-07-20", // Changed date to be upcoming
      time: "09:00",
      status: "upcoming",
      price: 5.0,
      passengers: 1,
    },
  ]);

  const [pastRides] = useState([
    {
      id: "3",
      rideBuddy: {
        id: "passenger-emily-ch",
        name: "Emily Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
        rating: 4.9,
        phone: "+1 (555) 456-7890",
      },
      route: {
        origin: "Riverside Apartments",
        destination: "Shopping District",
        directions:
          "Via Riverside Blvd, then straight to the Shopping District parking.",
      },
      date: "2024-07-10", // Changed date to be past
      time: "11:30",
      status: "completed",
      price: 10.0,
      passengers: 2,
    },
    {
      id: "4",
      rideBuddy: {
        id: "passenger-david-wi",
        name: "David Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
        rating: 4.6,
        phone: "+1 (555) 567-8901",
      },
      route: {
        origin: "North Hills",
        destination: "Downtown",
        directions: "From North Hills, take I-5 South to Downtown exit.",
      },
      date: "2024-07-08", // Changed date to be past
      time: "13:00",
      status: "completed",
      price: 14.0,
      passengers: 2,
    },
    {
      id: "5",
      rideBuddy: null,
      route: {
        origin: "Eastside Park",
        destination: "Business District",
        directions:
          "Follow Park Ave, then turn into Financial Street towards Business District.",
      },
      date: "2024-07-05", // Changed date to be past
      time: "14:15",
      status: "cancelled",
      price: 16.5,
      passengers: 1,
    },
  ]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "upcoming":
      case "confirmed":
        return (
          <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border-blue-200">
            Upcoming
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-50 hover:bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-50 hover:bg-red-50">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // RideCard component - now contains its own Dialog for directions
  const RideCard = ({ ride, openChatDialog, onCancelRide }) => {
    const [isDirectionsDialogOpen, setIsDirectionsDialogOpen] = useState(false);
    const directionsText =
      ride.route?.directions ||
      `Directions for ${ride.route.origin} to ${ride.route.destination}:\n\n` +
        "• Start your journey.\n" +
        "• Follow general navigation.\n" +
        "• Arrive at destination.";

    // Determine the hover class based on ride status
    let hoverClass = "";
    if (ride.status === "upcoming" || ride.status === "confirmed") {
      hoverClass = "hover:bg-blue-50"; // Yellow for upcoming/current
    } else if (ride.status === "cancelled") {
      hoverClass = "hover:bg-red-50"; // Red for cancelled past rides
    } else {
      hoverClass = "hover:bg-green-50"; // Green for completed past rides
    }

    return (
      <Dialog
        open={isDirectionsDialogOpen}
        onOpenChange={setIsDirectionsDialogOpen}
      >
        <DialogTrigger asChild>
          <Card
            className={`bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer ${hoverClass}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={ride.rideBuddy?.avatar || ""}
                      alt={ride.rideBuddy?.name || "N/A"}
                    />
                    <AvatarFallback>
                      {ride.rideBuddy?.name.charAt(0) || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {ride.rideBuddy?.name || "No Ridebud Yet"}
                    </h3>
                    {ride.rideBuddy && (
                      <div className="flex items-center text-xs text-yellow-500">
                        <Star className="h-4 w-4 fill-yellow-500 mr-1" />
                        <span>
                          {ride.rideBuddy.rating?.toFixed(1) || "N/A"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {getStatusBadge(ride.status)}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">
                      From:{" "}
                      <span className="font-normal">{ride.route.origin}</span>
                    </p>
                    <p className="text-xs font-medium">
                      To:{" "}
                      <span className="font-normal">
                        {ride.route.destination}
                      </span>
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 ml-auto"
                  >
                    ${ride.price?.toFixed(2) || "0.00"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <p className="text-xs">{formatDate(ride.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <p className="text-xs">{ride.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-600" />
                    <p className="text-xs">
                      {ride.passengers}{" "}
                      {ride.passengers === 1 ? "person" : "people"} in carpool
                    </p>
                  </div>
                </div>
              </div>

              {ride.status === "upcoming" && (
                <div className="flex gap-2">
                  {/* Phone Ridebud Button */}
                  {ride.rideBuddy &&
                    ride.rideBuddy.phone && ( // Check if rideBuddy and their phone number exist
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent dialog from opening
                          // Use tel: protocol to initiate a phone call
                          window.location.href = `tel:${ride.rideBuddy.phone}`;
                        }}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call Ridebud
                      </Button>
                    )}
                  {ride.passengers === 2 && ride.rideBuddy && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent dialog from opening
                        openChatDialog(ride.rideBuddy, {
                          date: ride.date,
                          time: ride.time,
                          origin: ride.route.origin,
                          destination: ride.route.destination,
                        });
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message Ridebud
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent dialog from opening
                      onCancelRide(ride.id);
                    }}
                    className={`hover:bg-red-800 ${
                      ride.passengers === 2 && ride.rideBuddy
                        ? "flex-1"
                        : "w-full"
                    }`}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </DialogTrigger>

        {/* DIRECTIONS DIALOG CONTENT for THIS specific RideCard */}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Journey Directions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <strong>Route:</strong> {ride.route.origin} →{" "}
              {ride.route.destination}
            </div>
            <div>
              <label
                htmlFor={`directions-textarea-${ride.id}`}
                className="text-sm font-medium mb-2 block"
              >
                Detailed Directions (one per line):
              </label>
              <Textarea
                id={`directions-textarea-${ride.id}`}
                value={directionsText}
                placeholder="• Head north on Main Street for 0.5 miles&#10;• Turn right onto Highway 101 and continue for 8.2 miles&#10;• Take Exit 15 toward Airport Boulevard"
                className="min-h-[120px] resize-none"
                readOnly
              />
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setIsDirectionsDialogOpen(false)}
            >
              Got It!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">My Rides</h1>

          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="current">
                Current Rides ({currentRides.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past Rides ({pastRides.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              {currentRides.length > 0 ? (
                currentRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    openChatDialog={openChatDialog}
                    onCancelRide={onCancelRide}
                  />
                ))
              ) : (
                <Card className="bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <Users className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No upcoming rides
                    </h3>
                    <p className="text-gray-500">Book a ride to see it here</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastRides.length > 0 ? (
                pastRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    openChatDialog={openChatDialog}
                    onCancelRide={onCancelRide}
                  />
                ))
              ) : (
                <Card className="bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <Clock className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No ride history
                    </h3>
                    <p className="text-gray-500">
                      Your completed rides will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <BrandFooter />

      {/* GLOBAL CHAT BUBBLE DIALOG (remains global) */}
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
    </div>
  );
}
