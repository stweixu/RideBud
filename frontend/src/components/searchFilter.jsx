import React, { useState, useRef } from "react";
import { Search, Calendar, MapPin, Filter, X, Clock } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";

const SearchFilters = ({ onSearch = () => {} }) => {
  const [filters, setFilters] = useState({
    searchQuery: "",
    date: undefined,
    pickUpLocation: "",
    dropOffLocation: "",
    timeOfDay: "",
    activeFilters: [],
  });

  const [formData, setFormData] = useState({
    time: "", // Assuming 'time' is a string like "HH:MM"
  });
  const timeInputRef = useRef(null);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, searchQuery: e.target.value });
  };

  const handleDateChange = (date) => {
    setFilters({ ...filters, date });
  };

  const handlePickUpLocationChange = (e) => {
    setFilters({ ...filters, pickUpLocation: e.target.value });
  };

  const handleDropOffLocationChange = (e) => {
    setFilters({ ...filters, dropOffLocation: e.target.value });
  };

  const handleTimeChange = (e) => {
    setFilters({ ...filters, timeOfDay: e.target.value });
  };

  const toggleFilter = (filter) => {
    const currentFilters = [...filters.activeFilters];
    const filterIndex = currentFilters.indexOf(filter);

    if (filterIndex >= 0) {
      currentFilters.splice(filterIndex, 1);
    } else {
      currentFilters.push(filter);
    }

    setFilters({ ...filters, activeFilters: currentFilters });
  };

  const removeFilter = (filter) => {
    const currentFilters = filters.activeFilters.filter((f) => f !== filter);
    setFilters({ ...filters, activeFilters: currentFilters });
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  return (
    <div className="w-[90%] bg-white p-3 md:p-4 shadow-sm border-b border-gray-200 mx-auto mt-4 mb-2">
      <div className=" max-w-6xl mx-auto">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
          Browse the Marketplace for RideBuds
        </h2>
        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-1 md:mb-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-3 md:size-4" />
            <Input
              placeholder="Search for pick up points..."
              className="pl-9 pr-4 h-8 md:h-9 w-full"
              value={filters.pickUpLocation}
              onChange={handlePickUpLocationChange}
            />
          </div>

          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-3 md:size-4" />
            <Input
              placeholder="Search for destinations..."
              className="pl-9 pr-4 h-8 md:h-9 w-full"
              value={filters.dropOffLocation}
              onChange={handleDropOffLocationChange}
            />
          </div>

          {/* Date picker */}
          <Popover className="w-20">
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 md:h-9 flex items-center justify-start gap-2 w-full  md:w-40 font-normal"
              >
                <Calendar className="size-3 md:size-4" />
                {filters.date ? (
                  <span>{filters.date.toLocaleDateString()}</span>
                ) : (
                  <span className="text-gray-500 text-sm">Select date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.date}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Time of day dropdown           */}

          {/* Preferred Time */}
          <div className="space-y-2">
            <Button
              id="time-input-trigger" // ID for label association
              variant="outline" // Assuming shadcn/ui Button variant
              className="w-full justify-start text-left font-normal h-8 md:h-9 relative"
              onClick={() => timeInputRef.current?.showPicker()} // Programmatically open time picker
            >
              {/* Clock icon placed directly inside the Button */}
              <Clock className="h-4 w-4 text-gray-500" />
              {filters.timeOfDay ? (
                <span>{filters.timeOfDay}</span>
              ) : (
                <span className="text-gray-500 text-sm">Select time</span>
              )}
              {/* Hidden native input that handles the actual time selection */}
              <Input
                ref={timeInputRef}
                id="time" // Keep original ID for form data binding
                type="time"
                step="600"
                value={filters.timeOfDay}
                onChange={handleTimeChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                required
              />
            </Button>
          </div>

          {/* Search button */}
          <Button
            className="h-8 md:h-9 bg-green-600 hover:bg-green-700 text-white px-4 md:px-6 w-full md:w-auto"
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>

        {/* Filter options
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Filter size={16} />
            <span>Filters:</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`text-xs ${
              filters.activeFilters.includes("available")
                ? "bg-green-50 border-green-200"
                : ""
            }`}
            onClick={() => toggleFilter("available")}
          >
            Available seats
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`text-xs ${
              filters.activeFilters.includes("highRated")
                ? "bg-green-50 border-green-200"
                : ""
            }`}
            onClick={() => toggleFilter("highRated")}
          >
            Highly rated (4.5+)
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`text-xs ${
              filters.activeFilters.includes("lowPrice")
                ? "bg-green-50 border-green-200"
                : ""
            }`}
            onClick={() => toggleFilter("lowPrice")}
          >
            Low price
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={`text-xs ${
              filters.activeFilters.includes("verified")
                ? "bg-green-50 border-green-200"
                : ""
            }`}
            onClick={() => toggleFilter("verified")}
          >
            Verified drivers
          </Button>
        </div>
              */}

        {/* Active filters                  
        {filters.activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="px-2 py-1 bg-green-50 text-green-800 hover:bg-green-100"
              >
                {filter === "available" && "Available seats"}
                {filter === "highRated" && "Highly rated (4.5+)"}
                {filter === "lowPrice" && "Low price"}
                {filter === "verified" && "Verified drivers"}
                <button
                  className="ml-1 hover:text-red-500"
                  onClick={() => removeFilter(filter)}
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}

            {filters.activeFilters.length > 0 && (
              <Button
                variant="link"
                className="text-xs text-gray-500 p-0 h-auto"
                onClick={() => setFilters({ ...filters, activeFilters: [] })}
              >
                Clear all
              </Button>
            )}
            
          </div>                
        )}          */}
      </div>
    </div>
  );
};

export default SearchFilters;
