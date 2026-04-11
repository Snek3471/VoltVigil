import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connection_status', (data) => {
      console.log('[Socket.io] Server confirmed connection:', data);
    });

    socket.on('new_alert', (alert) => {
      console.log('[Socket.io] New alert received:', alert);
      setLatestAlert(alert);
    });

    return () => {
      console.log('[Socket.io] Cleaning up connection');
      socket.disconnect();
    };
  }, []);

  return { isConnected, latestAlert };
};

export default useSocket;
