// components/MyJourneyCard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  Clock,
  Users,
  Star,
  Calendar,
  Phone,
  MessageCircle, // Keep MessageCircle if other components use it, otherwise can remove
  Navigation,
  Edit2,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

import GoogleMapsAutocomplete from "@/components/GoogleMapsAutocomplete";
// Changed import from OpenChatDialogButton
import OpenChatDialogButton from "@/components/OpenChatDialogButton";

// Helper functions (assuming these are defined elsewhere or remain as they were)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getTimePart = (isoString) => {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return null;
  }
};

function toLocalDatetimeLocal(isoString) {
  if (!isoString) return "";
  const dt = new Date(isoString);
  // Get local YYYY-MM-DDTHH:mm string
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hours = String(dt.getHours()).padStart(2, "0");
  const minutes = String(dt.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const getStatusBadge = (status) => {
  switch (status) {
    case "matched":
      return (
        <Badge className="bg-blue-50 hover:bg-blue-50 text-blue-700 border-blue-200 flex items-center justify-center">
          Matched
        </Badge>
      );
    case "pending-selection":
      return (
        <Badge className="bg-yellow-50 hover:bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center justify-center">
          Pending Selection
        </Badge>
      );
    case "no-match":
      return (
        <Badge className="bg-orange-50 hover:bg-orange-50 text-orange-700 border-orange-200 flex items-center justify-center">
          Waiting for match
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-50 hover:bg-green-50 text-green-700 border-green-200 flex items-center justify-center">
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-50 hover:bg-red-50 flex items-center justify-center">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="flex items-center justify-center">
          {status}
        </Badge>
      );
  }
};

const MyJourneyCard = ({
  journey,
  // openChatDialog, // No longer needed as OpenChatDialogButton manages its own state
  onCancelRide,
  onCompleteRide,
  onLeaveRide,
  onEditJourney,
  onReselectJourney,
  navigate,
}) => {
  // const [isChatOpen, setIsChatOpen] = useState(false); // No longer needed here
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editApiError, setEditApiError] = useState(null);

  const [formData, setFormData] = useState({
    journeyOrigin: journey.journeyOrigin || "",
    journeyDestination: journey.journeyDestination || "",
    preferredDateTime: journey.preferredDateTime
      ? toLocalDatetimeLocal(journey.preferredDateTime)
      : "",
  });

  useEffect(() => {
    setFormData({
      journeyOrigin: journey.journeyOrigin || "",
      journeyDestination: journey.journeyDestination || "",
      preferredDateTime: journey.preferredDateTime
        ? toLocalDatetimeLocal(journey.preferredDateTime)
        : "",
    });
    setEditApiError(null);
  }, [journey, isEditDialogOpen]);

  const originPlaceSelectedRef = useRef(false);
  const destinationPlaceSelectedRef = useRef(false);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setEditApiError(null);
  };

  const handleOriginPlaceSelected = (place) => {
    handleFormChange({ target: { name: "journeyOrigin", value: place.name } });
    originPlaceSelectedRef.current = true;
  };

  const handleDestinationPlaceSelected = (place) => {
    handleFormChange({
      target: { name: "journeyDestination", value: place.name },
    });
    destinationPlaceSelectedRef.current = true;
  };

  const handleOriginBlur = () => {
    setTimeout(() => {
      if (
        !originPlaceSelectedRef.current &&
        formData.journeyOrigin.trim() !== "" &&
        formData.journeyOrigin !== journey.journeyOrigin
      ) {
        setEditApiError(
          "Please select a valid 'Start Location' from the dropdown suggestions."
        );
        setFormData((prev) => ({
          ...prev,
          journeyOrigin: journey.journeyOrigin || prev.journeyOrigin,
        }));
      }
      originPlaceSelectedRef.current = false;
    }, 200);
  };

  const handleDestinationBlur = () => {
    setTimeout(() => {
      if (
        !destinationPlaceSelectedRef.current &&
        formData.journeyDestination.trim() !== "" &&
        formData.journeyDestination !== journey.journeyDestination
      ) {
        setEditApiError(
          "Please select a valid 'Destination' from the dropdown suggestions."
        );
        setFormData((prev) => ({
          ...prev,
          journeyDestination:
            journey.journeyDestination || prev.journeyDestination,
        }));
      }
      destinationPlaceSelectedRef.current = false;
    }, 200);
  };

  const preventEnterSubmission = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleSubmit = async () => {
    setEditApiError(null);
    handleOriginBlur();
    handleDestinationBlur();
    await new Promise((resolve) => setTimeout(resolve, 250));

    if (
      !formData.journeyOrigin.trim() ||
      !formData.journeyDestination.trim() ||
      !formData.preferredDateTime
    ) {
      setEditApiError(
        "Please fill in all required location and time fields accurately."
      );
      return;
    }

    setIsSaving(true);
    const success = await onEditJourney(journey.id, formData);
    setIsSaving(false);

    if (success) {
      toast.success("Journey updated successfully!");
      setIsEditDialogOpen(false);
    } else {
      setEditApiError("Failed to update journey. Please try again.");
    }
  };

  const isCarpoolMatched = journey.carpoolRide !== null;

  const displayDate = isCarpoolMatched
    ? formatDate(journey.carpoolRide.carpoolDate)
    : formatDate(journey.preferredDateTime);

  const displayTime = isCarpoolMatched
    ? getTimePart(journey.carpoolRide.carpoolStartTime)
    : getTimePart(journey.preferredDateTime);

  const displayPickupLocation = isCarpoolMatched
    ? journey.carpoolRide.carpoolPickupLocation
    : "N/A";

  const displayDropoffLocation = isCarpoolMatched
    ? journey.carpoolRide.carpoolDropoffLocation
    : "N/A";

  const displayEstimatedPrice = isCarpoolMatched
    ? parseFloat(
        journey.journeyNavigation?.totalCostPerPax?.replace("$", "") || "0"
      )
    : 0.0;

  const displayRideBuddy = isCarpoolMatched
    ? journey.carpoolRide.rideBuddy
    : null;

  // const displayRiderIds = isCarpoolMatched // This variable was not used
  //   ? journey.carpoolRide.riderIds
  //   : [journey.id];

  const passengersCount = isCarpoolMatched
    ? journey.carpoolRide.passengersCount
    : journey.passengersCount;

  const handleViewDirectionsClick = (e) => {
    e.stopPropagation();
    navigate(`/journey-navigate/${journey.id}`);
  };

  const handleCardClick = () => {
    if (journey.status === "pending-selection") {
      navigate(`/journey-recommendations?userJourneyId=${journey.id}`);
    }
  };

  return (
    <>
      <Card
        className={`bg-white shadow-md transition-shadow ${
          journey.status === "pending-selection"
            ? "cursor-pointer hover:bg-yellow-50"
            : ""
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2 mb-4">
            <div className="flex-grow">
              <p className="text-base font-medium">
                <strong>
                  {journey.journeyOrigin} &rarr; {journey.journeyDestination}
                </strong>
              </p>
            </div>
            {getStatusBadge(journey.status)}
          </div>

          <div className="flex items-start gap-4 mb-4">
            <div className="flex items-start gap-2 flex-grow">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">
                  Carpool Pickup:{" "}
                  <span className="font-normal">{displayPickupLocation}</span>
                </p>
                <p className="text-xs font-medium">
                  Carpool Dropoff:{" "}
                  <span className="font-normal">{displayDropoffLocation}</span>
                </p>
              </div>
            </div>

            {displayRideBuddy && (
              <div className="flex items-center gap-2 text-right">
                <div>
                  <h3 className="font-medium text-sm">
                    {displayRideBuddy?.name}
                  </h3>
                  {/*      <div className="flex items-center justify-end text-xs text-yellow-500 mt-0.5">
                    <Star className="h-3 w-3 fill-yellow-500 mr-0.5" />
                    <span>{displayRideBuddy.rating?.toFixed(1) || "N/A"}</span>
                  </div> 
                  RATING FUNCTIONALITY*/}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={displayRideBuddy?.avatar || ""}
                    alt={displayRideBuddy?.name || "N/A"}
                  />
                  <AvatarFallback className="text-sm">
                    {displayRideBuddy?.name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <p className="text-xs">{displayDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <p className="text-xs">{displayTime}</p>
              </div>
            </div>

            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              ${displayEstimatedPrice?.toFixed(2) || "0.00"}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <p className="text-xs">
                {passengersCount} {passengersCount === 1 ? "rider" : "riders"}{" "}
                in carpool
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {/* Buttons for "no-match" status */}
            {journey.status === "no-match" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReselectJourney(journey.id);
                  }}
                  className="w-full bg-white hover:bg-gray-100 text-gray-800 border"
                >
                  Reselect Journey
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelRide(journey.id);
                  }}
                  className="w-full hover:bg-red-800"
                >
                  Delete Journey
                </Button>
              </>
            )}

            {/* Chat button for "matched" and "completed" status - Now always green */}
            {(journey.status === "matched" || journey.status === "completed") &&
              displayRideBuddy && (
                <OpenChatDialogButton
                  rideBuddy={displayRideBuddy}
                  carpoolRideId={journey.carpoolRide.id}
                  rideDetails={{
                    date: displayDate,
                    time: displayTime,
                    origin: displayPickupLocation,
                    destination: displayDropoffLocation,
                  }}
                />
              )}

            {/* View Directions button for "matched", "upcoming", or "completed" status */}
            {(journey.status === "matched" ||
              journey.status === "upcoming" ||
              journey.status === "completed") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDirectionsClick}
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-1" />
                View Directions
              </Button>
            )}

            {/* Other buttons specific to "matched" status */}
            {journey.status === "matched" && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteRide(journey.id);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Complete Journey
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeaveRide(journey.id);
                  }}
                  className="w-full hover:bg-red-800"
                >
                  Leave Ride
                </Button>
              </>
            )}

            {journey.status === "pending-selection" && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}
                className="w-full"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit Journey
              </Button>
            )}

            {/* Buttons for pending-selection status */}
            {journey.status === "pending-selection" && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelRide(journey.id);
                  }}
                  className="w-full hover:bg-red-800"
                >
                  Delete Journey
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Journey Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Journey</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Origin Location with Autocomplete */}
            <div>
              <Label htmlFor="journeyOrigin">Journey Origin</Label>
              <GoogleMapsAutocomplete
                id="journeyOrigin"
                placeholder="Enter origin"
                value={formData.journeyOrigin}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    journeyOrigin: e.target.value,
                  }));
                  originPlaceSelectedRef.current = false;
                  setEditApiError(null);
                }}
                onPlaceSelected={handleOriginPlaceSelected}
                onBlur={handleOriginBlur}
                onKeyDown={preventEnterSubmission}
                placeSelectedRef={originPlaceSelectedRef}
                className="w-full"
              />
            </div>

            {/* Destination Location with Autocomplete */}
            <div>
              <Label htmlFor="journeyDestination">Journey Destination</Label>
              <GoogleMapsAutocomplete
                id="journeyDestination"
                placeholder="Enter destination"
                value={formData.journeyDestination}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    journeyDestination: e.target.value,
                  }));
                  destinationPlaceSelectedRef.current = false;
                  setEditApiError(null);
                }}
                onPlaceSelected={handleDestinationPlaceSelected}
                onBlur={handleDestinationBlur}
                onKeyDown={preventEnterSubmission}
                placeSelectedRef={destinationPlaceSelectedRef}
                className="w-full"
              />
            </div>

            {/* Preferred Date & Time */}
            <div>
              <Label htmlFor="preferredDateTime">Preferred Date & Time</Label>
              <Input
                id="preferredDateTime"
                name="preferredDateTime"
                type="datetime-local"
                value={formData.preferredDateTime}
                onChange={handleFormChange}
                onKeyDown={preventEnterSubmission}
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>
                  Cancel
                </Button>
              </DialogClose>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" /> : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyJourneyCard;
