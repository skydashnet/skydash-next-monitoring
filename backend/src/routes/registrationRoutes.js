const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');

router.post('/request-otp', registrationController.requestRegisterOtp);
router.post('/verify', registrationController.verifyAndRegister);

module.exports = router;