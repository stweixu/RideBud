import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import SearchFilters from "../components/SearchFilter";
import BrandFooter from "@/components/BrandFooter";
import UpcomingRideCard from "@/components/UpcomingRideCard";
import MarketplaceRideList from "@/components/MarketplaceRideList";
import { useAuth } from "../contexts/authContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const UserHomePage = () => {
  const { resetJourneys, setResetJourneys } = useAuth(); // get from context
  const [showResetDialog, setShowResetDialog] = useState(false);

  const [upcomingData, setUpcomingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState(null);

  useEffect(() => {
    // Show dialog if there are reset journeys
    if (resetJourneys && resetJourneys.length > 0) {
      setShowResetDialog(true);
    }
  }, [resetJourneys]);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/user-journeys/upcoming`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to fetch upcoming rides");
        const json = await res.json();
        if (json.success && json.data) {
          const userJourney = json.data;
          const carpoolRide = userJourney.carpoolRide;

          const rideBuddy = (carpoolRide && carpoolRide.rideBuddy) || {
            name: "Unknown",
            avatar: "",
            phone: "",
            id: "",
          };

          const upcomingRide = {
            journeyId: userJourney.id,
            carpoolRideId: carpoolRide?.id,
            rideBuddy,
            route: {
              origin: carpoolRide?.carpoolPickupLocation,
              destination: carpoolRide?.carpoolDropoffLocation,
            },
            departureDate: carpoolRide?.carpoolStartTime,
            departureTime: new Date(
              carpoolRide?.carpoolStartTime
            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: carpoolRide?.status,
            totalCostPerPax: userJourney.totalCostPerPax,
          };

          setUpcomingData(upcomingRide);
        } else {
          setUpcomingData(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUpcoming();
  }, []);

  const closeResetDialog = () => {
    setShowResetDialog(false);
    setResetJourneys([]); // clear from context after user closes
  };

  const handleSearch = async (filters) => {
    setLoadingSearch(true);
    setErrorSearch(null);
    setSearchResults(null);
    try {
      const departureDateTime = new Date(
        filters.date.getFullYear(),
        filters.date.getMonth(),
        filters.date.getDate(),
        Number(filters.timeOfDay.split(":")[0]),
        Number(filters.timeOfDay.split(":")[1])
      ).toISOString();

      const query = new URLSearchParams({
        pickUpLocation: filters.pickUpLocation,
        pickUpLat: filters.pickUpLat ?? "",
        pickUpLng: filters.pickUpLng ?? "",
        dropOffLocation: filters.dropOffLocation,
        dropOffLat: filters.dropOffLat ?? "",
        dropOffLng: filters.dropOffLng ?? "",
        departureDateTime,
        sortBy: filters.sortBy || "",
      });

      const res = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/marketplace/get-rides?${query.toString()}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch search results");
      const json = await res.json();
      if (json.success && json.data) {
        setSearchResults(json.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setErrorSearch(err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 pb-6 flex flex-col flex-grow ">
        <UpcomingRideCard upcomingRide={upcomingData} />

        <SearchFilters onSearch={handleSearch} />

        <div
          className="flex flex-col md:flex-row gap-4 flex-grow
                items-stretch md:items-start w-[90%] mx-auto"
        >
          <div className="flex-grow md:flex-grow-[3]">
            <MarketplaceRideList carpoolRides={searchResults} />
          </div>
          <div className="flex flex-col flex-grow items-center justify-center py-6"></div>
        </div>
      </main>
      <BrandFooter />

      {/* Reset journeys dialog popup */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Important Notification
            </DialogTitle>
            <DialogDescription>
              Please note the following journeys were reset because the main
              rider left:
            </DialogDescription>
          </DialogHeader>

          <ul className="list-disc list-inside my-4 max-h-48 overflow-y-auto text-gray-800">
            {resetJourneys.map((journey) => (
              <li key={journey._id}>
                <strong>
                  {journey.journeyOrigin} to {journey.journeyDestination}{" "}
                </strong>{" "}
                -{" "}
                <strong>
                  {new Date(journey.preferredDateTime).toLocaleDateString()}
                </strong>{" "}
              </li>
            ))}
          </ul>

          <DialogFooter>
            <Button variant="destructive" onClick={closeResetDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserHomePage;
