import React from "react";
import RideCard from "./RideCard";
import SearchFilters from "./searchFilter";

const HomepageRideList = ({ carpoolRides = [] }) => {
  const defaultRides = [
    {
      id: "1",
      driver: {
        name: "John Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
        rating: 4.8,
      },
      route: {
        origin: "Downtown",
        destination: "Airport",
      },
      departureTime: "2023-07-15 08:30:00",
      availableSeats: 3,
      price: 15.5,
      distance: "12 km",
      duration: "25 min",
    },
    {
      id: "2",
      driver: {
        name: "Sarah Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
        rating: 4.9,
      },
      route: {
        origin: "Westside Mall",
        destination: "Central Station",
      },
      departureTime: "2023-07-15 09:15:00",
      availableSeats: 2,
      price: 12.0,
      distance: "8 km",
      duration: "15 min",
    },
    {
      id: "3",
      driver: {
        name: "Mike Johnson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
        rating: 4.7,
      },
      route: {
        origin: "University Campus",
        destination: "Tech Park",
      },
      departureTime: "2023-07-15 10:00:00",
      availableSeats: 4,
      price: 8.5,
      distance: "5 km",
      duration: "10 min",
    },
    {
      id: "4",
      driver: {
        name: "Emily Chen",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
        rating: 4.9,
      },
      route: {
        origin: "Riverside Apartments",
        destination: "Shopping District",
      },
      departureTime: "2023-07-15 11:30:00",
      availableSeats: 2,
      price: 10.0,
      distance: "7 km",
      duration: "12 min",
    },
    {
      id: "5",
      driver: {
        name: "David Wilson",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
        rating: 4.6,
      },
      route: {
        origin: "North Hills",
        destination: "Downtown",
      },
      departureTime: "2023-07-15 13:00:00",
      availableSeats: 3,
      price: 14.0,
      distance: "10 km",
      duration: "20 min",
    },
    {
      id: "6",
      driver: {
        name: "Lisa Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa",
        rating: 4.8,
      },
      route: {
        origin: "Eastside Park",
        destination: "Business District",
      },
      departureTime: "2023-07-15 14:15:00",
      availableSeats: 1,
      price: 16.5,
      distance: "15 km",
      duration: "30 min",
    },
  ];

  const ridesToDisplay = carpoolRides.length > 0 ? carpoolRides : defaultRides;

  return (
    <div className="bg-gray-50 min-h-full w-full p-3 md:p-4 lg:p-6">
      <div className="mb-3 md:mb-4">
        <p className="text-md md:text-lg text-gray-500">
          {ridesToDisplay.length} rides listing found
        </p>
      </div>

      <div className="w-full space-y-3 md:space-y-4 pr-1 md:pr-2">
        {ridesToDisplay.map((ride) => (
          <div key={ride.id} className="flex-shrink-0">
            <RideCard
              driver={ride.driver}
              route={ride.route}
              departureTime={ride.departureTime}
              availableSeats={ride.availableSeats}
              price={ride.price}
              distance={ride.distance}
              duration={ride.duration}
            />
          </div>
        ))}
      </div>

      {ridesToDisplay.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
          <div className="text-gray-400 mb-3 md:mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 md:h-16 md:w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-700">
            No rides available
          </h3>
          <p className="text-gray-500 mt-0.5 md:mt-1">
            Try adjusting your search filters
          </p>
        </div>
      )}
    </div>
  );
};

export default HomepageRideList;
