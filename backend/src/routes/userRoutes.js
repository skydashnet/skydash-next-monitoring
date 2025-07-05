const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.use(protect);

router.put('/details', userController.updateUserDetails);
router.put('/change-password', userController.changePassword);
router.post('/avatar', upload.single('avatar'), userController.updateAvatar);
router.delete('/', userController.deleteUserAccount);

module.exports = router;