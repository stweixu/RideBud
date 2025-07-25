import React, { useState } from "react";
import MarketplaceRideCard from "./MarketplaceRideCard";
import { useNavigate } from "react-router-dom";

const MarketplaceRideList = ({
  carpoolRides = [],
  userPassengersCount = 1,
}) => {
  const navigate = useNavigate();
  const ridesToDisplay = Array.isArray(carpoolRides) ? carpoolRides : [];

  const [loadingRideId, setLoadingRideId] = useState(null);
  const [messages, setMessages] = useState({});

  const handleJoinRide = async (ride) => {
    setLoadingRideId(ride._id);
    setMessages((prev) => ({ ...prev, [ride._id]: null }));

    try {
      const res = await fetch(
        `http://localhost:5000/api/marketplace/join-ride`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            matchedRideId: ride._id,
            passengersCount: userPassengersCount,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => ({
          ...prev,
          [ride._id]: { type: "success", text: "Joined ride successfully!" },
        }));
        setTimeout(() => {
          navigate(`/journey-navigate/${data.userJourneyId}`);
        }, 1000);
      } else {
        const errorData = await res.json();
        setMessages((prev) => ({
          ...prev,
          [ride._id]: {
            type: "error",
            text: errorData.msg || "Failed to join ride.",
          },
        }));
      }
    } catch (err) {
      setMessages((prev) => ({
        ...prev,
        [ride._id]: { type: "error", text: "Network error. Please try again." },
      }));
    } finally {
      setLoadingRideId(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-full w-full p-3 md:p-4 lg:p-6">
      <div className="mb-3 md:mb-4">
        <p className="text-md md:text-lg text-gray-500">
          {ridesToDisplay.length} rides listing found
        </p>
      </div>

      <div className="w-full space-y-3 md:space-y-4 pr-1 md:pr-2">
        {ridesToDisplay.map((ride) => (
          <div key={ride._id} className="flex-shrink-0">
            <MarketplaceRideCard
              ride={ride}
              onJoinRide={() => handleJoinRide(ride)}
              isLoading={loadingRideId === ride._id}
              message={messages[ride._id]}
            />
          </div>
        ))}
      </div>

      {ridesToDisplay.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
          <p className="text-gray-500">
            No rides available. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketplaceRideList;
