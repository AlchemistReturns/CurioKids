const { firestore } = require('../config/firebase');
const admin = require('firebase-admin');

exports.getUserProfile = async (req, res) => {
    try {
        const { uid } = req.params;
        const userDoc = await firestore.collection('users').doc(uid).get();
        if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
        res.json(userDoc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getChildProgress = async (req, res) => {
    try {
        const { uid } = req.params;
        const doc = await firestore.collection('child_progress').doc(uid).get();
        if (!doc.exists) return res.json({ totalPoints: 0, stars: 0, completedLessons: [] });
        res.json(doc.data());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const snapshot = await firestore.collection('users')
            .where('role', '==', 'child')
            .orderBy('totalPoints', 'desc')
            .limit(50)
            .get();

        // Filter: only show children whose statsVisibility is 'everyone' (or not set, defaults to visible)
        const leaderboard = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(child => !child.statsVisibility || child.statsVisibility === 'everyone')
            .slice(0, 20);

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatsVisibility = async (req, res) => {
    try {
        const { childId, visibility } = req.body;
        if (!childId || !visibility) {
            return res.status(400).json({ error: 'childId and visibility are required' });
        }
        const validOptions = ['everyone', 'friends', 'private'];
        if (!validOptions.includes(visibility)) {
            return res.status(400).json({ error: 'visibility must be everyone, friends, or private' });
        }

        await firestore.collection('users').doc(childId).update({
            statsVisibility: visibility
        });

        res.json({ message: 'Visibility updated', childId, visibility });
    } catch (error) {
        console.error('Update Stats Visibility Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getLinkKey = async (req, res) => {
    try {
        const { uid } = req.params;
        const doc = await firestore.collection('users').doc(uid).get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });
        res.json({ linkKey: doc.data().linkKey });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getChildren = async (req, res) => {
    try {
        const { parentId } = req.params;
        const snapshot = await firestore.collection('users')
            .where('parentUid', '==', parentId)
            .get();

        const children = await Promise.all(snapshot.docs.map(async doc => {
            const progressDoc = await firestore.collection('child_progress').doc(doc.id).get();
            const progressData = progressDoc.exists ? progressDoc.data() : {};
            return {
                id: doc.id,
                ...doc.data(),
                ...progressData
            };
        }));
        res.json(children);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- New Course Management Logic ---

// 1. Parent "Purchases" a course (Free)
exports.purchaseCourse = async (req, res) => {
    try {
        const { userId, courseId } = req.body;
        if (!userId || !courseId) return res.status(400).json({ error: "Missing required fields" });

        const userRef = firestore.collection('users').doc(userId);

        // Use arrayUnion to add unique courseId
        await userRef.update({
            purchasedCourses: admin.firestore.FieldValue.arrayUnion(courseId)
        });

        res.json({ message: "Course purchased successfully" });
    } catch (error) {
        console.error("Purchase error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Enroll Child (Strictly checks Parent Purchase)
exports.enrollChild = async (req, res) => {
    try {
        const { parentId, childId, courseId } = req.body;

        if (!parentId || !childId || !courseId) return res.status(400).json({ error: "Missing required fields" });

        // A. Verify Parent has purchased the course
        const parentDoc = await firestore.collection('users').doc(parentId).get();
        if (!parentDoc.exists) return res.status(404).json({ error: "Parent not found" });

        const parentData = parentDoc.data();
        const purchased = parentData.purchasedCourses || [];

        // Special case: Allow 'test' courses or check specific IDs if needed, 
        // but requirement says "atomicity", so strict check:
        // OPTIONAL: If we want to allow freely available courses without purchase, specific logic goes here.
        // For now, assuming ALL courses must be purchased first.
        if (!purchased.includes(courseId)) {
            return res.status(403).json({ error: "Parent has not purchased this course yet." });
        }

        // B. Enroll Child (Store in child_progress for cleaner separation, or users)
        // Using child_progress as it tracks active data
        const progressRef = firestore.collection('child_progress').doc(childId);

        await progressRef.set({
            enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId)
        }, { merge: true });

        res.json({ message: "Child enrolled successfully", courseId });

    } catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Unenroll Child
exports.unenrollChild = async (req, res) => {
    try {
        const { childId, courseId } = req.body;
        const progressRef = firestore.collection('child_progress').doc(childId);

        await progressRef.update({
            enrolledCourses: admin.firestore.FieldValue.arrayRemove(courseId)
        });

        res.json({ message: "Child unenrolled" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
