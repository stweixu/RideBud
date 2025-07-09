import React, { useState } from "react";
import { Search, Calendar, MapPin, Filter, X, Clock } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { ReactTimePicker } from "./ui/timepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { generateTimeIntervals } from "../lib/time-utils"; // Adjust path if needed

const SearchFilters = ({ onSearch = () => {} }) => {
  const [filters, setFilters] = useState({
    searchQuery: "",
    date: undefined,
    location: "",
    timeOfDay: "",
    activeFilters: [],
  });

  const handleSearchChange = (e) => {
    setFilters({ ...filters, searchQuery: e.target.value });
  };

  const handleDateChange = (date) => {
    setFilters({ ...filters, date });
  };

  const handleLocationChange = (value) => {
    setFilters({ ...filters, location: value });
  };

  const handleTimeChange = (value) => {
    setFilters({ ...filters, timeOfDay: value });
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
    <div className="my-16 w-full bg-white p-4 shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
            <Input
              placeholder="Search for pick up points..."
              className="pl-10 pr-4 h-11 w-full"
              value={filters.searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
            <Input
              placeholder="Search for destinations..."
              className="pl-10 pr-4 h-11 w-full"
              value={filters.searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* Date picker */}
          <Popover className="w-20">
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 flex items-center gap-2 min-w-[180px]"
              >
                <Calendar className="size-5" />
                {filters.date ? (
                  <span>{filters.date.toLocaleDateString()}</span>
                ) : (
                  <span className="text-gray-500">Select date</span>
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

          {/* Location dropdown
          <Select onValueChange={handleLocationChange} value={filters.location}>
            <SelectTrigger className="h-11 min-w-[180px] w-10">
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <SelectValue placeholder="Location" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              <SelectItem value="downtown">Downtown</SelectItem>
              <SelectItem value="north">North Area</SelectItem>
              <SelectItem value="south">South Area</SelectItem>
              <SelectItem value="east">East Area</SelectItem>
              <SelectItem value="west">West Area</SelectItem>
            </SelectContent>
          </Select>
          

          {/* Time of day dropdown           */}

          <Select onValueChange={handleTimeChange} value={filters.timeOfDay}>
            <SelectTrigger className="h-11 min-w-[180px] w-12">
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <SelectValue placeholder="Time of day" />{" "}
                {/* Keep your original placeholder */}
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-60 text-center">
              {/* Keep your "Any time" option, using the original "all" value */}
              <SelectItem value="all">Any time</SelectItem>

              {/* Dynamically generate and render the 20-minute interval options */}
              {generateTimeIntervals(20).map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Search button */}
          <Button
            className="h-11 bg-green-600 hover:bg-green-700 text-white px-6"
            onClick={handleSearch}
          >
            Search
          </Button>
        </div>

        {/* Filter options
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Filter size={16} />
            <span>Filters:</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`text-sm ${
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
            className={`text-sm ${
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
            className={`text-sm ${
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
            className={`text-sm ${
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
                className="text-sm text-gray-500 p-0 h-auto"
                onClick={() => setFilters({ ...filters, activeFilters: [] })}
              >
                Clear all
              </Button>
            )}
            
          </div>                
        )}          */}
      </div>
    </div>
  );
};

export default SearchFilters;
