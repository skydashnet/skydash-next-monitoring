const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/set-active-device', workspaceController.setActiveDevice);
router.get('/me', workspaceController.getWorkspace);
router.get('/interfaces', workspaceController.getAvailableInterfaces);
router.put('/set-main-interface', workspaceController.setMainInterface);

module.exports = router;