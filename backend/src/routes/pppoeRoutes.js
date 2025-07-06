const express = require('express');
const router = express.Router();
const pppoeController = require('../controllers/pppoeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', pppoeController.getSummary);
router.get('/secrets', pppoeController.getSecrets);
router.post('/secrets', pppoeController.addSecret);
router.get('/profiles', pppoeController.getProfiles);
router.get('/next-ip', pppoeController.getNextIp);
router.put('/secrets/:id/status', pppoeController.setSecretStatus);
router.post('/active/:id/kick', pppoeController.kickActiveUser);
router.get('/secrets/:name/sla', pppoeController.getSlaDetails);
router.get('/secrets/:name/usage', pppoeController.getUsageHistory);
router.route('/secrets/:id')
    .put(pppoeController.updateSecret)
    .delete(pppoeController.deleteSecret);

module.exports = router;