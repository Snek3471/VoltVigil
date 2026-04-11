const express = require('express');
const router = express.Router();
const NotificationLog = require('../models/NotificationLog');

// GET /api/notifications/log — last 10 email batches sent
router.get('/log', async (req, res) => {
  try {
    const logs = await NotificationLog.find()
      .sort({ sentAt: -1 })
      .limit(10)
      .populate('alertId', 'nodeId severity peakFrequency');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
