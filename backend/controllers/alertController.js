const Alert = require('../models/Alert');
const { sendAlertEmails } = require('../services/emailService');

async function persistAlertPipeline(req, alertDoc) {
  const saved = await alertDoc.save();
  const io = req.app.get('io');
  if (io) io.emit('new_alert', saved);
  try {
    await sendAlertEmails(saved);
  } catch (emailErr) {
    console.error('[Email] Unexpected error in sendAlertEmails:', emailErr.message);
  }
  return saved;
}

// POST /api/alerts — ingest a new alert, emit socket event, trigger emails
const createAlert = async (req, res) => {
  try {
    const saved = await persistAlertPipeline(req, new Alert(req.body));
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/alerts/simulate — create fake alerts for UI / socket testing (dev)
const simulateAlerts = async (req, res) => {
  try {
    const raw = parseInt(String(req.query.count ?? '8'), 10);
    const count = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 25) : 8;

    const severities = ['low', 'medium', 'high', 'critical'];
    const anchors = [
      { nodeId: 'SIM-NYC', lat: 40.7128, lng: -74.006 },
      { nodeId: 'SIM-CHI', lat: 41.8781, lng: -87.6298 },
      { nodeId: 'SIM-HOU', lat: 29.7604, lng: -95.3698 },
      { nodeId: 'SIM-LAX', lat: 34.0522, lng: -118.2437 },
      { nodeId: 'SIM-ATL', lat: 33.749, lng: -84.388 },
      { nodeId: 'SIM-SEA', lat: 47.6062, lng: -122.3321 },
    ];

    const jitter = () => (Math.random() - 0.5) * 0.28;
    const created = [];

    for (let i = 0; i < count; i++) {
      const a = anchors[i % anchors.length];
      const alert = new Alert({
        nodeId: a.nodeId,
        lat: a.lat + jitter(),
        lng: a.lng + jitter(),
        peakFrequency: Math.round(700 + Math.random() * 1800),
        severity: severities[Math.floor(Math.random() * severities.length)],
      });
      created.push(await persistAlertPipeline(req, alert));
    }

    console.log(`[Simulate] Created ${created.length} fake alert(s)`);
    res.status(201).json({
      message: 'Simulated alerts created',
      count: created.length,
      alerts: created,
    });
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

module.exports = { createAlert, simulateAlerts, getAlerts, getAlertById, deleteAlert };
