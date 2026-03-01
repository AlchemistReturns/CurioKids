import { CONFIG } from '../config/firebase';

export const UserService = {
    async getProfile(uid: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/users/${uid}/profile`);
            if (!response.ok) throw new Error('Failed to fetch profile');
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getProgress(uid: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/users/${uid}/progress`);
            if (!response.ok) throw new Error('Failed to fetch progress');
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getLeaderboard() {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/users/leaderboard`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },
    async getLinkKey(uid: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/users/${uid}/link-key`);
            if (!response.ok) throw new Error('Failed to fetch link key');
            const data = await response.json();
            return data.linkKey;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    async getChildren(parentId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/users/${parentId}/children`);
            if (!response.ok) throw new Error('Failed to fetch children');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    // --- Course Management ---
    async purchaseCourse(userId: string, courseId: string) {
        const response = await fetch(`${CONFIG.BACKEND_URL}/users/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, courseId })
        });
        if (!response.ok) throw new Error('Failed to purchase course');
        return await response.json();
    },

    async enrollChild(parentId: string, childId: string, courseId: string) {
        const response = await fetch(`${CONFIG.BACKEND_URL}/users/enroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId, childId, courseId })
        });
        // Handle 403 (Not Purchased) gracefully in UI, but throw here
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to enroll child');
        }
        return await response.json();
    },

    async unenrollChild(childId: string, courseId: string) {
        const response = await fetch(`${CONFIG.BACKEND_URL}/users/unenroll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ childId, courseId })
        });
        if (!response.ok) throw new Error('Failed to unenroll child');
        return await response.json();
    },

    async updateStatsVisibility(childId: string, visibility: 'everyone' | 'friends' | 'private') {
        const response = await fetch(`${CONFIG.BACKEND_URL}/users/stats-visibility`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ childId, visibility })
        });
        if (!response.ok) throw new Error('Failed to update stats visibility');
        return await response.json();
    }
};
