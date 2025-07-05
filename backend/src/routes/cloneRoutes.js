const express = require('express');
const router = express.Router();
const cloneController = require('../controllers/cloneController');
const { protect } = require('../middleware/authMiddleware');
router.use(protect);
router.post('/generate-code', cloneController.generateCode);
router.post('/use-code', cloneController.useCode);
module.exports = router;