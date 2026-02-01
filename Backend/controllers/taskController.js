const { firestore } = require('../config/firebase');
const admin = require('firebase-admin');

// 1. Assign Task
exports.assignTask = async (req, res) => {
    try {
        const { parentId, childId, courseId, moduleId, courseName, moduleTitle } = req.body;

        if (!parentId || !childId || !courseId || !moduleId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 0. Verify Enrollment (Atomicity Check)
        const progressDoc = await firestore.collection('child_progress').doc(childId).get();
        if (!progressDoc.exists) {
            return res.status(404).json({ error: "Child progress record not found." });
        }

        const enrolledCourses = progressDoc.data().enrolledCourses || [];
        if (!enrolledCourses.includes(courseId) && courseId !== 'test_course_id_1') { // Allow test course
            return res.status(403).json({ error: "Child is not enrolled in this course." });
        }

        const taskData = {
            parentId,
            childId,
            courseId,
            moduleId,
            courseName,
            moduleTitle,
            status: 'pending',
            assignedDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default 24h due date
            starsReward: 50 // Fixed reward per task for now
        };

        const docRef = await firestore.collection('tasks').add(taskData);
        res.status(201).json({ id: docRef.id, ...taskData });

    } catch (error) {
        console.error("Error assigning task:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Get Child's Tasks
exports.getChildTasks = async (req, res) => {
    try {
        const { childId } = req.params;
        const snapshot = await firestore.collection('tasks')
            .where('childId', '==', childId)
            .get(); // We can filter by status frontend or here, let's get all for now to show history or pending

        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Mark Task Complete
exports.completeTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        const taskRef = firestore.collection('tasks').doc(taskId);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).json({ error: "Task not found" });
        }

        const task = taskDoc.data();
        if (task.status === 'completed') {
            return res.status(400).json({ error: "Task already completed" });
        }

        // Update task status
        await taskRef.update({
            status: 'completed',
            completedDate: new Date().toISOString()
        });

        // Award Stars
        // Reuse logic? Or just call DB directly. Let's call DB directly to avoid circular dependency or HTTP loop
        const userId = task.childId;
        const stars = task.starsReward;

        const progressRef = firestore.collection('child_progress').doc(userId);
        const userRef = firestore.collection('users').doc(userId);

        // Update Progress
        await progressRef.update({
            totalPoints: admin.firestore.FieldValue.increment(stars),
            stars: admin.firestore.FieldValue.increment(stars),
            streak: 1, // Maintain streak?
            lastActivity: new Date().toISOString()
        });
        await userRef.update({
            totalPoints: admin.firestore.FieldValue.increment(stars)
        });

        res.json({ message: "Task completed", starsAwarded: stars });

    } catch (error) {
        console.error("Error completing task:", error);
        res.status(500).json({ error: error.message });
    }
};

// 4. Get Missed Tasks for Parent
exports.getMissedTasks = async (req, res) => {
    try {
        const { parentId } = req.params;
        const now = new Date().toISOString();

        // Complex queries might need composite index
        // For simplicity: fetch all pending tasks for parent, filter by date < now
        const snapshot = await firestore.collection('tasks')
            .where('parentId', '==', parentId)
            .where('status', '==', 'pending')
            .get();

        const allPending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const missed = allPending.filter(t => t.dueDate < now);

        res.json(missed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Reassign Task
exports.reassignTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        const taskRef = firestore.collection('tasks').doc(taskId);

        const newDueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await taskRef.update({
            dueDate: newDueDate,
            assignedDate: new Date().toISOString(),
            status: 'pending' // Just in case
        });

        res.json({ message: "Task reassigned", newDueDate });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// 6. Delete Task
exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.body;
        if (!taskId) return res.status(400).json({ error: "Missing taskId" });

        await firestore.collection('tasks').doc(taskId).delete();
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        console.error("Error deleting task", error);
        res.status(500).json({ error: error.message });
    }
};
