import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 5000,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // new_alert: threshold severity, sent immediately; alert_updated: ML-enriched version
    socket.on('new_alert', setLatestAlert);
    socket.on('alert_updated', setLatestAlert);

    return () => {
      socket.disconnect();
    };
  }, []);

  return { isConnected, latestAlert };
};

export default useSocket;
