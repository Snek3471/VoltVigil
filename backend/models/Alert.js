const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  nodeId:        { type: String, default: 'sensor-01' },
  lat:           { type: Number, required: true },
  lng:           { type: Number, required: true },
  peakFrequency: { type: Number, default: 0 },
  severity:      { type: String, enum: ['low','medium','high','critical'], default: 'low' },
  timestamp:     { type: Date, default: Date.now },

  // Raw ESP32 feature fields
  features: {
    avg_80:              Number,
    avg_100:             Number,
    avg_120:             Number,
    avg_180:             Number,
    avg_200:             Number,
    avg_220:             Number,
    avg_280:             Number,
    avg_300:             Number,
    avg_320:             Number,
    avg_lowband_20_80:   Number,
    avg_band_80_140:     Number,
    avg_band_170_230:    Number,
    avg_band_270_330:    Number,
    avg_hiss_800_4000:   Number,
  },

  // ML prediction fields
  mlSeverity:         { type: String, default: null },
  mlConfidence:       { type: Number, default: null },
  mlCoronaProb:       { type: Number, default: null },
  mlRiskLevel:        { type: String, default: null },
  severitySource:     { type: String, enum: ['ml','threshold'], default: 'threshold' },
});

module.exports = mongoose.model('Alert', AlertSchema);
