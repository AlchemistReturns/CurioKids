const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Get Usage History
// GET /api/analytics/usage?uid=USER_ID
router.get('/usage', analyticsController.getUsageStats);

// Get Course Stats
// GET /api/analytics/courses?uid=USER_ID
router.get('/courses', analyticsController.getCourseStats);

// Get Child Rank
// GET /api/analytics/rank?uid=USER_ID
router.get('/rank', analyticsController.getRank);

module.exports = router;
