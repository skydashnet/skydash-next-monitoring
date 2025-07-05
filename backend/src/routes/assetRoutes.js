const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/unconnected-pppoe-users', assetController.getUnconnectedPppoeUsers);

router.route('/')
    .get(assetController.getAssets)
    .post(assetController.addAsset);

router.route('/:id/connections')
    .get(assetController.getAssetConnections)
    .post(assetController.addAssetConnection);

router.route('/:id')
    .put(assetController.updateAsset)
    .delete(assetController.deleteAsset);

module.exports = router;