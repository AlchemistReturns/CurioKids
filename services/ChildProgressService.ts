import { arrayUnion, doc, getDoc, increment, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';

export const ChildProgressService = {
    /**
     * Marks a lesson or exercise as complete for a child, updating their points and stars.
     * Prevents double-counting if the item is already marked as complete.
     */
    async markItemComplete(userId: string, itemId: string, points: number, stars: number) {
        try {
            const progressRef = doc(firestore, 'child_progress', userId);
            const userRef = doc(firestore, 'users', userId);
            const progressSnap = await getDoc(progressRef);

            if (!progressSnap.exists()) {
                // Create new progress document if it doesn't exist
                await setDoc(progressRef, {
                    totalPoints: points,
                    stars: stars,
                    completedLessons: [itemId],
                    streak: 1, // Initialize streak
                    lastActivity: new Date()
                });
                // Sync to user doc
                await updateDoc(userRef, {
                    totalPoints: points
                });
            } else {
                const data = progressSnap.data();
                const completedLessons = data.completedLessons || [];

                // Only award points if not already completed
                if (!completedLessons.includes(itemId)) {
                    await updateDoc(progressRef, {
                        totalPoints: increment(points),
                        stars: increment(stars),
                        completedLessons: arrayUnion(itemId),
                        lastActivity: new Date()
                    });
                    // Sync to user doc
                    await updateDoc(userRef, {
                        totalPoints: increment(points)
                    });
                } else {
                    console.log(`Item ${itemId} already completed. No additional points awarded.`);
                }
            }
        } catch (error) {
            console.error("Error updating child progress:", error);
            throw error;
        }
    }
};
