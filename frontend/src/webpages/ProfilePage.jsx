import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, Star, Edit, Save, X } from "lucide-react";
import Navbar from "@/components/navbar";
import BrandFooter from "@/components/BrandFooter";

export default function ProfilePage({
  onSave = () => console.log("Profile saved"),
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    location: "Downtown, City",
    bio: "Friendly commuter who enjoys sharing rides and meeting new people. I drive a clean, comfortable sedan and always play good music!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
    rating: 4.8,
    totalRides: 127,
    joinDate: "January 2023",
  });

  // NEW STATE: To store a snapshot of the data before editing starts
  const [originalProfileData, setOriginalProfileData] = useState(profileData);

  const handleInputChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prevData) => ({
          ...prevData,
          avatar: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(profileData); // Call the onSave prop with the new data
    setIsEditing(false);
    // IMPORTANT: Update originalProfileData to the newly saved data
    // so that if they edit again, this is the new starting point.
    setOriginalProfileData(profileData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // REVERT CHANGES: Set profileData back to the original snapshot
    setProfileData(originalProfileData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-4 md:py-6 flex-grow">
        <div className="max-w-lg md:max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h1 className="text-xl md:text-3xl font-bold text-gray-800">
              My Profile
            </h1>
            {!isEditing ? (
              <Button
                onClick={() => {
                  setIsEditing(true);
                  // Capture the current profileData when editing starts
                  setOriginalProfileData(profileData);
                }}
                className="bg-green-600 hover:bg-green-700 text-white md:w-32 h-8 md:h-9 text-xs md:text-sm px-3 md:px-4"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-1 md:gap-2">
                <Button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white h-8 md:h-9 text-xs md:text-sm px-3 md:px-4 w-24"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="h-8 md:h-9 text-xs md:text-sm px-3 md:px-4 w-24"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Card className="bg-white shadow-md">
            <CardHeader className="text-center p-4 md:p-6">
              <div className="flex flex-col items-center space-y-3 md:space-y-3">
                <div className="text-lg md:text-xl font-semibold text-gray-800">
                  <h1>{profileData.name}</h1>
                </div>{" "}
                <div className="relative mb-5">
                  <Avatar className="h-16 w-16 md:h-20 md:w-20">
                    <AvatarImage
                      src={profileData.avatar}
                      alt={profileData.name}
                    />
                    <AvatarFallback className="text-lg md:text-xl">
                      {profileData.name.charAt(0)}
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
                  <div className="flex items-center text-yellow-500 text-xs">
                    <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-500 mr-0.5 md:mr-1" />
                    <span className="font-semibold">{profileData.rating}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-50 text-green-700 text-xs px-2 py-0.5 md:px-2.5 md:py-1"
                  >
                    {profileData.totalRides} rides completed
                  </Badge>
                </div>
                <p className="text-xs md:text-xs text-gray-500">
                  Member since {profileData.joinDate}
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              {/* Personal Information */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-md md:text-lg font-semibold text-gray-800 border-b pb-1.5 md:pb-2">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 ">
                  <div className="space-y-1.5 md:space-y-2">
                    <Label
                      htmlFor="name"
                      className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <User className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      Display Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="h-10 md:h-12 text-xs md:text-sm"
                      />
                    ) : (
                      <p className="text-gray-700 text-xs md:text-sm">
                        {profileData.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label
                      htmlFor="email"
                      className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <Mail className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      Email
                    </Label>

                    {isEditing ? (
                      <p className="text-black text-xs md:text-sm">
                        {" "}
                        Email can no longer be changed.
                      </p>
                    ) : (
                      <p className="text-gray-700 text-xs md:text-sm">
                        {profileData.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label
                      htmlFor="phone"
                      className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <Phone className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="h-10 md:h-12 text-xs md:text-sm"
                      />
                    ) : (
                      <p className="text-gray-700 text-xs md:text-sm">
                        {profileData.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <Label
                      htmlFor="location"
                      className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm"
                    >
                      <MapPin className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                      Location
                    </Label>
                    {isEditing ? (
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(e) =>
                          handleInputChange("location", e.target.value)
                        }
                        className="h-10 md:h-12 text-xs md:text-sm"
                      />
                    ) : (
                      <p className="text-gray-700 text-xs md:text-sm">
                        {profileData.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio Section */}
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
                      value={profileData.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      rows={4}
                      placeholder="Tell other users about yourself..."
                      className="h-20 md:h-24 text-xs md:text-sm"
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed text-xs md:text-sm">
                      {profileData.bio}
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
