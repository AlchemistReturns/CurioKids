import { CONFIG } from '../config/firebase';

const BACKEND_URL = `${CONFIG.BACKEND_URL}/progress`;

export const ChildProgressService = {
    /**
     * Marks a lesson or exercise as complete for a child, updating their points and stars.
     * Calls the backend API to handle the database operations.
     */
    async markItemComplete(userId: string, itemId: string, points: number, stars: number) {
        try {
            const response = await fetch(`${BACKEND_URL}/mark-complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, itemId, points, stars }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update progress');
            }

            const data = await response.json();
            console.log('Progress updated:', data.message);
            return data;
        } catch (error) {
            console.error("Error updating child progress:", error);
            throw error;
        }
    }
};
