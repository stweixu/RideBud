import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import JourneyTimeline from "@/components/JourneyTimeline"; // Import the new reusable component

// Import the new reusable component
import JourneyDetailsDisplay from "@/components/JourneyDetailsDisplay"; // Adjust path as needed

const RecommendedJourneys = ({
  rideRoute = { origin: "Unknown Origin", destination: "Unknown Destination" },
  recommendedJourneys = [],
  userJourneyId, // This is crucial for the select endpoint
  passengersCount,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth(); // Destructure isAuthenticated from useAuth

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
    // Initialize activeTab to fastest-carpool if present, else balanced-carpool if present
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
      let carpoolRideIdToMatch = null;

      if (selectedJourney.type === "fastest-carpool") {
        const baseStartTime = new Date(fastestStartTime);
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
          // Include actual coordinates for origin and destination if available in rideRoute
          // You might need to adjust rideRoute or fetch these if not already present
          carpoolPickupCoords: selectedJourney.steps[0]?.start_location || null,
          carpoolDropoffCoords: selectedJourney.steps[0]?.end_location || null,
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
        if (!createCarpoolResponse.ok)
          throw new Error(
            newCarpoolRideData.message || "Failed to create Carpool Ride."
          );
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

        // For balanced, the actual "matching" with the user journey happens here:
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

      // 2. Call the new '/user-journeys/select' endpoint to create journey navigation
      if (!userJourneyId) {
        // selectedJourney._id is not needed here, as it's not a saved RecommendedJourney
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
            selectedJourney: selectedJourney, // <--- Send the whole object
            matchedCarpoolRideId: carpoolRideIdToMatch, // Still useful if JourneyNavigation links to it
            // You might or might not need selectedJourneyType explicitly if it's within selectedJourney
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
                      showSelectionButton={true} // Show button for recommended journeys
                      isSelectingJourney={isSelectingJourney}
                      onSelectJourney={handleSelectJourney}
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
                      showSelectionButton={true} // Show button for recommended journeys
                      isSelectingJourney={isSelectingJourney}
                      onSelectJourney={handleSelectJourney}
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
