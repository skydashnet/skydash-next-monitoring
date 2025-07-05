const express = require('express');
const router = express.Router();
const hotspotController = require('../controllers/hotspotController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', hotspotController.getHotspotSummary);
router.get('/profiles', hotspotController.getHotspotProfiles);
router.post('/vouchers/generate', hotspotController.generateVouchers);
router.route('/users')
    .get(hotspotController.getHotspotUsers)
    .post(hotspotController.addHotspotUser);
router.route('/users/:id')
    .delete(hotspotController.deleteHotspotUser);

router.put('/users/:id/status', hotspotController.setHotspotUserStatus);
router.post('/active/:id/kick', hotspotController.kickHotspotUser);

module.exports = router;