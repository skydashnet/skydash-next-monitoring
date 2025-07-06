const express = require('express');
const router = express.Router();
const slaController = require('../controllers/slaController');

router.post('/event', slaController.handleSlaEvent);

module.exports = router;