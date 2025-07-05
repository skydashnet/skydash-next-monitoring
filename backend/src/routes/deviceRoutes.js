const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(deviceController.listDevices)
    .post(deviceController.addDevice);

router.route('/:id')
    .put(deviceController.updateDevice)
    .delete(deviceController.deleteDevice);

module.exports = router;