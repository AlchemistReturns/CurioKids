const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/leaderboard', userController.getLeaderboard);
router.get('/:uid/profile', userController.getUserProfile);
router.get('/:uid/progress', userController.getChildProgress);

router.get('/:uid/link-key', userController.getLinkKey);
router.get('/:parentId/children', userController.getChildren);

// Stats Visibility
router.put('/stats-visibility', userController.updateStatsVisibility);

// New Routes
router.post('/purchase', userController.purchaseCourse);
router.post('/enroll', userController.enrollChild);
router.post('/unenroll', userController.unenrollChild);

module.exports = router;
