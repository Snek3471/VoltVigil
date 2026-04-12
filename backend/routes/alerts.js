const router = require('express').Router();
const ctrl = require('../controllers/alertController');
router.post('/', ctrl.createAlert);
router.get('/', ctrl.getAlerts);
router.get('/:id', ctrl.getAlert);
router.delete('/:id', ctrl.deleteAlert);
module.exports = router;
