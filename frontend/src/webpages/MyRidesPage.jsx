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
} from "lucide-react";
import Navbar from "@/components/navbar";
import BrandFooter from "@/components/BrandFooter";

export default function MyRidesPage({
  onContactDriver = () => console.log("Contact driver"),
  onCancelRide = () => console.log("Cancel ride"),
}) {
  const [currentRides] = useState([
    {
      id: "1",
      driver: {
        name: "Sarah Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        rating: 4.9,
        phone: "+1 (555) 234-5678",
      },
      route: {
        origin: "Downtown Plaza",
        destination: "Airport Terminal 1",
      },
      date: "2024-01-15",
      time: "08:30",
      status: "upcoming",
      price: 15.5,
      passengers: 2,
      notes: "Please be ready 5 minutes early",
    },
    {
      id: "2",
      driver: {
        name: "Mike Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
        rating: 4.7,
        phone: "+1 (555) 345-6789",
      },
      route: {
        origin: "University Campus",
        destination: "Tech Park",
      },
      date: "2024-01-18",
      time: "17:00",
      status: "upcoming",
      price: 8.5,
      passengers: 1,
    },
  ]);

  const [pastRides] = useState([
    {
      id: "3",
      driver: {
        name: "Emily Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
        rating: 4.9,
        phone: "+1 (555) 456-7890",
      },
      route: {
        origin: "Riverside Apartments",
        destination: "Shopping District",
      },
      date: "2024-01-10",
      time: "11:30",
      status: "completed",
      price: 10.0,
      passengers: 1,
    },
    {
      id: "4",
      driver: {
        name: "David Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
        rating: 4.6,
        phone: "+1 (555) 567-8901",
      },
      route: {
        origin: "North Hills",
        destination: "Downtown",
      },
      date: "2024-01-08",
      time: "13:00",
      status: "completed",
      price: 14.0,
      passengers: 2,
    },
    {
      id: "5",
      driver: {
        name: "Lisa Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
        rating: 4.8,
        phone: "+1 (555) 678-9012",
      },
      route: {
        origin: "Eastside Park",
        destination: "Business District",
      },
      date: "2024-01-05",
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
          <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const RideCard = ({ ride }) => (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={ride.driver.avatar} alt={ride.driver.name} />
              <AvatarFallback>{ride.driver.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{ride.driver.name}</h3>
              <div className="flex items-center text-xs text-yellow-500">
                <Star className="h-4 w-4 fill-yellow-500 mr-1" />
                <span>{ride.driver.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(ride.status)}
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium">
                From: <span className="font-normal">{ride.route.origin}</span>
              </p>
              <p className="text-xs font-medium">
                To:{" "}
                <span className="font-normal">{ride.route.destination}</span>
              </p>
            </div>

            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 ml-auto"
            >
              ${ride.price.toFixed(2)}
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
                {ride.passengers === 1 ? "passenger" : "passengers"}
              </p>
            </div>
          </div>

          {/*   {ride.notes && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> {ride.notes}
              </p>
            </div>
          )} */}
        </div>

        {ride.status === "upcoming" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onContactDriver(ride.id)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Message Ridebud
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onCancelRide(ride.id)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
                  <RideCard key={ride.id} ride={ride} />
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
                pastRides.map((ride) => <RideCard key={ride.id} ride={ride} />)
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
      </main>{" "}
      <BrandFooter />
    </div>
  );
}
