const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', sessionController.getActiveSessions);
router.delete('/:id', sessionController.deleteSession);

module.exports = router;