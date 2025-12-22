const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');

router.post('/mark-complete', progressController.markItemComplete);

module.exports = router;
