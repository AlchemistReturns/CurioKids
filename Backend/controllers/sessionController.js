const { firestore } = require('../config/firebase');

const sessionController = {
    // Get Session (or create default)
    async getSession(req, res) {
        try {
            const { uid } = req.query;
            if (!uid) return res.status(400).json({ error: 'UID required' });

            const sessionRef = firestore.collection('sessions').doc(uid);
            const doc = await sessionRef.get();

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"

            // Default Data
            let sessionData = {
                timeLeft: 1800, // 30 mins
                isActive: true,
                totalUsageToday: 0,
                lastResetDate: todayStr,
                lastUpdated: now.toISOString()
            };

            if (doc.exists) {
                const data = doc.data();

                // Check Daily Reset
                if (data.lastResetDate !== todayStr) {
                    // It's a new day! Reset usage.
                    // Optional: Reset timeLeft to default allowance? Let's say yes for "Fresh Start"
                    sessionData = {
                        ...data,
                        totalUsageToday: 0,
                        timeLeft: 1800, // Reset allowance daily? Or keep previous? Let's reset.
                        lastResetDate: todayStr,
                        lastUpdated: now.toISOString()
                    };
                    await sessionRef.set(sessionData, { merge: true });
                } else {
                    sessionData = data;
                }
            } else {
                // Create New
                await sessionRef.set(sessionData);
            }

            res.json(sessionData);
        } catch (error) {
            console.error('Get Session Error:', error);
            res.status(500).json({ error: 'Failed to get session' });
        }
    },

    // Update Session
    async updateSession(req, res) {
        try {
            const { uid, timeLeft, isActive, totalUsageToday } = req.body;
            if (!uid) return res.status(400).json({ error: 'UID required' });

            const sessionRef = firestore.collection('sessions').doc(uid);

            const updateData = {
                lastUpdated: new Date().toISOString()
            };

            if (timeLeft !== undefined) updateData.timeLeft = timeLeft;
            if (isActive !== undefined) updateData.isActive = isActive;
            if (totalUsageToday !== undefined) updateData.totalUsageToday = totalUsageToday;
            if (req.body.lastUpdatedBy !== undefined) updateData.lastUpdatedBy = req.body.lastUpdatedBy;
            if (req.body.lastUpdatedByInstance !== undefined) updateData.lastUpdatedByInstance = req.body.lastUpdatedByInstance;
            if (req.body.pendingAction !== undefined) updateData.pendingAction = req.body.pendingAction;

            await sessionRef.set(updateData, { merge: true });

            res.json({ success: true });
        } catch (error) {
            console.error('Update Session Error:', error);
            res.status(500).json({ error: 'Failed to update session' });
        }
    }
};

module.exports = sessionController;
