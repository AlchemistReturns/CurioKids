const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);
router.get('/:courseId/modules', courseController.getModules);
router.get('/:courseId/modules/:moduleId/lessons', courseController.getLessons);
router.get('/:courseId/modules/:moduleId/lessons/:lessonId', courseController.getLesson);

module.exports = router;
