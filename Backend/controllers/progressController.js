const { firestore } = require('../config/firebase');
const admin = require('firebase-admin');

exports.markItemComplete = async (req, res) => {
    try {
        const { userId, itemId, points, stars } = req.body;

        if (!userId || !itemId || points === undefined || stars === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const progressRef = firestore.collection('child_progress').doc(userId);
        const userRef = firestore.collection('users').doc(userId);

        const progressSnap = await progressRef.get();

        if (!progressSnap.exists) {
            await progressRef.set({
                totalPoints: points,
                stars: stars,
                completedLessons: [itemId],
                streak: 1, // Initialize streak
                lastActivity: new Date()
            });

            // Sync to user doc
            await userRef.update({
                totalPoints: points
            });
        } else {
            const data = progressSnap.data();
            const completedLessons = data.completedLessons || [];

            if (!completedLessons.includes(itemId)) {
                await progressRef.update({
                    totalPoints: admin.firestore.FieldValue.increment(points),
                    stars: admin.firestore.FieldValue.increment(stars),
                    completedLessons: admin.firestore.FieldValue.arrayUnion(itemId),
                    lastActivity: new Date()
                });

                await userRef.update({
                    totalPoints: admin.firestore.FieldValue.increment(points)
                });
            } else {
                console.log(`Item ${itemId} already completed. No additional points awarded.`);
                return res.status(200).json({ message: 'Item already completed', awarded: false });
            }
        }

        res.status(200).json({ message: 'Progress updated successfully', awarded: true });
    } catch (error) {
        console.error("Error updating child progress:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
