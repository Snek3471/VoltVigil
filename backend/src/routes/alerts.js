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

    // Sanitize inputs to prevent NoSQL injection:
    // – cast string fields to String so object payloads (e.g. {$gt:""}) are rejected
    // – validate severity against the allowed enum
    // – validate date strings before constructing Date objects
    const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];

    const filter = {};

    if (nodeId) {
      if (typeof nodeId !== 'string') {
        return res.status(400).json({ error: 'Invalid nodeId parameter' });
      }
      filter.nodeId = nodeId;
    }

    if (severity) {
      if (!ALLOWED_SEVERITIES.includes(severity)) {
        return res.status(400).json({ error: `Invalid severity. Must be one of: ${ALLOWED_SEVERITIES.join(', ')}` });
      }
      filter.severity = severity;
    }

    if (from || to) {
      filter.timestamp = {};
      if (from) {
        const fromDate = new Date(String(from));
        if (isNaN(fromDate.getTime())) {
          return res.status(400).json({ error: 'Invalid "from" date' });
        }
        filter.timestamp.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(String(to));
        if (isNaN(toDate.getTime())) {
          return res.status(400).json({ error: 'Invalid "to" date' });
        }
        filter.timestamp.$lte = toDate;
      }
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
