import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Assuming these are from shadcn/ui
import { Button } from "@/components/ui/button"; // Assuming this is from shadcn/ui
import { Badge } from "@/components/ui/badge"; // Assuming this is from shadcn/ui
import {
  Car,
  Train,
  Bus,
  FootprintsIcon,
  Navigation, // Assuming Navigation icon is used for the trigger
} from "lucide-react"; // Icons from lucide-react

/**
 * @typedef {Object} JourneyStep
 * @property {'walking' | 'carpool' | 'bus' | 'train'} type
 * @property {string} description
 * @property {string} duration
 * @property {string} [cost]
 * @property {React.ElementType} icon
 */

/**
 * @typedef {Object} JourneyRecommendation
 * @property {number} id
 * @property {string} totalTime
 * @property {string} totalCost
 * @property {JourneyStep[]} steps
 */

/**
 * @typedef {Object} RideDetails
 * @property {Object} route
 * @property {string} route.origin
 * @property {string} route.destination
 * @property {JourneyRecommendation[]} [journeyRecommendations]
 */

/**
 * NavigationDialog component displays detailed journey recommendations for a ride.
 * It's designed to be used within a DialogTrigger.
 *
 * @param {Object} props
 * @param {RideDetails} props.rideDetails - The details of the ride, including route and journey recommendations.
 * @param {boolean} props.isOpen - Controls the open state of the dialog.
 * @param {function} props.onClose - Callback function to close the dialog.
 */
const NavigationDialog = ({ rideDetails, isOpen, onClose }) => {
  // Ensure rideDetails and journeyRecommendations exist before rendering
  if (!rideDetails || !rideDetails.journeyRecommendations) {
    return null; // Or render a placeholder/error message if no data
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Journey Recommendations</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <strong>Route:</strong> {rideDetails.route.origin} →{" "}
            {rideDetails.route.destination}
          </div>
          <div className="space-y-6">
            {rideDetails.journeyRecommendations.map((journey) => (
              <div
                key={journey.id}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Option {journey.id}</h3>
                  <div className="flex gap-4 text-sm">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700"
                    >
                      {journey.totalTime}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      {journey.totalCost}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* Walking Steps */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-center text-gray-700 border-b pb-2">
                      <FootprintsIcon className="h-4 w-4 inline mr-1" />
                      Walking
                    </h4>
                    {journey.steps
                      .filter((step) => step.type === "walking")
                      .map((step, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-white rounded border"
                        >
                          <p className="font-medium">{step.description}</p>
                          <p className="text-gray-500">{step.duration}</p>
                        </div>
                      ))}
                  </div>

                  {/* Public Transport Steps */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-center text-gray-700 border-b pb-2">
                      <Train className="h-4 w-4 inline mr-1" />
                      Public Transport
                    </h4>
                    {journey.steps
                      .filter(
                        (step) => step.type === "bus" || step.type === "train"
                      )
                      .map((step, index) => {
                        const Icon = step.icon; // Dynamically render icon
                        return (
                          <div
                            key={index}
                            className="text-sm p-2 bg-white rounded border"
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Icon className="h-3 w-3" />
                              <p className="font-medium">{step.description}</p>
                            </div>
                            <div className="flex justify-between text-gray-500">
                              <span>{step.duration}</span>
                              <span>{step.cost}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Carpool Steps */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-center text-gray-700 border-b pb-2">
                      <Car className="h-4 w-4 inline mr-1" />
                      Carpool
                    </h4>
                    {journey.steps
                      .filter((step) => step.type === "carpool")
                      .map((step, index) => (
                        <div
                          key={index}
                          className="text-sm p-2 bg-white rounded border"
                        >
                          <p className="font-medium">{step.description}</p>
                          <div className="flex justify-between text-gray-500">
                            <span>{step.duration}</span>
                            <span>{step.cost}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NavigationDialog;
