import React, { useState, useRef, useEffect } from "react";
import { Search, Calendar, MapPin, Filter, X, Clock } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import GoogleMapsAutocomplete from "./GoogleMapsAutocomplete";
import { cn } from "@/lib/utils";

const SearchFilters = ({ onSearch = () => {} }) => {
  const SORT_OPTIONS = [
    { key: "nearest", label: "Nearest" },
    { key: "earliest", label: "Earliest" },
    { key: "lowestPrice", label: "Lowest price" },
    { key: "highestPrice", label: "Highest price" },
  ];

  const roundToNext10Min = (date) => {
    const ms = 1000 * 60 * 10;
    return new Date(Math.ceil(date.getTime() / ms) * ms);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [filters, setFilters] = useState({
    searchQuery: "",
    date: today,
    pickUpLocation: "",
    pickUpLat: null,
    pickUpLng: null,
    dropOffLocation: "",
    dropOffLat: null,
    dropOffLng: null,
    timeOfDay: (() => {
      const now = new Date();
      const rounded = roundToNext10Min(now);
      return rounded.toTimeString().slice(0, 5);
    })(),
    sortBy: "earliest",
  });

  // This useEffect now runs only once on component mount to perform an initial search
  useEffect(() => {
    onSearch(filters);
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (!filters.date || !filters.timeOfDay) return;

    const selectedDate = new Date(filters.date);
    selectedDate.setHours(0, 0, 0, 0);
    const nowDate = new Date();
    nowDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === nowDate.getTime()) {
      const [selectedHour, selectedMinute] = filters.timeOfDay
        .split(":")
        .map(Number);
      const now = new Date();
      const nowHour = now.getHours();
      const nowMinute = now.getMinutes();

      if (
        selectedHour < nowHour ||
        (selectedHour === nowHour && selectedMinute < nowMinute)
      ) {
        const rounded = roundToNext10Min(now);
        const roundedStr = rounded.toTimeString().slice(0, 5);
        setFilters((prev) => ({ ...prev, timeOfDay: roundedStr }));
      }
    }
  }, [filters.date, filters.timeOfDay]);

  const getMinTime = () => {
    const selectedDate = new Date(filters.date);
    selectedDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === todayDate.getTime()) {
      const now = new Date();
      const rounded = roundToNext10Min(now);
      const h = String(rounded.getHours()).padStart(2, "0");
      const m = String(rounded.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
    return "00:00";
  };

  const [isLocatingPickUp, setIsLocatingPickUp] = useState(false);
  const [isLocatingDropOff, setIsLocatingDropOff] = useState(false);
  const [apiError, setApiError] = useState(null);

  const pickUpPlaceSelectedRef = useRef(false);
  const dropOffPlaceSelectedRef = useRef(false);

  const timeInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setApiError(null);
  };

  const useCurrentLocation = async (field) => {
    const setCurrentLocationLoading =
      field === "pickUpLocation" ? setIsLocatingPickUp : setIsLocatingDropOff;

    setCurrentLocationLoading(true);
    setApiError(null);

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
        handleInputChange(field, data.address);
        if (field === "pickUpLocation") {
          pickUpPlaceSelectedRef.current = true;
          setFilters((prev) => ({
            ...prev,
            pickUpLat: latitude,
            pickUpLng: longitude,
          }));
        } else if (field === "dropOffLocation") {
          dropOffPlaceSelectedRef.current = true;
          setFilters((prev) => ({
            ...prev,
            dropOffLat: latitude,
            dropOffLng: longitude,
          }));
        }
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

  const handleSortChange = (key) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: prev.sortBy === key ? "" : key,
    }));
  };

  const handlePickUpPlaceSelected = (place) => {
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();

    setFilters((prev) => ({
      ...prev,
      pickUpLocation: place.name || place.formatted_address || "",
      pickUpLat: lat || prev.pickUpLat,
      pickUpLng: lng || prev.pickUpLng,
    }));
    pickUpPlaceSelectedRef.current = true;
  };

  const handleDropOffPlaceSelected = (place) => {
    setFilters((prev) => ({
      ...prev,
      dropOffLocation: place.name || place.formatted_address || "",
      dropOffLat: place.geometry?.location?.lat() || prev.dropOffLat,
      dropOffLng: place.geometry?.location?.lng() || prev.dropOffLng,
    }));
    dropOffPlaceSelectedRef.current = true;
  };

  const handlePickUpLocationChange = (e) => {
    const val = e.target.value;
    pickUpPlaceSelectedRef.current = false;
    setFilters((prev) => ({
      ...prev,
      pickUpLocation: val,
      ...(val === "" ? { pickUpLat: null, pickUpLng: null } : {}),
    }));
  };

  const handleDropOffLocationChange = (e) => {
    const val = e.target.value;
    dropOffPlaceSelectedRef.current = false;
    setFilters((prev) => ({
      ...prev,
      dropOffLocation: val,
      ...(val === "" ? { dropOffLat: null, dropOffLng: null } : {}),
    }));
  };

  const handleDateChange = (date) => {
    setFilters((prev) => ({ ...prev, date }));
  };

  const handleTimeChange = (e) => {
    setFilters((prev) => ({ ...prev, timeOfDay: e.target.value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  return (
    <div className="w-[90%] bg-white p-3 md:p-4 shadow-sm border-b border-gray-200 mx-auto mt-4 mb-2">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
          Browse the Marketplace for RideBuds
        </h2>

        {apiError && (
          <p className="text-red-600 mb-2 text-center">{apiError}</p>
        )}

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-1 md:mb-2">
          <GoogleMapsAutocomplete
            id="pickup-autocomplete"
            onPlaceSelected={handlePickUpPlaceSelected}
            placeholder="Search for pick up points..."
            value={filters.pickUpLocation}
            onChange={handlePickUpLocationChange}
            onUseCurrentLocation={() => useCurrentLocation("pickUpLocation")}
            isLocating={isLocatingPickUp}
            onBlur={() => {
              if (!pickUpPlaceSelectedRef.current) {
                setFilters((prev) => ({
                  ...prev,
                  pickUpLocation: "",
                  pickUpLat: null,
                  pickUpLng: null,
                }));
              }
              pickUpPlaceSelectedRef.current = false;
            }}
          />

          <GoogleMapsAutocomplete
            id="dropoff-autocomplete"
            onPlaceSelected={handleDropOffPlaceSelected}
            placeholder="Search for destinations..."
            value={filters.dropOffLocation}
            onChange={handleDropOffLocationChange}
            onUseCurrentLocation={() => useCurrentLocation("dropOffLocation")}
            isLocating={isLocatingDropOff}
            onBlur={() => {
              if (!dropOffPlaceSelectedRef.current) {
                setFilters((prev) => ({
                  ...prev,
                  dropOffLocation: "",
                  dropOffLat: null,
                  dropOffLng: null,
                }));
              }
              dropOffPlaceSelectedRef.current = false;
            }}
          />

          {/* Date picker with Clear X and disable past dates */}
          <Popover className="md:w-20 relative">
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 md:h-9 flex items-center justify-start gap-2 w-full md:w-40 font-normal relative"
              >
                <Calendar className="size-3 md:size-4" />
                {filters.date ? (
                  <span>{filters.date.toLocaleDateString()}</span>
                ) : (
                  <span className="text-gray-500 text-sm">Select date</span>
                )}

                {filters.date && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters((prev) => ({
                        ...prev,
                        date: null,
                        timeOfDay: "",
                      }));
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    aria-label="Clear date"
                  >
                    <X size={16} />
                  </button>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.date}
                onSelect={handleDateChange}
                initialFocus
                // Disable dates before today
                disabled={(date) => {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  return d < today;
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Time picker without X button */}
          <div className="space-y-2 w-full md:w-24">
            <Button
              id="time-input-trigger"
              variant="outline"
              className="w-full justify-start text-left font-normal h-8 md:h-9 relative"
              onClick={() => timeInputRef.current?.showPicker()}
            >
              <Clock className="h-4 w-4 text-gray-500" />
              {filters.timeOfDay ? (
                <span>{filters.timeOfDay}</span>
              ) : (
                <span className="text-gray-500 text-sm">Select time</span>
              )}

              <Input
                ref={timeInputRef}
                id="time"
                type="time"
                step="600"
                value={filters.timeOfDay}
                onChange={handleTimeChange}
                min={getMinTime()}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                required
              />
            </Button>
          </div>

          <Button
            className="h-8 md:h-9 bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 w-full md:w-auto"
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Filter size={16} />
            <span>Sort by:</span>
          </div>

          {SORT_OPTIONS.map(({ key, label }) => {
            const isSelected = filters.sortBy === key;
            return (
              <Button
                key={key}
                size="sm"
                onClick={() => handleSortChange(key)}
                className={cn(
                  "text-xs px-3 py-1 rounded-md border transition-colors",
                  isSelected
                    ? "bg-green-50 border-gray-300 text-green-800 hover:bg-gray-200 hover:text-black"
                    : "bg-white border-gray-300 text-black hover:bg-gray-100"
                )}
              >
                {label}
              </Button>
            );
          })}

          {filters.sortBy && (
            <Button
              variant="link"
              className="text-xs text-gray-800 p-0 h-auto ml-2"
              onClick={() => setFilters((prev) => ({ ...prev, sortBy: "" }))}
            >
              Clear sort
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
