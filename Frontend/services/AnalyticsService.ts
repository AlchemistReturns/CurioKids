import { CONFIG } from '../config/firebase';

export const AnalyticsService = {
    async getUsageStats(uid: string) {
        try {
            // CONFIG.BACKEND_URL includes '/api'
            const response = await fetch(`${CONFIG.BACKEND_URL}/analytics/usage?uid=${uid}`);
            if (!response.ok) throw new Error('Failed to fetch usage stats');
            return await response.json();
        } catch (error) {
            console.error('AnalyticsService Error:', error);
            throw error;
        }
    },

    async getCourseStats(uid: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/analytics/courses?uid=${uid}`);
            if (!response.ok) throw new Error('Failed to fetch course stats');
            return await response.json();
        } catch (error) {
            console.error('AnalyticsService Error:', error);
            throw error;
        }
    }
};
