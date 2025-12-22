const { firestore } = require('../config/firebase');

exports.getAllCourses = async (req, res) => {
    try {
        const snapshot = await firestore.collection('courses').get();
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await firestore.collection('courses').doc(id).get();
        if (!doc.exists) return res.status(404).json({ error: "Course not found" });
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getModules = async (req, res) => {
    try {
        const { courseId } = req.params;
        const snapshot = await firestore.collection('courses').doc(courseId).collection('modules').orderBy('order').get();
        const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(modules);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLessons = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const snapshot = await firestore.collection('courses').doc(courseId).collection('modules').doc(moduleId).collection('lessons').orderBy('order').get();
        const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLesson = async (req, res) => {
    try {
        const { courseId, moduleId, lessonId } = req.params;
        const doc = await firestore.collection('courses').doc(courseId).collection('modules').doc(moduleId).collection('lessons').doc(lessonId).get();

        if (!doc.exists) return res.status(404).json({ error: "Lesson not found" });

        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
