const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/leaderboard', userController.getLeaderboard);
router.get('/:uid/profile', userController.getUserProfile);
router.get('/:uid/progress', userController.getChildProgress);

router.get('/:uid/link-key', userController.getLinkKey);
router.get('/:parentId/children', userController.getChildren);

module.exports = router;
