const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', authController.requestLoginOtp);
router.post('/login/verify', authController.verifyLoginOtp);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;