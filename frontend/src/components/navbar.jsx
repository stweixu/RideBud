import React from "react";
import { User, LogOut, Car } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext"; // Adjust path as needed
import { Button } from "./ui/button"; // Still need to import the base Button component

// Define NavbarButton component within the same file, but outside the Navbar component's main function
const NavbarButton = ({
  icon: Icon,
  text,
  onClick,
  className,
  variant = "ghost",
}) => {
  const navbarClassName =
    "h-11 text-white hover:bg-green-700 flex items-center py-2 px-3 text-base hover:text-gray-300";

  return (
    <Button variant={variant} className={navbarClassName} onClick={onClick}>
      {Icon && <Icon className="size-6" />}
      {text}
    </Button>
  );
};

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const onProfileClick = (e) => {
    e.preventDefault();
    navigate("/profile");
  };

  const onMyRidesClick = (e) => {
    e.preventDefault();
    navigate("/my-rides");
  };

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-green-600 text-white shadow-md z-50">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <Link className="flex items-center" to="/login">
          <Car size={48} className="mr-2" />
          <h1 className="text-2xl font-bold">RideBud</h1>
        </Link>

        <div className="flex items-center space-x-4">
          <NavbarButton icon={User} text="Profile" onClick={onProfileClick} />

          <NavbarButton icon={Car} text="My Rides" onClick={onMyRidesClick} />

          <NavbarButton icon={LogOut} text="Log Out" onClick={handleLogout} />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
