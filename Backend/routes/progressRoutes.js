const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');

router.post('/mark-complete', progressController.markItemComplete);
router.post('/complete-course', progressController.completeCourse);

module.exports = router;
