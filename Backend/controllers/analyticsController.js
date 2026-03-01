const { firestore } = require('../config/firebase');

const analyticsController = {
    // Get Usage Stats (History + Today)
    async getUsageStats(req, res) {
        try {
            const { uid } = req.query;
            if (!uid) return res.status(400).json({ error: 'UID required' });

            const stats = [];

            // 1. Get History (Last 30 days)
            // Note: Firestore queries might need an index if we order by date, but for now we'll just fetch all or limit if possible.
            // Since documents are IDs by YYYY-MM-DD, we can sort in JS or just fetch the collection.
            const historyRef = firestore.collection('users').doc(uid).collection('usage_stats');
            const historySnap = await historyRef.get();

            historySnap.forEach(doc => {
                stats.push(doc.data());
            });

            // 2. Get Today's Live Data
            const sessionRef = firestore.collection('sessions').doc(uid);
            const sessionDoc = await sessionRef.get();

            if (sessionDoc.exists) {
                const sessionData = sessionDoc.data();
                // Ensure we only add it if it matches today (it should, but good to be safe)
                // Actually, the session might be old if they haven't logged in today, but that's handled by getSession logic usually.
                // However, for analytics, we just want to show what is "current".

                // If the session data is from today, add it.
                // If it's old (yesterday or older), it implies they haven't opened the app today yet to trigger the archival/reset.
                // But for the chart, we can just treat it as "today's pending" or ignore if date mismatch?
                // Let's just return it as is, frontend can handle date logic.

                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];

                if (sessionData.lastResetDate === todayStr) {
                    stats.push({
                        date: todayStr,
                        totalUsageToday: sessionData.totalUsageToday || 0,
                        timeLeft: sessionData.timeLeft,
                        isActive: sessionData.isActive
                    });
                }
            }

            // Sort by date ascending
            stats.sort((a, b) => new Date(a.date) - new Date(b.date));

            res.json(stats);
        } catch (error) {
            console.error('Get Usage Stats Error:', error);
            res.status(500).json({ error: 'Failed to get usage stats' });
        }
    },

    // Get Course Progress Stats
    async getCourseStats(req, res) {
        try {
            const { uid } = req.query;
            if (!uid) return res.status(400).json({ error: 'UID required' });

            const progressRef = firestore.collection('child_progress').doc(uid);
            const doc = await progressRef.get();

            if (!doc.exists) {
                return res.json({
                    totalPoints: 0,
                    stars: 0,
                    completedCourses: [],
                    completedLessons: [],
                    streak: 0,
                    badges: []
                });
            }

            res.json(doc.data());
        } catch (error) {
            console.error('Get Course Stats Error:', error);
            res.status(500).json({ error: 'Failed to get course stats' });
        }
    },

    // Get Child's Rank (computed live from all children's points)
    async getRank(req, res) {
        try {
            const { uid } = req.query;
            if (!uid) return res.status(400).json({ error: 'UID required' });

            // Get this child's totalPoints
            const userDoc = await firestore.collection('users').doc(uid).get();
            if (!userDoc.exists) return res.json({ rank: 0 });

            const myPoints = userDoc.data().totalPoints || 0;

            // Count how many children have MORE points
            const higherSnapshot = await firestore.collection('users')
                .where('role', '==', 'child')
                .where('totalPoints', '>', myPoints)
                .get();

            const rank = higherSnapshot.size + 1;

            res.json({ rank });
        } catch (error) {
            console.error('Get Rank Error:', error);
            res.status(500).json({ error: 'Failed to get rank' });
        }
    }
};

module.exports = analyticsController;
