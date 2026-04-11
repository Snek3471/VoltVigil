const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    nodeId: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    peakFrequency: {
      type: Number,
      required: true,
      min: 0,
    },
    severity: {
      type: String,
      required: true,
      enum: ['low', 'medium', 'high', 'critical'],
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt managed by Mongoose
  }
);

// Index for common query patterns
alertSchema.index({ nodeId: 1, timestamp: -1 });
alertSchema.index({ severity: 1 });

module.exports = mongoose.model('Alert', alertSchema);
