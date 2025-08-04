// src/components/RecommendedJourneys.jsx

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import JourneyTimeline from "@/components/JourneyTimeline";
import JourneyDetailsDisplay from "@/components/JourneyDetailsDisplay";

const RecommendedJourneys = ({
  rideRoute = { origin: "Unknown Origin", destination: "Unknown Destination" },
  recommendedJourneys = [],
  userJourneyId,
  passengersCount,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState("");
  const [isSelectingJourney, setIsSelectingJourney] = useState(false);
  const [selectionError, setSelectionError] = useState(null);
  const [selectionSuccess, setSelectionSuccess] = useState(null);

  const balanced = recommendedJourneys.find(
    (j) => j.type === "balanced-carpool"
  );
  const fastest = recommendedJourneys.find((j) => j.type === "fastest-carpool");

  const balancedStartTime = balanced?.carpoolStartTime;
  const fastestStartTime = fastest?.carpoolStartTime;

  useEffect(() => {
    if (!activeTab) {
      if (recommendedJourneys.find((j) => j.type === "fastest-carpool")) {
        setActiveTab("fastest-carpool");
      } else if (
        recommendedJourneys.find((j) => j.type === "balanced-carpool")
      ) {
        setActiveTab("balanced-carpool");
      }
    }
  }, [recommendedJourneys, activeTab]);

  const handleSelectJourney = async (selectedJourney) => {
    setIsSelectingJourney(true);
    setSelectionError(null);
    setSelectionSuccess(null);

    try {
      // DEBUG: Log the full selected journey object to see its structure
      console.log("Selected Journey:", selectedJourney);

      let carpoolRideIdToMatch = null;

      if (selectedJourney.type === "fastest-carpool") {
        const baseStartTime = new Date(fastestStartTime);

        // Check if steps array exists and has elements
        if (!selectedJourney.steps || selectedJourney.steps.length === 0) {
          throw new Error(
            "Journey steps are missing from the fastest carpool recommendation."
          );
        }

        const firstStep = selectedJourney.steps[0];
        const lastStep =
          selectedJourney.steps[selectedJourney.steps.length - 1];

        // Check for missing start/end location data
        const pickupLocation = firstStep?.start_location;
        const dropoffLocation = lastStep?.end_location;

        if (!pickupLocation || !dropoffLocation) {
          console.error(
            "Missing start or end location coordinates in the selected journey's steps:",
            { pickupLocation, dropoffLocation }
          );
          throw new Error(
            "Missing start or end location coordinates in the selected journey."
          );
        }

        const carpoolRidePayload = {
          userJourneyId: userJourneyId,
          carpoolPickupLocation: rideRoute.origin,
          carpoolDropoffLocation: rideRoute.destination,
          carpoolStartTime: baseStartTime.toISOString(),
          carpoolDate: baseStartTime.toISOString().split("T")[0],
          status: "no-match",
          estimatedPrice: parseFloat(
            selectedJourney.carpoolRideCost.replace("$", "")
          ),
          carpoolPickupCoords: selectedJourney.carpoolPickupCoords,
          carpoolDropoffCoords: selectedJourney.carpoolDropoffCoords,
          passengersCount: passengersCount,
        };

        const createCarpoolResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/carpool-rides`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(carpoolRidePayload),
          }
        );

        const newCarpoolRideData = await createCarpoolResponse.json();
        if (!createCarpoolResponse.ok) {
          throw new Error(
            newCarpoolRideData.message || "Failed to create Carpool Ride."
          );
        }
        carpoolRideIdToMatch = newCarpoolRideData.carpoolRide._id;
      } else if (selectedJourney.type === "balanced-carpool") {
        const balancedStep = selectedJourney.steps.find(
          (s) => s.type === "carpool"
        );
        carpoolRideIdToMatch = balancedStep?.matchedRideId;

        if (!carpoolRideIdToMatch) {
          throw new Error(
            "Waiting for matched ride ID found in balanced carpool journey step."
          );
        }

        const updateJourneyResponse = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/user-journeys/${userJourneyId}/match`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ matchedRideId: carpoolRideIdToMatch }),
          }
        );

        const updateJourneyData = await updateJourneyResponse.json();
        if (!updateJourneyResponse.ok) {
          throw new Error(
            updateJourneyData.message ||
              "Failed to update User Journey with matched ride."
          );
        }
      } else {
        throw new Error("Unsupported journey type for carpool ride creation.");
      }

      if (!userJourneyId) {
        throw new Error("Missing userJourneyId for navigation creation.");
      }

      const selectJourneyNavigationResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/user-journeys/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userJourneyId: userJourneyId,
            selectedJourney: selectedJourney,
            matchedCarpoolRideId: carpoolRideIdToMatch,
          }),
        }
      );

      const selectJourneyNavigationData =
        await selectJourneyNavigationResponse.json();
      if (!selectJourneyNavigationResponse.ok) {
        throw new Error(
          selectJourneyNavigationData.message ||
            "Failed to create journey navigation."
        );
      }

      setSelectionSuccess(
        "Journey selected and confirmed! Redirecting to My Journeys..."
      );
      setTimeout(() => navigate("/my-journeys"), 2000);
    } catch (err) {
      console.error("Error selecting journey:", err);
      setSelectionError(
        err.message || "An unexpected error occurred during journey selection."
      );
    } finally {
      setIsSelectingJourney(false);
    }
  };

  return (
    <div className="w-full bg-white">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            Timeline of Recommended Journeys:
          </CardTitle>
          <div className="text-sm text-gray-600 mt-2">
            {activeTab && (
              <JourneyTimeline
                steps={
                  recommendedJourneys.find((j) => j.type === activeTab)
                    ?.steps || []
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recommendedJourneys.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No journey recommendations available for this route.
            </div>
          ) : (
            <Tabs
              value={activeTab}
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fastest-carpool">
                  Fastest (Carpool)
                </TabsTrigger>
                <TabsTrigger value="balanced-carpool">Balanced</TabsTrigger>
              </TabsList>

              <TabsContent value="fastest-carpool" className="mt-4">
                {(() => {
                  const fastest = recommendedJourneys.find(
                    (j) => j.type === "fastest-carpool"
                  );
                  if (!fastest) {
                    return (
                      <div className="text-center text-gray-500 py-8">
                        No fastest journey found.
                      </div>
                    );
                  }
                  return (
                    <JourneyDetailsDisplay
                      journey={fastest}
                      rideRoute={rideRoute}
                      startTime={fastestStartTime}
                      showSelectionButton={true}
                      isSelectingJourney={isSelectingJourney}
                      onSelectJourney={() => handleSelectJourney(fastest)}
                      selectionError={selectionError}
                      selectionSuccess={selectionSuccess}
                      isAuthenticated={isAuthenticated}
                    />
                  );
                })()}
              </TabsContent>

              <TabsContent value="balanced-carpool" className="mt-4">
                {(() => {
                  const balanced = recommendedJourneys.find(
                    (j) => j.type === "balanced-carpool"
                  );
                  if (!balanced) {
                    return (
                      <div className="text-center text-gray-500 py-8">
                        No balanced journey found.
                      </div>
                    );
                  }
                  return (
                    <JourneyDetailsDisplay
                      journey={balanced}
                      rideRoute={rideRoute}
                      startTime={balancedStartTime}
                      showSelectionButton={true}
                      isSelectingJourney={isSelectingJourney}
                      onSelectJourney={() => handleSelectJourney(balanced)}
                      selectionError={selectionError}
                      selectionSuccess={selectionSuccess}
                      isAuthenticated={isAuthenticated}
                    />
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecommendedJourneys;
