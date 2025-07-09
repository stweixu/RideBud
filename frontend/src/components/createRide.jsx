import React, { useState } from "react";
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
import Navbar from "./Navbar";

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

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 pt-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">
            Create Carpool Request
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
                  <Label htmlFor="pickup" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    Pickup Location
                  </Label>
                  <Input
                    id="pickup"
                    placeholder="Enter pickup address"
                    value={formData.pickupLocation}
                    onChange={(e) =>
                      handleInputChange("pickupLocation", e.target.value)
                    }
                    required
                  />
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <Label
                    htmlFor="destination"
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-green-600" />
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    placeholder="Enter destination address"
                    value={formData.destination}
                    onChange={(e) =>
                      handleInputChange("destination", e.target.value)
                    }
                    required
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-green-600" />
                      Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
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

                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      Preferred Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        handleInputChange("time", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                {/* Passengers and Max Price */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="space-y-2 flex-grow">
                    <Label className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      Number of Passengers
                    </Label>
                    <Select
                      value={formData.passengers}
                      onValueChange={(value) =>
                        handleInputChange("passengers", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 passenger</SelectItem>
                        <SelectItem value="2">2 passengers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/*
                <div className="space-y-2">
                  <Label htmlFor="maxPrice" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Maximum Price ($)
                  </Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.50"
                    value={formData.maxPrice}
                    onChange={(e) =>
                      handleInputChange("maxPrice", e.target.value)
                    }
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements or additional information..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
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
