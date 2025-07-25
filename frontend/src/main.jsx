import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/authProvider";
import { ChakraProvider } from "@chakra-ui/react";
import { ChatUnreadCountProvider } from "./contexts/ChatUnreadCountContext";
import { system } from "@chakra-ui/react/preset";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <ChatUnreadCountProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ChatUnreadCountProvider>
    </ChakraProvider>
  </StrictMode>
);
