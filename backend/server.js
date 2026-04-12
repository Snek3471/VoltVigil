require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const os = require('os');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] }
});

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// Attach io to req
app.use((req, res, next) => { req.io = io; next(); });

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TeleGrid backend running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/subscribers', require('./routes/subscribers'));
app.use('/api/notifications', require('./routes/notifications'));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('[MongoDB] Connected successfully'))
  .catch(err => console.error('[MongoDB] Error:', err));

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'unknown';
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] TeleGrid backend running on port ${PORT}`);
  console.log(`         Local:   http://localhost:${PORT}`);
  console.log(`         Network: http://${getLocalIP()}:${PORT}`);
  console.log(`[ESP32]  POST alerts to: http://${getLocalIP()}:${PORT}/api/alerts`);
  console.log(`[ESP32]  Health check:   http://${getLocalIP()}:${PORT}/health`);
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[Socket.io] Client disconnected: ${socket.id}`));
});
