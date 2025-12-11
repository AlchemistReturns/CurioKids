import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import { firestore } from "../../config/firebase";

export const ChildProgressService = {
    /**
     * Initialize a progress document for a new child.
     */
    initializeProgress: async (childUid: string) => {
        try {
            const progressRef = doc(firestore, "child_progress", childUid);
            const snapshot = await getDoc(progressRef);

            if (!snapshot.exists()) {
                await setDoc(progressRef, {
                    totalPoints: 0,
                    stars: 0,
                    streak: 0,
                    completedItems: {}, // Map of itemId -> { timestamp, points, stars }
                    lastActivity: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error("Error initializing progress:", error);
            throw error;
        }
    },

    /**
     * Get the progress document for a child.
     */
    getProgress: async (childUid: string) => {
        try {
            const progressRef = doc(firestore, "child_progress", childUid);
            const snapshot = await getDoc(progressRef);
            if (snapshot.exists()) {
                return snapshot.data();
            }
            return null;
        } catch (error) {
            console.error("Error fetching progress:", error);
            throw error;
        }
    },

    /**
     * Mark a lesson or exercise as complete and award points/stars.
     * This uses a transaction to ensure points aren't awarded multiple times for the same completion if we want to limit that,
     * though typically we might allow re-playing. For now, assuming first-time completion rewards or always rewards.
     * Let's assume we reward every time for now to encourage practice, or maybe just update the "completed" status.
     * 
     * Implementation: Updates totalPoints, stars, and adds entry to completedItems.
     */
    markItemComplete: async (
        childUid: string,
        itemId: string,
        pointsAwarded: number,
        starsAwarded: number
    ) => {
        try {
            const progressRef = doc(firestore, "child_progress", childUid);

            await runTransaction(firestore, async (transaction) => {
                const sfDoc = await transaction.get(progressRef);
                if (!sfDoc.exists()) {
                    // If for some reason it doesn't exist, handle or throw.
                    // In this flow, we might want to auto-create it, but let's throw for now.
                    throw new Error("Progress document does not exist!");
                }

                const data = sfDoc.data();
                const currentPoints = data.totalPoints || 0;
                const currentStars = data.stars || 0;
                const completedItems = data.completedItems || {};

                // Check if already completed? 
                // For this MVP, let's allow re-earning or just update the timestamp.
                // If we want to strictly limit points to first-time:
                // if (completedItems[itemId]) { return; }

                const newPoints = currentPoints + pointsAwarded;
                const newStars = currentStars + starsAwarded;

                transaction.update(progressRef, {
                    totalPoints: newPoints,
                    stars: newStars,
                    [`completedItems.${itemId}`]: {
                        timestamp: serverTimestamp(),
                        pointsEarned: pointsAwarded,
                        starsEarned: starsAwarded
                    },
                    lastActivity: serverTimestamp(),
                });
            });
        } catch (error) {
            console.error("Error updating progress transaction:", error);
            throw error;
        }
    },
};
