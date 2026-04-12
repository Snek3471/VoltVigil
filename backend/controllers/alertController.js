const Alert = require('../models/Alert');
const { sendAlertEmails } = require('../services/emailService');

// Cooldown tracker
const lastAlertSent = {};

// Derive severity from features using threshold rules
function deriveSeverity(features, peakFrequency) {
  if (!features) {
    if (peakFrequency > 1500) return 'critical';
    if (peakFrequency > 1000) return 'high';
    if (peakFrequency > 500)  return 'medium';
    return 'low';
  }
  const { avg_band_80_140 = 0, avg_band_170_230 = 0, avg_band_270_330 = 0, avg_hiss_800_4000 = 0 } = features;
  const coronaScore = (avg_band_80_140 + avg_band_170_230 + avg_band_270_330) * 3 + avg_hiss_800_4000;
  if (coronaScore > 0.15)  return 'critical';
  if (coronaScore > 0.08)  return 'high';
  if (coronaScore > 0.03)  return 'medium';
  return 'low';
}

exports.createAlert = async (req, res) => {
  try {
    const { lat, lng, nodeId = 'sensor-01', features, peakFrequency = 0 } = req.body;

    // Try ML service first
    let mlData = null;
    try {
      const mlResponse = await fetch('http://localhost:5001/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
        signal: AbortSignal.timeout(2000)
      });
      if (mlResponse.ok) mlData = await mlResponse.json();
    } catch (e) {
      console.log('[ML] Service offline, using threshold fallback');
    }

    const severity = mlData?.severity || deriveSeverity(features, peakFrequency);
    const dominantFreq = peakFrequency || (features ? Math.round((features.avg_band_80_140 || 0) * 10000) : 0);

    const alert = new Alert({
      nodeId,
      lat,
      lng,
      peakFrequency: dominantFreq,
      severity,
      features,
      mlSeverity:     mlData?.severity || null,
      mlConfidence:   mlData?.confidence || null,
      mlCoronaProb:   mlData?.coronaProbability ?? null,
      mlRiskLevel:    mlData?.riskLevel || null,
      severitySource: mlData ? 'ml' : 'threshold',
    });

    const saved = await alert.save();

    // Emit to dashboard
    req.io.emit('new_alert', saved);

    // Send email alerts (with cooldown)
    try {
      const now = Date.now();
      const last = lastAlertSent[nodeId] || 0;
      if (now - last > 5 * 60 * 1000 && ['high','critical'].includes(severity)) {
        lastAlertSent[nodeId] = now;
        await sendAlertEmails(saved);
      }
    } catch (e) {
      console.error('[Email] Failed:', e.message);
    }

    res.status(201).json(saved);
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
