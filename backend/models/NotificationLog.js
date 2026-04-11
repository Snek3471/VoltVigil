const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    required: true,
  },
  subscribersNotified: {
    type: Number,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
  },
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
