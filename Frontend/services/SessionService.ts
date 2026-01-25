import { CONFIG } from '../config/firebase';

export interface SessionData {
    timeLeft: number;
    isActive: boolean;
    totalUsageToday: number;
    lastResetDate: string;
    lastUpdated: string;
    lastUpdatedBy?: 'child' | 'parent';
    lastUpdatedByInstance?: string;
    pendingAction?: {
        type: 'add_time' | 'set_active' | 'reset';
        value: any;
        id: string; // UUID to prevent duplicate processing
    } | null;
}

export const SessionService = {
    async getSession(uid: string): Promise<SessionData> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/session?uid=${uid}&_t=${Date.now()}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error('Failed to fetch session');
            return await response.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.error('Get Session Timeout');
            } else {
                console.error('Get Session Error:', error);
            }
            throw error;
        }
    },

    async updateSession(uid: string, data: Partial<SessionData>): Promise<void> {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/session/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid, ...data })
            });
            if (!response.ok) throw new Error('Failed to update session');
        } catch (error) {
            console.error('Update Session Error:', error);
            throw error;
        }
    }
};
