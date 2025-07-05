const express = require('express');
const router = express.Router();
const botController = require('../controllers/botController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/toggle', botController.toggleBotStatus);
router.post('/test-report', botController.sendTestReport);

module.exports = router;