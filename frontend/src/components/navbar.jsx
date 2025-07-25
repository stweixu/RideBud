import React, { useState } from "react";
import {
  User,
  LogOut,
  Car,
  MapPinPlus,
  MessageSquare,
  Menu,
  X,
} from "lucide-react"; // Removed Star import
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { Button } from "./ui/button";
import { useChatUnreadCount } from "../contexts/ChatUnreadCountContext";

const NavbarButton = ({
  icon: Icon,
  text,
  onClick,
  variant = "ghost",
  children,
}) => {
  return (
    <Button
      variant={variant}
      className="relative h-10 text-white hover:bg-green-700 flex items-center py-2 px-3 text-xs md:text-sm hover:text-white"
      onClick={onClick}
    >
      {Icon && <Icon className="h-4 w-4 mr-1" />}
      {text}
      {children}
    </Button>
  );
};

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const { totalUnreadCount, loadingUnreadCount, errorUnreadCount } =
    useChatUnreadCount();

  const closeMenuAndNavigate = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      setMenuOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="w-full bg-green-600 text-white shadow-md z-50 mb-2 md:mb-4">
      <div className="container mx-auto flex items-center justify-between h-12 md:h-14 lg:h-16 px-4">
        <Link to="/login" className="flex items-center">
          <Car size={40} className="mr-2" />
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold">RideBud</h1>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
          <NavbarButton
            icon={User}
            text="Profile"
            onClick={() => closeMenuAndNavigate("/profile")}
          />
          <NavbarButton
            icon={MapPinPlus}
            text="Create Journey"
            onClick={() => closeMenuAndNavigate("/create-journey")}
          />
          <NavbarButton
            icon={Car}
            text="My Journeys"
            onClick={() => closeMenuAndNavigate("/my-journeys")}
          />
          {/* My Chats Button with Circular Badge */}
          <NavbarButton
            icon={MessageSquare}
            text="My Chats"
            onClick={() => closeMenuAndNavigate("/conversations")}
          >
            {/* Conditional rendering for the badge */}
            {loadingUnreadCount ? (
              <span className="absolute -top-1 right-0 transform translate-x-1/2 bg-gray-500 text-white text-xs font-bold rounded-full px-1 py-0.5 animate-pulse min-w-[1rem] text-center">
                ...
              </span>
            ) : errorUnreadCount ? (
              <span
                className="absolute -top-1 right-0 transform translate-x-1/2 bg-red-600 text-white text-xs font-bold rounded-full px-1 py-0.5 min-w-[1rem] text-center"
                title={errorUnreadCount}
              >
                !
              </span>
            ) : (
              totalUnreadCount > 0 && (
                <span className="absolute -top-1 right-0 transform translate-x-1/2 bg-yellow-400 text-gray-white text-xs font-bold rounded-full px-1 py-0.5 min-w-[1rem] text-center">
                  {" "}
                  {/* Changed bg-red-500 to bg-yellow-400, text-white to text-black */}
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )
            )}
          </NavbarButton>
          <NavbarButton icon={LogOut} text="Log Out" onClick={handleLogout} />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-green-700 text-white flex flex-col space-y-1 px-4 py-2">
          <NavbarButton
            icon={User}
            text="Profile"
            onClick={() => closeMenuAndNavigate("/profile")}
          />
          <NavbarButton
            icon={MapPinPlus}
            text="Create Journey"
            onClick={() => closeMenuAndNavigate("/create-journey")}
          />
          <NavbarButton
            icon={Car}
            text="My Journeys"
            onClick={() => closeMenuAndNavigate("/my-journeys")}
          />
          {/* My Chats Button with Circular Badge for mobile menu */}
          <NavbarButton
            icon={MessageSquare}
            text="My Chats"
            onClick={() => closeMenuAndNavigate("/conversations")}
          >
            {/* Conditional rendering for the badge */}
            {loadingUnreadCount ? (
              <span className="absolute -top-1 right-0 transform translate-x-1/2 bg-gray-500 text-white text-xs font-bold rounded-full px-1 py-0.5 animate-pulse min-w-[1rem] text-center">
                ...
              </span>
            ) : errorUnreadCount ? (
              <span
                className="absolute -top-1 right-0 transform translate-x-1/2 bg-red-600 text-white text-xs font-bold rounded-full px-1 py-0.5 min-w-[1rem] text-center"
                title={errorUnreadCount}
              >
                !
              </span>
            ) : (
              totalUnreadCount > 0 && (
                <span className="absolute -top-1 right-0 transform translate-x-1/2 bg-yellow-400 text-white text-xs font-bold rounded-full px-1 py-0.5 min-w-[1rem] text-center">
                  {" "}
                  {/* Changed bg-red-500 to bg-yellow-400, text-white to text-black */}
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )
            )}
          </NavbarButton>
          <NavbarButton icon={LogOut} text="Log Out" onClick={handleLogout} />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
