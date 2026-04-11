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

    // Validate and sanitize inputs to prevent NoSQL injection.
    // Use Mongoose query builder (.where().equals()) with explicit scalar coercion
    // so no user-supplied object can inject MongoDB query operators.
    const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];

    // nodeId must be a plain string (Express may parse nested params as objects)
    if (nodeId !== undefined && typeof nodeId !== 'string') {
      return res.status(400).json({ error: 'Invalid nodeId parameter' });
    }

    // severity must be one of the known enum values
    if (severity !== undefined && !ALLOWED_SEVERITIES.includes(severity)) {
      return res.status(400).json({ error: `Invalid severity. Must be one of: ${ALLOWED_SEVERITIES.join(', ')}` });
    }

    // Validate date strings before use
    let fromDate, toDate;
    if (from !== undefined) {
      fromDate = new Date(String(from));
      if (isNaN(fromDate.getTime())) {
        return res.status(400).json({ error: 'Invalid "from" date' });
      }
    }
    if (to !== undefined) {
      toDate = new Date(String(to));
      if (isNaN(toDate.getTime())) {
        return res.status(400).json({ error: 'Invalid "to" date' });
      }
    }

    const safeLimit = Math.min(parseInt(limit, 10) || 100, 500);
    const safeSkip  = parseInt(skip, 10) || 0;

    // Build query using the Mongoose query builder API to avoid raw filter objects
    // carrying user input. .equals() enforces scalar equality, preventing operator injection.
    let findQuery  = Alert.find();
    let countQuery = Alert.countDocuments();

    if (nodeId) {
      findQuery  = findQuery.where('nodeId').equals(String(nodeId));
      countQuery = countQuery.where('nodeId').equals(String(nodeId));
    }
    if (severity) {
      findQuery  = findQuery.where('severity').equals(severity);
      countQuery = countQuery.where('severity').equals(severity);
    }
    if (fromDate) {
      findQuery  = findQuery.where('timestamp').gte(fromDate);
      countQuery = countQuery.where('timestamp').gte(fromDate);
    }
    if (toDate) {
      findQuery  = findQuery.where('timestamp').lte(toDate);
      countQuery = countQuery.where('timestamp').lte(toDate);
    }

    const [alerts, total] = await Promise.all([
      findQuery.sort({ timestamp: -1 }).skip(safeSkip).limit(safeLimit).lean(),
      countQuery,
    ]);

    return res.json({ total, limit: safeLimit, skip: safeSkip, data: alerts });
  } catch (err) {
    console.error('[GET /api/alerts]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
