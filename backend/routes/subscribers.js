const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');

// POST /api/subscribers — register a new subscriber
router.post('/', async (req, res) => {
  try {
    const sub = new Subscriber(req.body);
    const saved = await sub.save();
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already subscribed' });
    }
    res.status(400).json({ error: err.message });
  }
});

// GET /api/subscribers — list all active subscribers
router.get('/', async (req, res) => {
  try {
    const subs = await Subscriber.find({ active: true }).sort({ subscribedAt: -1 });
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subscribers/:id — unsubscribe by ID
router.delete('/:id', async (req, res) => {
  try {
    const sub = await Subscriber.findByIdAndDelete(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subscriber not found' });
    res.json({ message: 'Unsubscribed', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/subscribers/:id — update preferences
router.patch('/:id', async (req, res) => {
  try {
    const sub = await Subscriber.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!sub) return res.status(404).json({ error: 'Subscriber not found' });
    res.json(sub);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
