import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Frown, Loader2, MapPin, Clock } from "lucide-react"; // Include MapPin and Clock for consistency
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import JourneyTimeline from "@/components/JourneyTimeline"; // Import JourneyTimeline
import JourneyDetailsDisplay from "@/components/JourneyDetailsDisplay"; // Ensure this is imported

const JourneyNavigationPage = () => {
  const { userJourneyId } = useParams();
  const [journeyNavigation, setJourneyNavigation] = useState(null);
  const [userJourneyData, setUserJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCombinedJourneyData = async () => {
      if (!userJourneyId) {
        setError("No User Journey ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/user-journeys/navigate/${userJourneyId}`,
          { credentials: "include" }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch journey navigation details."
          );
        }

        const data = await response.json();

        if (data.userJourney && data.journeyNavigation) {
          setUserJourneyData(data.userJourney);
          setJourneyNavigation(data.journeyNavigation);
        } else {
          setError(
            "Required journey or navigation data not found in response. Please ensure a journey was selected and linked."
          );
        }
      } catch (err) {
        console.error("Error fetching combined journey data:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchCombinedJourneyData();
  }, [userJourneyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
        <p className="text-xl text-gray-700">Loading Journey Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mt-24 flex flex-col items-center justify-center p-6">
          <Frown className="h-16 w-16 text-red-500 mb-6" />
          <p className="text-2xl text-red-700 font-semibold mb-3">
            Error Loading Journey
          </p>
          <p className="text-lg text-gray-600 text-center">{error}</p>
        </div>
      </div>
    );
  }

  if (!userJourneyData || !journeyNavigation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <Navbar />
        <Frown className="h-16 w-16 text-gray-400 mx-auto mb-6" />
        <p className="text-2xl font-semibold text-gray-700 mb-3">
          Journey details are not available.
        </p>
        <p className="text-lg text-gray-600 text-center">
          Please ensure a journey was selected for this route.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="container mx-auto p-6 flex-grow">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Your Selected Journey
            </CardTitle>
            {/* Display the timeline directly here */}
            {journeyNavigation?.steps && (
              <div className="text-sm text-gray-600 mt-2">
                <JourneyTimeline steps={journeyNavigation.steps} />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* Use JourneyDetailsDisplay for the selected journey */}
            <JourneyDetailsDisplay
              journey={journeyNavigation}
              rideRoute={{
                origin: userJourneyData.journeyOrigin,
                destination: userJourneyData.journeyDestination,
              }}
              startTime={userJourneyData.matchedRideId?.carpoolStartTime}
              showSelectionButton={false} // No selection button needed on a navigation page
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JourneyNavigationPage;
