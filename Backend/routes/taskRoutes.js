const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/assign', taskController.assignTask);
router.get('/child/:childId', taskController.getChildTasks);
router.post('/complete', taskController.completeTask);
router.get('/parent/:parentId/missed', taskController.getMissedTasks);
router.post('/reassign', taskController.reassignTask);
router.post('/delete', taskController.deleteTask);

module.exports = router;
