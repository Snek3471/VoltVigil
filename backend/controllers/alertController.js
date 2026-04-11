const Alert = require('../models/Alert');
const { sendAlertEmails } = require('../services/emailService');

// POST /api/alerts — ingest a new alert, emit socket event, trigger emails
const createAlert = async (req, res) => {
  try {
    const alert = new Alert(req.body);
    const saved = await alert.save();

    // Emit to all connected Socket.io clients
    const io = req.app.get('io');
    io.emit('new_alert', saved);

    // Send email notifications — never let this crash the pipeline
    try {
      await sendAlertEmails(saved);
    } catch (emailErr) {
      console.error('[Email] Unexpected error in sendAlertEmails:', emailErr.message);
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/alerts — retrieve all alerts, sorted newest first
// Optional query params: severity, nodeId
const getAlerts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.nodeId) filter.nodeId = req.query.nodeId;

    const alerts = await Alert.find(filter).sort({ timestamp: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/alerts/:id — retrieve single alert by ID
const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/alerts/:id — delete alert by ID
const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ message: 'Alert deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createAlert, getAlerts, getAlertById, deleteAlert };
