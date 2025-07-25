// src/utils/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true,
  autoConnect: false, // Let client control when to connect
});

export default socket;
