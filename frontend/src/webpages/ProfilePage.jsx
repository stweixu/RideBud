import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User as UserIcon, // Renamed from 'User' to 'UserIcon' to avoid conflict with `user` prop
  Mail,
  Star,
  Edit,
  Save,
  X,
  Lock,
  AlertCircle,
  Calendar as CalendarIcon, // Added CalendarIcon for dateOfBirth
} from "lucide-react";
import Navbar from "@/components/navbar"; // Adjusted import path
import BrandFooter from "@/components/BrandFooter"; // Adjusted import path
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth context
import { fetchUserData } from "@/utils/api"; // Utility to refetch user data

export default function ProfilePage() {
  const { user, setUser } = useAuth(); // Get user and setUser from AuthContext

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [newEmail, setNewEmail] = useState("");
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const [profileData, setProfileData] = useState({
    displayName: "Loading...", // Changed from 'name' to 'displayName' for consistency with backend
    email: "",
    bio: "",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder",
    rating: 0,
    totalRides: 0,
    dateOfBirth: undefined, // Changed from string to Date object
    joinDate: undefined, // Changed from string to Date object (will be user.createdAt)
  });

  const [originalProfileData, setOriginalProfileData] = useState({
    ...profileData,
  });
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [passwordChangeError, setPasswordChangeError] = useState(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [emailChangeError, setEmailChangeError] = useState(null);
  const [emailChangeSuccess, setEmailChangeSuccess] = useState(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  useEffect(() => {
    if (user) {
      const initialData = {
        displayName: user.displayName || "Guest User",
        email: user.email || "guest@example.com",
        bio: user.bio || "No bio yet. Tell us about yourself!",
        avatar:
          user.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${
            user.displayName || "guest"
          }`,
        rating: user.rating ?? 0,
        totalRides: user.totalRides ?? 0,
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined, // Ensure it's a Date object
        joinDate: user.createdAt ? new Date(user.createdAt) : undefined, // Assuming createdAt from user object
      };
      setProfileData(initialData);
      setOriginalProfileData(initialData);
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData((prevData) => ({ ...prevData, [field]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange("avatar", reader.result);
        console.log(
          "Avatar selected for preview. In a real app, this would be uploaded to cloud storage and the URL saved."
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);
    setIsSaving(true);

    try {
      const dataToSend = {
        displayName: profileData.displayName,
        bio: profileData.bio,
        avatar: profileData.avatar,
      };

      const response = await fetch("http://localhost:5000/api/update-profile", {
        method: "PATCH", // Using PATCH for partial updates
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json(); // Renamed result to data for consistency

      if (!response.ok) {
        let errorMessage = "Failed to update profile."; // Default generic message
        if (data.errors) {
          errorMessage = data.errors.map((err) => err.msg).join(", ");
        } else if (data.msg) {
          // Check for 'msg' field
          errorMessage = data.msg;
        } else if (data.message) {
          // Check for 'message' field
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      setSaveSuccess(data.message || "Profile updated successfully!"); // Use data.message
      setIsEditing(false);
      // Re-fetch user data to update the context and ensure consistency
      const updatedUserData = await fetchUserData();
      setUser(updatedUserData);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveError(error.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileData(originalProfileData);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleChangePassword = async () => {
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);
    setIsChangingPassword(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordChangeError("New passwords do not match!");
      setIsChangingPassword(false);
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordChangeError(
        "New password must be at least 6 characters long."
      );
      setIsChangingPassword(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/change-password",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
            confirmPassword: passwordData.confirmPassword, // Ensure confirmPassword is sent
          }),
        }
      );

      const data = await response.json(); // Renamed result to data for consistency

      if (!response.ok) {
        let errorMessage = "Failed to change password."; // Default generic message
        if (data.errors) {
          // For express-validator errors
          errorMessage = data.errors.map((err) => err.msg).join(", ");
        } else if (data.msg) {
          // For your custom messages like "User not found" or "Current password incorrect"
          errorMessage = data.msg;
        } else if (data.message) {
          // For other generic messages
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      setPasswordChangeSuccess(
        data.message || "Password changed successfully!"
      ); // Use data.message
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      // Close dialog after a short delay to show success message
      setTimeout(() => setShowPasswordDialog(false), 1500);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordChangeError(
        error.message || "An unexpected error occurred during password change."
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    setEmailChangeError(null);
    setEmailChangeSuccess(null);
    setIsChangingEmail(true);

    if (!newEmail || !newEmail.includes("@") || !newEmail.includes(".")) {
      setEmailChangeError("Please enter a valid email address.");
      setIsChangingEmail(false);
      return;
    }

    try {
      // Updated endpoint to /api/change-email
      const response = await fetch("http://localhost:5000/api/change-email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ newEmail }),
      });

      const data = await response.json(); // Renamed result to data for consistency

      if (!response.ok) {
        let errorMessage = "Failed to change email."; // Default generic message
        if (data.errors) {
          errorMessage = data.errors.map((err) => err.msg).join(", ");
        } else if (data.msg) {
          // Check for 'msg' field
          errorMessage = data.msg;
        } else if (data.message) {
          // Check for 'message' field
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      setEmailVerificationSent(true); // Indicate that verification link was sent
      setEmailChangeSuccess(
        data.message || "Verification link sent to new email!"
      ); // Use data.message
      // Optionally, update the email in profileData immediately or after successful verification
      // For now, we'll wait for the user to verify via email.
      // setTimeout(() => setShowEmailDialog(false), 3000); // Close after showing success
    } catch (error) {
      console.error("Error changing email:", error);
      setEmailChangeError(
        error.message || "An unexpected error occurred during email change."
      );
    } finally {
      setIsChangingEmail(false);
    }
  };

  const formatDate = (date) => {
    return date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString()
      : "N/A";
  };

  const formatJoinDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return "N/A";
    const options = { year: "numeric", month: "long" };
    return date.toLocaleDateString(undefined, options);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-4 md:py-6 flex-grow">
        <div className="max-w-sm md:max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-xl md:text-3xl font-bold text-gray-800">
              My Profile
            </h1>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-green-600 hover:bg-green-700 text-white md:w-32 h-8 md:h-9 text-xs md:text-sm px-3 md:px-4"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-1 md:gap-2">
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white h-8 md:h-9 text-xs md:text-sm px-3 md:px-4 w-24"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" /> Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="h-8 md:h-9 text-xs md:text-sm px-3 md:px-4 w-24"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Card className="bg-white shadow-md">
            <CardHeader className="text-center p-4 md:p-6">
              <div className="flex flex-col items-center space-y-3 md:space-y-3">
                <div className="text-lg md:text-xl font-semibold text-gray-800">
                  <h1>{profileData.displayName}</h1>
                </div>
                <div className="relative mb-5">
                  <Avatar className="h-16 w-16 md:h-20 md:w-20">
                    <AvatarImage
                      src={profileData.avatar}
                      alt={profileData.displayName}
                    />
                    <AvatarFallback className="text-lg md:text-xl">
                      {profileData.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {isEditing && (
                    <>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <Label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-1 bg-green-600 rounded-full cursor-pointer hover:bg-green-700 transition-colors"
                        title="Change profile picture"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </Label>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                  {/* <div className="flex items-center text-yellow-500 text-xs">
                    <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-500 mr-0.5 md:mr-1" />
                    <span className="font-semibold">
                      {profileData.rating.toFixed(1)}
                    </span>
                  </div>
                   RATING FUNCTIONALITY */}
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 text-xs px-2 py-0.5 md:px-2.5 md:py-1"
                  >
                    {profileData.totalRides} rides completed
                  </Badge>
                </div>
                <p className="text-xs md:text-xs text-gray-500">
                  Member since {formatJoinDate(profileData.joinDate)}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              {saveError && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <strong className="font-bold">Error!</strong>
                  <span className="block sm:inline"> {saveError}</span>
                </div>
              )}
              {saveSuccess && (
                <div
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <strong className="font-bold">Success!</strong>
                  <span className="block sm:inline"> {saveSuccess}</span>
                </div>
              )}

              {/* Personal Information */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-md md:text-lg font-semibold text-gray-800 border-b pb-1.5 md:pb-2">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 ">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label
                      htmlFor="displayName"
                      className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <UserIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      Display Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="displayName"
                        name="displayName"
                        value={profileData.displayName}
                        onChange={(e) =>
                          handleInputChange("displayName", e.target.value)
                        }
                        className="h-10 md:h-12 text-xs md:text-sm"
                      />
                    ) : (
                      <p className="text-gray-700 text-xs md:text-sm">
                        {profileData.displayName}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}

                  <div className="space-y-1.5 md:space-y-2">
                    <Label
                      htmlFor="dateOfBirth"
                      className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <CalendarIcon className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      Date of Birth
                    </Label>
                    <p className="text-gray-700 text-xs md:text-sm">
                      {formatDate(profileData.dateOfBirth)}
                    </p>
                  </div>

                  {/*Email Information*/}

                  <div className="space-y-1.5 md:space-y-2">
                    <Label
                      htmlFor="email"
                      className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <Mail className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      Email
                    </Label>
                    {isEditing ? (
                      <Dialog
                        open={showEmailDialog}
                        onOpenChange={setShowEmailDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 md:h-12 text-xs md:text-sm w-full"
                          >
                            Change
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Change Email Address</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {emailChangeError && (
                              <div
                                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm"
                                role="alert"
                              >
                                {emailChangeError}
                              </div>
                            )}
                            {emailChangeSuccess && (
                              <div
                                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm"
                                role="alert"
                              >
                                {emailChangeSuccess}
                              </div>
                            )}

                            {emailVerificationSent ? (
                              <div className="text-center space-y-3">
                                <AlertCircle className="h-12 w-12 text-green-600 mx-auto" />
                                <div>
                                  <h3 className="font-medium text-green-800">
                                    Verification Link Sent!
                                  </h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Please check your email at{" "}
                                    <strong>{newEmail}</strong> and click the
                                    verification link to complete the email
                                    change.
                                  </p>
                                </div>
                                <Button
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setShowEmailDialog(false);
                                    setNewEmail("");
                                    setEmailVerificationSent(false);
                                    setEmailChangeError(null);
                                    setEmailChangeSuccess(null);
                                  }}
                                >
                                  Close
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="current-email">
                                    Current Email
                                  </Label>
                                  <Input
                                    id="current-email"
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                    className="bg-gray-50 h-10 md:h-12 text-xs md:text-sm"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="new-email">
                                    New Email Address
                                  </Label>
                                  <Input
                                    id="new-email"
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) =>
                                      setNewEmail(e.target.value)
                                    }
                                    placeholder="Enter new email address"
                                    className="h-10 md:h-12 text-xs md:text-sm"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleChangeEmail}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 md:h-12 text-xs md:text-sm"
                                    disabled={isChangingEmail}
                                  >
                                    {isChangingEmail
                                      ? "Sending..."
                                      : "Send Verification Link"}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowEmailDialog(false);
                                      setNewEmail("");
                                      setEmailChangeError(null);
                                      setEmailChangeSuccess(null);
                                    }}
                                    className="h-10 md:h-12 text-xs md:text-sm"
                                    disabled={isChangingEmail}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <p className="text-gray-700 text-xs md:text-sm">
                        {profileData.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label
                      htmlFor="password"
                      className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <Lock className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      Password
                    </Label>
                    {isEditing ? (
                      <Dialog
                        open={showPasswordDialog}
                        onOpenChange={setShowPasswordDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 md:h-12 text-xs md:text-sm w-full"
                          >
                            Change
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {passwordChangeError && (
                              <div
                                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm"
                                role="alert"
                              >
                                {passwordChangeError}
                              </div>
                            )}
                            {passwordChangeSuccess && (
                              <div
                                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm"
                                role="alert"
                              >
                                {passwordChangeSuccess}
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="old-password">
                                Current Password
                              </Label>
                              <Input
                                id="old-password"
                                type="password"
                                value={passwordData.oldPassword}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    oldPassword: e.target.value,
                                  })
                                }
                                placeholder="Enter current password"
                                className="h-10 md:h-12 text-xs md:text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-password">New Password</Label>
                              <Input
                                id="new-password"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    newPassword: e.target.value,
                                  })
                                }
                                placeholder="Enter new password"
                                className="h-10 md:h-12 text-xs md:text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-password">
                                Confirm New Password
                              </Label>
                              <Input
                                id="confirm-password"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    confirmPassword: e.target.value,
                                  })
                                }
                                placeholder="Confirm new password"
                                className="h-10 md:h-12 text-xs md:text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleChangePassword}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 md:h-12 text-xs md:text-sm"
                                disabled={isChangingPassword}
                              >
                                {isChangingPassword
                                  ? "Changing..."
                                  : "Change Password"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowPasswordDialog(false);
                                  setPasswordData({
                                    oldPassword: "",
                                    newPassword: "",
                                    confirmPassword: "",
                                  });
                                  setPasswordChangeError(null);
                                  setPasswordChangeSuccess(null);
                                }}
                                className="h-10 md:h-12 text-xs md:text-sm"
                                disabled={isChangingPassword}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <p className="text-gray-700 text-xs md:text-sm">
                        ••••••••
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* About Me Section */}
              <div className="space-y-3 md:space-y-4 ">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 border-b pb-1.5 md:pb-2 mt-10">
                  About Me
                </h3>
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="bio" className="text-xs md:text-sm">
                    Bio
                  </Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      rows={4}
                      placeholder="Tell other users about yourself..."
                      className="h-20 md:h-24 text-xs md:text-sm"
                      maxLength={200}
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed text-xs md:text-sm whitespace-pre-wrap">
                      {profileData.bio || "No bio provided."}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <BrandFooter />
    </div>
  );
}
