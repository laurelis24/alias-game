
import { io } from "socket.io-client";

const IP_ADDRESS = import.meta.env.VITE_IP_ADDRESS;
const PORT = import.meta.env.VITE_PORT;

export const socket = io(`http://${IP_ADDRESS}:${PORT}`, {
  autoConnect: false,
  transports: ["websocket"],
});
