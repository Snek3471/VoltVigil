const Alert = require('../models/Alert');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const ML_TIMEOUT_MS  = 3000;

// ---------------------------------------------------------------------------
// Call the ML microservice to predict severity.
// Returns { severity, mlConfidence, mlFeatureBreakdown, severitySource }
// Falls back gracefully to threshold values if the service is unreachable.
// ---------------------------------------------------------------------------
async function predictSeverity(body) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ML_TIMEOUT_MS);

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peakFrequency:     body.peakFrequency,
        amplitude:         body.amplitude         ?? 0.5,
        lat:               body.lat,
        lng:               body.lng,
        hourOfDay:         new Date().getHours(),
        frequencyVariance: body.frequencyVariance  ?? 0,
        alertsLastHour:    body.alertsLastHour     ?? 0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    const ml = await response.json();
    return {
      severity:           ml.predictedSeverity,
      mlConfidence:       ml.confidence,
      mlFeatureBreakdown: ml.featureBreakdown,
      severitySource:     'ml',
    };
  } catch (err) {
    console.warn('[ML] Service unavailable — using threshold severity:', err.message);
    return {
      severity:           body.severity,
      mlConfidence:       null,
      mlFeatureBreakdown: null,
      severitySource:     'threshold',
    };
  }
}

// ---------------------------------------------------------------------------
// POST /api/alerts — ingest a new alert, emit socket event
// ---------------------------------------------------------------------------
const createAlert = async (req, res) => {
  try {
    const { severity, mlConfidence, mlFeatureBreakdown, severitySource } =
      await predictSeverity(req.body);

    const alert = new Alert({
      ...req.body,
      severity,
      mlConfidence,
      mlFeatureBreakdown,
      severitySource,
    });

    const saved = await alert.save();

    const io = req.app.get('io');
    io.emit('new_alert', saved);

    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/alerts — retrieve all alerts, sorted newest first
// Optional query params: severity, nodeId
// ---------------------------------------------------------------------------
const getAlerts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.nodeId)   filter.nodeId   = req.query.nodeId;

    const alerts = await Alert.find(filter).sort({ timestamp: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/alerts/:id
// ---------------------------------------------------------------------------
const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/alerts/:id
// ---------------------------------------------------------------------------
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
