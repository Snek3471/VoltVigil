const express = require('express');
const router = express.Router();
const {
  createAlert,
  simulateAlerts,
  getAlerts,
  getAlertById,
  deleteAlert,
} = require('../controllers/alertController');

router.post('/simulate', simulateAlerts);
router.post('/', createAlert);
router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.delete('/:id', deleteAlert);

module.exports = router;
