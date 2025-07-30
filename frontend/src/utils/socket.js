// src/utils/socket.js
import { io } from "socket.io-client";

const socket = io(`${import.meta.env.VITE_BASE_URL}`, {
  withCredentials: true,
  autoConnect: false, // Let client control when to connect
});

export default socket;
