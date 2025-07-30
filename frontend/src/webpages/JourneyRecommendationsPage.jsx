import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/navbar";
import BrandFooter from "@/components/BrandFooter";
import RecommendedJourneys from "@/components/RecommendedJourneys";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// Helper function to parse distance text into meters
const parseDistanceText = (distanceText) => {
  if (!distanceText) return 0;
  const parts = distanceText.match(/([\d\.]+) (km|m)/);
  if (parts && parts.length === 3) {
    const value = parseFloat(parts[1]);
    const unit = parts[2];
    if (unit === "km") {
      return value * 1000;
    } else if (unit === "m") {
      return value;
    }
  }
  return 0; // Default to 0 if parsing fails
};

export default function JourneyRecommendationsPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(search);

  // Get the userJourneyId from URL query parameters
  const userJourneyId = queryParams.get("userJourneyId");

  const [userJourney, setUserJourney] = useState(null);
  const [recommendedJourneys, setRecommendedJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJourneyAndRecommendations = async () => {
      setLoading(true);
      setError(null);

      if (!userJourneyId) {
        setError("No User Journey ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch UserJourney details
        const userJourneyResponse = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/user-journeys/${userJourneyId}`,
          { method: "GET", credentials: "include" }
        );
        const userJourneyData = await userJourneyResponse.json();

        if (!userJourneyResponse.ok || !userJourneyData.userJourney) {
          throw new Error(
            userJourneyData.message || "Failed to fetch user journey details."
          );
        }

        setUserJourney(userJourneyData.userJourney);

        // 2. Fetch recommendations dynamically
        const recommendationsResponse = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/recommended-journeys/${userJourneyId}`,
          { method: "GET", credentials: "include" }
        );
        const recommendationsData = await recommendationsResponse.json();

        console.log("Fetched Recommendations Data (Raw):", recommendationsData);

        if (recommendationsResponse.ok) {
          // Function to process recommendation steps and add 'value' to distance if missing
          const processRecommendation = (recommendation) => {
            if (!recommendation || !recommendation.steps) return recommendation;

            const processedSteps = recommendation.steps.map((step) => {
              // Check if distance.value is missing or undefined
              if (step.distance && typeof step.distance.value === "undefined") {
                const parsedValue = parseDistanceText(step.distance.text);
                return {
                  ...step,
                  distance: {
                    ...step.distance,
                    value: parsedValue, // Add the parsed numeric value
                  },
                };
              }
              return step; // Return step as is if value is already present
            });

            return {
              ...recommendation,
              steps: processedSteps,
            };
          };

          const fastest = recommendationsData.fastestRecommendation
            ? [
                {
                  ...processRecommendation(
                    recommendationsData.fastestRecommendation
                  ),
                  _id: "fastest-recommendation",
                },
              ]
            : [];

          const balanced = recommendationsData.balancedRecommendation
            ? [
                {
                  ...processRecommendation(
                    recommendationsData.balancedRecommendation
                  ),
                  _id: "balanced-recommendation",
                },
              ]
            : [];

          const finalRecommendedJourneys = [...fastest, ...balanced];
          console.log(
            "Recommended Journeys Data (Processed for Distance Value):",
            finalRecommendedJourneys
          );
          setRecommendedJourneys(finalRecommendedJourneys);
        } else {
          if (recommendationsResponse.status === 404) {
            setRecommendedJourneys([]);
          } else {
            throw new Error(
              recommendationsData.message ||
                "Failed to fetch journey recommendations."
            );
          }
        }
      } catch (err) {
        console.error(
          "Error fetching journey details or recommendations:",
          err
        );
        setError(
          err.message || "An error occurred while loading recommendations."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJourneyAndRecommendations();
  }, [userJourneyId]);

  const handleBackToMyJourneys = () => {
    navigate("/my-journeys");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
        <p className="text-gray-700 text-lg">Loading your recommendations...</p>
      </div>
    );
  }

  if (error) {
    console.error("Error in JourneyRecommendationsPage:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
          <AlertCircle className="h-12 w-12 mx-auto mb-3" />
          <p>Error: {error}</p>
          <p className="mt-2 text-sm">
            Please try again later or ensure the journey ID is valid.
          </p>
          <Button
            onClick={handleBackToMyJourneys}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!userJourney) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-700 text-lg">No journey details found.</p>
        <Button
          onClick={handleBackToMyJourneys}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white"
        >
          Back to My Journeys
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-full mx-auto">
          <Button
            variant="outline"
            onClick={handleBackToMyJourneys}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Journeys
          </Button>

          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Your Journey Recommendations
          </h1>

          <RecommendedJourneys
            rideRoute={{
              origin: userJourney.journeyOrigin,
              destination: userJourney.journeyDestination,
            }}
            startTime={userJourney.preferredDateTime}
            recommendedJourneys={recommendedJourneys}
            userJourneyId={userJourneyId}
            passengersCount={userJourney.passengersCount}
          />
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
