import { CONFIG } from '../config/firebase';

const BACKEND_URL = `${CONFIG.BACKEND_URL}/progress`;

export const ChildProgressService = {
    /**
     * Marks a lesson or exercise as complete for a child, updating their points and stars.
     * Calls the backend API to handle the database operations.
     */
    async markItemComplete(userId: string, itemId: string, points: number, stars: number, moduleId?: string) {
        try {
            const response = await fetch(`${BACKEND_URL}/mark-complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, itemId, points, stars, moduleId }),
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
    },

    async completeCourse(userId: string, courseId: string, courseName: string, points?: number) {
        try {
            const response = await fetch(`${BACKEND_URL}/complete-course`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseId, courseName, points }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to complete course');
            }
            return await response.json();
        } catch (error) {
            console.error("Error completing course:", error);
            throw error;
        }
    }
};
