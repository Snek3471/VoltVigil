import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Connects to the backend Socket.io server and returns live alert events.
 * Falls back gracefully if the server is unavailable (demo mode).
 */
export function useAlertSocket() {
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('newAlert', (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 200)); // keep last 200
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { alerts, connected };
}
