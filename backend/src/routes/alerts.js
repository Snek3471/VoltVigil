const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

/**
 * POST /api/alerts
 * Ingest a new fault alert from a sensor node.
 * Broadcasts the saved alert to all connected Socket.io clients.
 */
router.post('/', async (req, res) => {
  try {
    const { nodeId, timestamp, lat, lng, peakFrequency, severity } = req.body;

    const alert = new Alert({
      nodeId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      lat,
      lng,
      peakFrequency,
      severity,
    });

    await alert.save();

    // Broadcast to Socket.io clients
    const io = req.app.get('io');
    if (io) {
      io.emit('newAlert', alert.toObject());
    }

    return res.status(201).json(alert);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[POST /api/alerts]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/alerts
 * Retrieve historical alerts.
 *
 * Optional query parameters:
 *   nodeId    – filter by node identifier
 *   severity  – filter by severity (low | medium | high | critical)
 *   from      – ISO-8601 start datetime
 *   to        – ISO-8601 end datetime
 *   limit     – max number of results (default 100, max 500)
 *   skip      – number of results to skip for pagination
 */
router.get('/', async (req, res) => {
  try {
    const { nodeId, severity, from, to, limit = 100, skip = 0 } = req.query;

    const filter = {};
    if (nodeId) filter.nodeId = nodeId;
    if (severity) filter.severity = severity;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    const safeLimit = Math.min(parseInt(limit, 10) || 100, 500);
    const safeSkip  = parseInt(skip, 10) || 0;

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
           .sort({ timestamp: -1 })
           .skip(safeSkip)
           .limit(safeLimit)
           .lean(),
      Alert.countDocuments(filter),
    ]);

    return res.json({ total, limit: safeLimit, skip: safeSkip, data: alerts });
  } catch (err) {
    console.error('[GET /api/alerts]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
