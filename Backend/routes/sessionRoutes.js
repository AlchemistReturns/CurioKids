const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.get('/', sessionController.getSession);
router.post('/update', sessionController.updateSession);

module.exports = router;
