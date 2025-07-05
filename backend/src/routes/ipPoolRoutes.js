const express = require('express');
const router = express.Router();
const ipPoolController = require('../controllers/ipPoolController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(ipPoolController.getPools)
    .post(ipPoolController.addPool);

router.route('/:id')
    .delete(ipPoolController.deletePool);

module.exports = router;