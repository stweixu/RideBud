import React from "react";
import { Box, Flex, Heading, Button, Text } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import colors from "../theme"; // Adjust the import path as necessary
import Navbar from "../components/navbar";

const UserHomePage = () => {
  return <Navbar />;
};

export default UserHomePage;
