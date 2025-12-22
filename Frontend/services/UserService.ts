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
    }
};
