import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Clock,
  Users,
  Star,
  Calendar,
  Phone,
  MessageCircle,
  Navigation,
  DollarSign,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/navbar";
import BrandFooter from "@/components/BrandFooter";
import { useNavigate } from "react-router-dom";
import MyJourneyCard from "@/components/MyJourneyCard";
import ChatBubble from "@/components/ChatBubble";
import { toast } from "react-hot-toast"; // Import toast for consistent notifications

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const MyJourneysPage = () => {
  const navigate = useNavigate();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatReceiver, setCurrentChatReceiver] = useState(null);
  const [currentRideDetails, setCurrentRideDetails] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [journeysError, setJourneysError] = useState(null);

  // Dialog for delete/complete/leave/reselect actions
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogActionType, setDialogActionType] = useState(null); // 'delete', 'complete', 'leave', or 'reselect'
  const [journeyIdToActOn, setJourneyIdToActOn] = useState(null);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogConfirmText, setDialogConfirmText] = useState("");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogResult, setDialogResult] = useState(null); // 'success' or 'error'

  // Open chat bubble dialog
  const openChatDialog = (receiver, rideDetails) => {
    setCurrentChatReceiver(receiver);
    setCurrentRideDetails(rideDetails);
    setIsChatOpen(true);
  };

  // Fetch journeys from API
  const fetchJourneys = async () => {
    setLoadingJourneys(true);
    setJourneysError(null);
    try {
      const response = await fetch("http://localhost:5000/api/user-journeys", {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();

      if (response.ok) {
        const validJourneys = (data.userJourneys || []).filter(
          (journey) => journey != null
        );
        setJourneys(validJourneys);
      } else {
        setJourneysError(data.message || "Failed to fetch journeys.");
      }
    } catch (error) {
      console.error("Error fetching journeys:", error);
      setJourneysError("Network error or server unreachable.");
    } finally {
      setLoadingJourneys(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, []);

  // Delete journey confirmation dialog
  const handleDeleteJourney = (journeyId) => {
    setJourneyIdToActOn(journeyId);
    setDialogActionType("delete");
    setDialogTitle("Confirm Deletion");
    setDialogMessage(
      "Are you sure you want to delete this journey request? This action cannot be undone."
    );
    setDialogConfirmText("Delete");
    setDialogResult(null);
    setShowConfirmDialog(true);
  };

  // Complete journey confirmation dialog
  const handleCompleteJourney = (journeyId) => {
    setJourneyIdToActOn(journeyId);
    setDialogActionType("complete");
    setDialogTitle("Confirm Completion");
    setDialogMessage(
      "Are you sure you want to mark this journey as completed?"
    );
    setDialogConfirmText("Complete");
    setDialogResult(null);
    setShowConfirmDialog(true);
  };

  // Leave matched ride confirmation dialog (used by "Leave Ride" button)
  const handleLeaveRide = (journeyId) => {
    setJourneyIdToActOn(journeyId);
    setDialogActionType("leave");
    setDialogTitle("Confirm Leave Ride");
    setDialogMessage("Are you sure you want to leave this matched ride?");
    setDialogConfirmText("Leave");
    setDialogResult(null);
    setShowConfirmDialog(true);
  };

  // Reselect journey confirmation dialog (used by "Reselect Journey" button)
  const handleReselectJourney = (journeyId) => {
    setJourneyIdToActOn(journeyId);
    setDialogActionType("reselect"); // New action type
    setDialogTitle("Confirm Reselect Journey");
    setDialogMessage(
      "Are you sure you want to cancel this ride and reselect a new match?"
    );
    setDialogConfirmText("Reselect");
    setDialogResult(null);
    setShowConfirmDialog(true);
  };

  // Confirm dialog action handler for delete, complete, leave, or reselect
  const handleConfirmAction = async () => {
    setDialogLoading(true);
    setDialogResult(null); // Clear previous result when starting a new action
    // No need to clear dialogMessage here, it will be overwritten

    try {
      let response, data;
      let endpoint = "";
      let method = "POST";
      let successMessage = "Action completed successfully!";
      let errorMessage = "Failed to perform action.";

      switch (dialogActionType) {
        case "delete":
          endpoint = `http://localhost:5000/api/user-journeys/${journeyIdToActOn}`;
          method = "DELETE";
          successMessage = "Journey deleted successfully!";
          errorMessage = "Failed to delete journey.";
          break;
        case "complete":
          endpoint = `http://localhost:5000/api/user-journeys/${journeyIdToActOn}/complete`;
          method = "PATCH";
          successMessage = "Journey marked as completed!";
          errorMessage = "Failed to complete journey.";
          break;
        case "leave":
        case "reselect": // Both use the same leave-ride endpoint
          endpoint = `http://localhost:5000/api/user-journeys/${journeyIdToActOn}/leave-ride`;
          method = "POST";
          successMessage = "You have left the ride!";
          errorMessage = "Failed to leave ride.";
          break;
        default:
          throw new Error("Invalid dialog action type.");
      }

      response = await fetch(endpoint, {
        method: method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      data = await response.json();

      if (response.ok) {
        toast.success(data.message || successMessage); // Still show toast for quick feedback
        setDialogResult("success"); // Set success state for dialog content
        setDialogMessage(data.message || successMessage); // Set the message to display in the dialog

        // For 'reselect', we still navigate away as it's a 'go to another page' action.
        // If you truly want the dialog to stay open *even for reselect*, remove this block.
        // However, navigating while a dialog is open is generally not a good UX.
        // The dialog will close naturally upon navigation.
        if (dialogActionType === "reselect") {
          // Give a very short delay for the user to perceive the success message in the dialog
          // before navigation closes it.
          setTimeout(() => {
            setShowConfirmDialog(false); // Close dialog before navigating
            navigate(
              `/journey-recommendations?userJourneyId=${journeyIdToActOn}`
            );
          }, 300); // Small delay, e.g., 300ms
        } else {
          // For all other successful actions, keep the dialog open with the success message
          // until the user manually closes it.
          fetchJourneys(); // Refresh journeys in the background for non-navigation actions
        }
      } else {
        // API call failed
        toast.error(data.message || errorMessage); // Show error toast
        setDialogResult("error"); // Set error state for dialog content
        setDialogMessage(data.message || errorMessage); // Set the specific error message to display
        // The dialog remains open because setShowConfirmDialog(false) was not called.
      }
    } catch (error) {
      // Network error or other unexpected JavaScript error
      console.error("Error performing action:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setDialogResult("error"); // Set generic error state for dialog content
      setDialogMessage("An unexpected error occurred. Please try again."); // Display generic error
      // The dialog remains open.
    } finally {
      setDialogLoading(false); // Always stop loading animation
    }
  };

  // Edit journey handler - PATCH request to update journey fields
  const handleEditJourney = async (journeyId, updatedData) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/user-journeys/${journeyId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updatedData),
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to update journey");
      }
      // Refresh journeys after update
      fetchJourneys();
      return true;
    } catch (error) {
      console.error("Error updating journey:", error);
      toast.error(error.message || "Failed to update journey.");
      return false;
    }
  };

  // Split current and past journeys
  const currentJourneys = journeys
    .filter(
      (j) =>
        j.status === "matched" ||
        j.status === "pending-selection" ||
        j.status === "no-match" ||
        j.status === "upcoming" ||
        j.status === "confirmed"
    )
    .sort(
      (a, b) => new Date(a.preferredDateTime) - new Date(b.preferredDateTime)
    );

  const pastJourneys = journeys
    .filter((j) => j.status === "completed" || j.status === "cancelled")
    .sort(
      (a, b) => new Date(b.preferredDateTime) - new Date(a.preferredDateTime)
    );

  if (loadingJourneys) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
        <p className="text-gray-700 text-lg">Loading your journeys...</p>
      </div>
    );
  }

  if (journeysError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-500 text-center p-4 border border-red-200 rounded-md bg-red-50">
          <p>Error loading journeys: {journeysError}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">My Journeys</h1>

          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="current">
                Current Journeys ({currentJourneys.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past Journeys ({pastJourneys.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              {currentJourneys.length > 0 ? (
                currentJourneys.map((journey) => (
                  <MyJourneyCard
                    key={journey.id}
                    journey={journey}
                    openChatDialog={openChatDialog}
                    onCancelRide={handleDeleteJourney}
                    onCompleteRide={handleCompleteJourney}
                    onLeaveRide={handleLeaveRide}
                    onEditJourney={handleEditJourney}
                    onReselectJourney={handleReselectJourney}
                    navigate={navigate}
                  />
                ))
              ) : (
                <Card className="bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <Users className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No upcoming journeys
                    </h3>
                    <p className="text-gray-500">
                      Book a journey to see it here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastJourneys.length > 0 ? (
                pastJourneys.map((journey) => (
                  <MyJourneyCard
                    key={journey.id}
                    journey={journey}
                    openChatDialog={openChatDialog}
                    onCancelRide={handleDeleteJourney}
                    onCompleteRide={handleCompleteJourney}
                    onLeaveRide={handleLeaveRide}
                    onEditJourney={handleEditJourney}
                    onReselectJourney={handleReselectJourney} // Also pass it here for consistency, though likely not needed for past journeys
                    navigate={navigate}
                  />
                ))
              ) : (
                <Card className="bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-gray-400 mb-4">
                      <Clock className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      No journey history
                    </h3>
                    <p className="text-gray-500">
                      Your completed journeys will appear here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <BrandFooter />

      {/* Chat Bubble */}
      <ChatBubble
        isOpen={isChatOpen}
        setIsOpen={setIsChatOpen}
        receiverId={currentChatReceiver?.id || null}
        receiverName={currentChatReceiver?.name || null}
        receiverAvatar={currentChatReceiver?.avatar || null}
        rideDate={currentRideDetails?.date || null}
        rideTime={currentRideDetails?.time || null}
        rideOrigin={currentRideDetails?.origin || null}
        rideDestination={currentRideDetails?.destination || null}
      />

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          {dialogResult && (
            <div
              className={`p-3 rounded-md text-sm ${
                dialogResult === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {dialogResult === "success" ? "Success!" : "Error!"}{" "}
              {dialogMessage}
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={dialogLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant={
                dialogActionType === "delete" ? "destructive" : "default"
              }
              onClick={handleConfirmAction}
              disabled={dialogLoading || dialogResult === "success"}
            >
              {dialogLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                dialogConfirmText
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyJourneysPage;
