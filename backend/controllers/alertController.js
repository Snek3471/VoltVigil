const Alert = require('../models/Alert');
const { sendAlertEmails } = require('../services/emailService');
const { Agent } = require('http');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Persistent HTTP agent for ML — reuses connections
const mlAgent = new Agent({
  keepAlive: true,
  maxSockets: 2,
});

function derivePeakFrequency(features) {
  if (!features) return 0;

  const totalEnergy = (features.avg_band_80_140 || 0) +
                      (features.avg_band_170_230 || 0) +
                      (features.avg_band_270_330 || 0);

  if (totalEnergy < 0.001) return 100; // basically silent

  const scaledFreq = Math.round(
    ((features.avg_band_80_140 || 0) * 300 +
     (features.avg_band_170_230 || 0) * 600 +
     (features.avg_band_270_330 || 0) * 900 +
     (features.avg_hiss_800_4000 || 0) * 4000) /
    (totalEnergy + (features.avg_hiss_800_4000 || 0.001))
  );

  return Math.min(2000, Math.max(100, scaledFreq));
}

function deriveSeverity(features, peakFrequency) {
  if (!features) {
    if (peakFrequency > 1500) return 'critical';
    if (peakFrequency > 1000) return 'high';
    if (peakFrequency > 500)  return 'medium';
    return 'low';
  }
  const {
    avg_band_80_140 = 0,
    avg_band_170_230 = 0,
    avg_band_270_330 = 0,
    avg_hiss_800_4000 = 0
  } = features;
  const score = (avg_band_80_140 + avg_band_170_230 + avg_band_270_330) * 3 + avg_hiss_800_4000;
  if (score > 0.15) return 'critical';
  if (score > 0.08) return 'high';
  if (score > 0.03) return 'medium';
  return 'low';
}

exports.createAlert = async (req, res) => {
  try {
    const {
      lat,
      lng,
      nodeId = 'sensor-01',
      features,
      peakFrequency = 0
    } = req.body;

    // Immediate threshold severity — no waiting
    const immediateSeverity = deriveSeverity(features, peakFrequency);

    const dominantFreq = peakFrequency > 0 ? peakFrequency : derivePeakFrequency(features);

    // Save to MongoDB immediately
    const alert = new Alert({
      nodeId,
      lat,
      lng,
      peakFrequency: dominantFreq,
      severity: immediateSeverity,
      features,
      severitySource: 'threshold',
    });

    const saved = await alert.save();

    // Emit to dashboard IMMEDIATELY — before ML
    req.io.emit('new_alert', saved);

    // Respond to ESP32 immediately — do not block
    res.status(201).json(saved);

    // ML runs AFTER response — fully async, never blocks
    setImmediate(async () => {
      try {
        const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features }),
          signal: AbortSignal.timeout(1500),
          agent: mlAgent,
        });

        if (mlResponse.ok) {
          const mlData = await mlResponse.json();

          // Update alert in MongoDB with ML results
          const updated = await Alert.findByIdAndUpdate(
            saved._id,
            {
              severity: mlData.severity,
              mlSeverity: mlData.severity,
              mlConfidence: mlData.confidence,
              mlCoronaProb: mlData.coronaProbability,
              mlRiskLevel: mlData.riskLevel,
              severitySource: 'ml',
            },
            { new: true }
          );

          // Push ML-updated alert to dashboard
          req.io.emit('alert_updated', updated);

          // emailService owns severity filtering and the per-node cooldown
          try {
            await sendAlertEmails(updated);
          } catch (e) {
            console.error('[Email] Failed:', e.message);
          }
        }
      } catch (e) {
        console.log('[ML] Async update skipped:', e.message);
      }
    });

  } catch (err) {
    console.error('[Alert] Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.nodeId) filter.nodeId = req.query.nodeId;
    const alerts = await Alert.find(filter).sort({ timestamp: -1 }).limit(500);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
