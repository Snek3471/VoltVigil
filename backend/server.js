require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const os = require('os');

const alertRoutes = require('./routes/alerts');

// ---------------------------------------------------------------------------
// Network utility — finds the first non-loopback IPv4 address
// ---------------------------------------------------------------------------
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'unknown';
}

const app = express();
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// Socket.io — accept connections from any origin during development
// ---------------------------------------------------------------------------
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
});

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// ---------------------------------------------------------------------------
// Health check — reachable without any DB data; useful for ESP32 ping test
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'VoltVigil backend is running',
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/alerts', alertRoutes);

// ---------------------------------------------------------------------------
// Socket.io connection handling
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.emit('connection_status', {
    connected: true,
    message: 'Connected to VoltVigil server',
    socketId: socket.id,
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// ---------------------------------------------------------------------------
// Connect to MongoDB then start server on all interfaces (0.0.0.0)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voltvigil';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('[MongoDB] Connected successfully');
    server.listen(PORT, '0.0.0.0', () => {
      const localIP = getLocalIP();
      console.log(`[Server] VoltVigil backend running on port ${PORT}`);
      console.log(`         Local:   http://localhost:${PORT}`);
      console.log(`         Network: http://${localIP}:${PORT}`);
      console.log(`[ESP32]  POST alerts to: http://${localIP}:${PORT}/api/alerts`);
      console.log(`[ESP32]  Health check:   http://${localIP}:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error('[MongoDB] Connection error:', err.message);
    process.exit(1);
  });
