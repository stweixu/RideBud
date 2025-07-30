import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Loader2,
} from "lucide-react";
import GoogleMapsAutocomplete from "./GoogleMapsAutocomplete";
import { useAuth } from "@/contexts/AuthContext";

const CreateJourney = ({
  onSubmit = () => console.log("User Journey request submitted"),
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    journeyOrigin: "", // String
    journeyDestination: "", // String
    preferredDateTime: undefined,
    passengersCount: undefined,
  });

  const [isLocatingOrigin, setIsLocatingOrigin] = useState(false);
  const [isLocatingDestination, setIsLocatingDestination] = useState(false);

  const [loading, setLoading] = useState(false); // Main form submission loading
  const [apiError, setApiError] = useState(null);
  const [notification, setNotification] = useState(null);

  const timeInputRef = useRef(null);
  const originPlaceSelectedRef = useRef(false);
  const destinationPlaceSelectedRef = useRef(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setApiError(null);
    setNotification(null);
  };

  const preventEnterSubmission = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleOriginPlaceSelected = (place) => {
    console.log("=== ORIGIN PLACE SELECTED ===");
    console.log("Data received from Autocomplete:", place); // This now contains `name` directly
    console.log("Original Google Name:", place.originalGoogleName);
    console.log("Formatted Address:", place.originalGoogleFormattedAddress);
    console.log("Chosen Name (for display/save):", place.name); // Use place.name
    console.log("Place ID:", place.placeId);
    console.log("Coordinates:", place.coordinates);
    console.log("===============================");

    // Save only the 'name' (shortest one chosen by Autocomplete)
    handleInputChange("journeyOrigin", place.name);
    originPlaceSelectedRef.current = true;
  };

  const handleDestinationPlaceSelected = (place) => {
    console.log("=== DESTINATION PLACE SELECTED ===");
    console.log("Data received from Autocomplete:", place); // This now contains `name` directly
    console.log("Original Google Name:", place.originalGoogleName);
    console.log("Formatted Address:", place.originalGoogleFormattedAddress);
    console.log("Chosen Name (for display/save):", place.name); // Use place.name
    console.log("Place ID:", place.placeId);
    console.log("Coordinates:", place.coordinates);
    console.log("===================================");

    // Save only the 'name' (shortest one chosen by Autocomplete)
    handleInputChange("journeyDestination", place.name);
    destinationPlaceSelectedRef.current = true;
  };

  const handleOriginBlur = () => {
    setTimeout(() => {
      // Check if no place was selected OR if the formData value is empty after blur
      if (
        !originPlaceSelectedRef.current &&
        formData.journeyOrigin.trim() !== ""
      ) {
        setApiError(
          "Please select a valid 'Start Location' from the dropdown suggestions."
        );
        console.log("handleOriginBlur triggered - clearing origin input");
        handleInputChange("journeyOrigin", ""); // Clear the string
      }
      originPlaceSelectedRef.current = false;
    }, 200);
  };

  const handleDestinationBlur = () => {
    setTimeout(() => {
      // Check if no place was selected OR if the formData value is empty after blur
      if (
        !destinationPlaceSelectedRef.current &&
        formData.journeyDestination.trim() !== ""
      ) {
        setApiError(
          "Please select a valid 'Destination' from the dropdown suggestions."
        );
        console.log(
          "handleDestinationBlur triggered - clearing destination input"
        );
        handleInputChange("journeyDestination", ""); // Clear the string
      }
      destinationPlaceSelectedRef.current = false;
    }, 200);
  };

  const handleDateChange = (date) => {
    if (date) {
      setFormData((prev) => {
        const newSelectedDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );

        let hours = 0;
        let minutes = 0;
        if (prev.preferredDateTime) {
          hours = prev.preferredDateTime.getHours();
          minutes = prev.preferredDateTime.getMinutes();
        }
        newSelectedDate.setHours(hours, minutes, 0, 0);

        return { ...prev, preferredDateTime: newSelectedDate };
      });
    } else {
      setFormData((prev) => ({ ...prev, preferredDateTime: undefined }));
    }
  };

  const handleTimeChange = (e) => {
    const time = e.target.value;
    const [hours, minutes] = time.split(":").map(Number);

    setFormData((prev) => {
      let currentDateTime;
      if (prev.preferredDateTime) {
        currentDateTime = new Date(prev.preferredDateTime);
      } else {
        currentDateTime = new Date();
        currentDateTime.setHours(0, 0, 0, 0); // Default to start of day if no date selected yet
      }
      currentDateTime.setHours(hours, minutes, 0, 0);
      return { ...prev, preferredDateTime: currentDateTime };
    });
  };

  const useCurrentLocation = async (field) => {
    const setCurrentLocationLoading =
      field === "journeyOrigin"
        ? setIsLocatingOrigin
        : setIsLocatingDestination;
    setCurrentLocationLoading(true);
    setApiError(null);
    setNotification(null);

    try {
      if (!navigator.geolocation) {
        setApiError("Geolocation is not supported by your browser.");
        setCurrentLocationLoading(false);
        return;
      }
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        })
      );
      const { latitude, longitude } = position.coords;

      const backendGeocodeUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/directions/geocode?lat=${latitude}&lng=${longitude}`;
      const response = await fetch(backendGeocodeUrl, {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok && data.address) {
        // For current location, we only have address. Use it as the 'name'.
        handleInputChange(field, data.address);
        if (field === "journeyOrigin") originPlaceSelectedRef.current = true;
        if (field === "journeyDestination")
          destinationPlaceSelectedRef.current = true;
      } else {
        setApiError(data.message || "Could not determine current address.");
      }
    } catch (error) {
      console.error(
        "[useCurrentLocation] Error getting current location:",
        error
      );
      setApiError(
        "Failed to get current location. Please ensure location services are enabled."
      );
    } finally {
      setCurrentLocationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("-------------------------------------");
    console.log("handleSubmit called!");
    console.log("Form Data on Submit:", JSON.stringify(formData, null, 2));
    console.log("-------------------------------------");

    setLoading(true);
    setApiError(null);
    setNotification(null);

    // Perform blur checks before final submission to catch unselected inputs
    handleOriginBlur();
    handleDestinationBlur();

    if (!isAuthenticated) {
      setApiError("You must be logged in to create a journey request.");
      setLoading(false);
      return;
    }

    // Consolidated validation - now checking if the strings are non-empty
    if (
      !formData.journeyOrigin.trim() ||
      !formData.journeyDestination.trim() ||
      !formData.preferredDateTime ||
      !formData.passengersCount
    ) {
      setApiError("Please fill in all required fields accurately.");
      setLoading(false);
      return;
    }

    // Client-side validation for past dates/times
    const now = new Date();
    const selectedDateTime = formData.preferredDateTime;

    if (selectedDateTime < now) {
      setApiError("Preferred date and time cannot be in the past.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        journeyOrigin: formData.journeyOrigin, // Now just the name string
        journeyDestination: formData.journeyDestination, // Now just the name string
        preferredDateTime: formData.preferredDateTime.toISOString(),
        passengersCount: parseInt(formData.passengersCount, 10),
      };

      console.log("=== SUBMITTING JOURNEY REQUEST ===");
      console.log("Final payload:", payload);
      console.log("==================================");

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/user-journeys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create journey request.");
      }

      setNotification("Your journey request has been submitted successfully!");
      setFormData({
        journeyOrigin: "",
        journeyDestination: "",
        preferredDateTime: undefined,
        passengersCount: undefined,
      });

      onSubmit(data.userJourney);

      navigate(
        `/journey-recommendations?userJourneyId=${data.userJourney._id}`
      );
    } catch (error) {
      console.error("Error submitting journey request:", error);
      setApiError(error.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">
            Create Ridebud Request
          </h1>

          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">
                Create your Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Origin Location */}
                <div className="space-y-2">
                  <Label
                    htmlFor="journeyOrigin"
                    className="flex items-center gap-2 text-sm"
                  >
                    <MapPin className="h-5 w-5 text-green-600" />
                    Start Location
                  </Label>
                  <GoogleMapsAutocomplete
                    id="journeyOrigin"
                    placeholder="Enter start address"
                    value={formData.journeyOrigin}
                    onChange={(e) =>
                      handleInputChange("journeyOrigin", e.target.value)
                    }
                    onPlaceSelected={handleOriginPlaceSelected}
                    onUseCurrentLocation={() =>
                      useCurrentLocation("journeyOrigin")
                    }
                    isLocating={isLocatingOrigin}
                    className="h-11"
                    onBlur={handleOriginBlur}
                    onKeyDown={preventEnterSubmission}
                    placeSelectedRef={originPlaceSelectedRef}
                  />
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <Label
                    htmlFor="journeyDestination"
                    className="flex items-center gap-2 text-sm"
                  >
                    <MapPin className="h-5 w-5 text-green-600" />
                    Destination
                  </Label>
                  <GoogleMapsAutocomplete
                    id="journeyDestination"
                    placeholder="Enter destination address"
                    value={formData.journeyDestination}
                    onChange={(e) =>
                      handleInputChange("journeyDestination", e.target.value)
                    }
                    onPlaceSelected={handleDestinationPlaceSelected}
                    onUseCurrentLocation={() =>
                      useCurrentLocation("journeyDestination")
                    }
                    isLocating={isLocatingDestination}
                    className="h-11"
                    onBlur={handleDestinationBlur}
                    onKeyDown={preventEnterSubmission}
                    placeSelectedRef={destinationPlaceSelectedRef}
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-5 w-5 text-green-600" />
                      Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-11"
                          type="button"
                        >
                          {formData.preferredDateTime ? (
                            new Date(
                              formData.preferredDateTime
                            ).toLocaleDateString("en-SG")
                          ) : (
                            <span className="text-gray-500">Select date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.preferredDateTime}
                          onSelect={handleDateChange}
                          initialFocus
                          fromDate={today}
                          disabled={{ before: today }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="time-input-trigger"
                      className="flex items-center gap-2 text-sm"
                    >
                      <Clock className="h-5 w-5 text-green-600" />
                      Preferred Time
                    </Label>
                    <Button
                      id="time-input-trigger"
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-11 relative"
                      onClick={() => timeInputRef.current?.showPicker()}
                      type="button"
                    >
                      {formData.preferredDateTime ? (
                        new Date(formData.preferredDateTime).toLocaleTimeString(
                          "en-SG",
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      ) : (
                        <span className="text-gray-500">Select time</span>
                      )}
                      <Input
                        ref={timeInputRef}
                        id="time"
                        type="time"
                        step="600"
                        value={
                          formData.preferredDateTime
                            ? new Date(formData.preferredDateTime)
                                .toTimeString()
                                .split(" ")[0]
                                .substring(0, 5)
                            : ""
                        }
                        onChange={handleTimeChange}
                        onKeyDown={preventEnterSubmission}
                        tabIndex="-1"
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        required
                        min={(() => {
                          if (
                            formData.preferredDateTime &&
                            new Date(
                              formData.preferredDateTime
                            ).toDateString() === new Date().toDateString()
                          ) {
                            const now = new Date();
                            const currentMinutes =
                              now.getHours() * 60 + now.getMinutes();
                            const nextValidMinutes =
                              Math.ceil(currentMinutes / 10) * 10;
                            const nextValidHour = Math.floor(
                              nextValidMinutes / 60
                            );
                            const nextValidMinute = nextValidMinutes % 60;

                            const formattedHour = String(
                              nextValidHour
                            ).padStart(2, "0");
                            const formattedMinute = String(
                              nextValidMinute
                            ).padStart(2, "0");
                            return `${formattedHour}:${formattedMinute}`;
                          }
                          return "00:00";
                        })()}
                      />
                    </Button>
                  </div>
                </div>

                {/* Passengers */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Users className="h-5 w-5 text-green-600" />
                    Number of Passengers
                  </Label>
                  <Select
                    value={
                      formData.passengersCount
                        ? String(formData.passengersCount)
                        : ""
                    }
                    onValueChange={(value) =>
                      handleInputChange("passengersCount", parseInt(value, 10))
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue
                        placeholder="Select number of passengers including yourself"
                        className="text-lg"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" className="text-sm">
                        1 passenger
                      </SelectItem>
                      <SelectItem value="2" className="text-sm">
                        2 passengers (max)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {apiError && (
                  <p className="text-red-500 text-sm text-center">{apiError}</p>
                )}
                {notification && (
                  <p className="text-green-600 text-sm text-center">
                    {notification}
                  </p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 h-11"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Ridebud Request"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateJourney;
