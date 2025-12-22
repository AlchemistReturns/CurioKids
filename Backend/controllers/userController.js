const { firestore } = require('../config/firebase');

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
        if (!doc.exists) return res.json({ totalPoints: 0, stars: 0, completedLessons: [] }); // Default
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
            .limit(20)
            .get();

        const leaderboard = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(leaderboard);
    } catch (error) {
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

        const children = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(children);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
