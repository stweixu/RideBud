import React, { useState, useRef } from "react"; // Import useRef
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DollarSign,
} from "lucide-react";
// import Navbar from "./Navbar";

const CreateRide = ({
  onSubmit = () => console.log("Carpool request submitted"),
}) => {
  const [formData, setFormData] = useState({
    pickupLocation: "",
    destination: "",
    date: undefined,
    time: "",
    passengers: "1",
    maxPrice: "",
    notes: "",
  });

  const timeInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

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
                Request a Ride
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pickup Location */}
                <div className="space-y-2">
                  <Label
                    htmlFor="pickup"
                    className="flex items-center gap-2 text-sm"
                  >
                    <MapPin className="h-5 w-5 text-green-600" />
                    Pickup Location
                  </Label>
                  <Input
                    id="pickup"
                    placeholder="Enter pickup address"
                    value={formData.pickupLocation}
                    onChange={(e) =>
                      handleInputChange("pickupLocation", e.target.value)
                    }
                    className="h-11"
                    required
                  />
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <Label
                    htmlFor="destination"
                    className="flex items-center gap-2 text-sm"
                  >
                    <MapPin className="h-5 w-5 text-green-600" />
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="Enter destination address"
                    value={formData.destination}
                    onChange={(e) =>
                      handleInputChange("destination", e.target.value)
                    }
                    className="h-11"
                    required
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
                        >
                          {formData.date ? (
                            formData.date.toLocaleDateString()
                          ) : (
                            <span className="text-gray-500">Select date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => handleInputChange("date", date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Preferred Time - Modified to be fully clickable */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="time-input-trigger" // Changed htmlFor to match the button's ID
                      className="flex items-center gap-2 text-sm"
                    >
                      <Clock className="h-5 w-5 text-green-600" />
                      Preferred Time
                    </Label>
                    <Button
                      id="time-input-trigger" // ID for label association
                      variant="outline" // Match your other input styles
                      className="w-full justify-start text-left font-normal h-11 relative" // Added relative for positioning
                      onClick={() => timeInputRef.current?.showPicker()} // Trigger native time picker
                    >
                      {formData.time ? (
                        <span>{formData.time}</span>
                      ) : (
                        <span className="text-gray-500">Select time</span>
                      )}
                      {/* Hidden native input to handle time selection */}
                      <Input
                        ref={timeInputRef}
                        id="time" // Keep original ID for form data
                        type="time"
                        value={formData.time}
                        onChange={(e) =>
                          handleInputChange("time", e.target.value)
                        }
                        className="absolute inset-0 opacity-0 cursor-pointer z-10" // Make it cover the button and be invisible
                        required
                        // Disable browser's default picker for this element if desired, but showPicker is better
                        // style={{ appearance: 'none' }} // Uncomment if you want to remove default browser controls visually
                      />
                    </Button>
                  </div>
                </div>

                {/* Passengers and Max Price */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2 flex-grow">
                    <Label className="flex items-center gap-2 text-sm">
                      <Users className="h-5 w-5 text-green-600" />
                      Number of Passengers
                    </Label>
                    <Select
                      value={formData.passengers}
                      onValueChange={(value) =>
                        handleInputChange("passengers", value)
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 passenger</SelectItem>
                        <SelectItem value="2">2 passengers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements or additional information..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    className="h-24"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 h-11"
                >
                  Submit Carpool Request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateRide;
