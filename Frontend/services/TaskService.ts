import { CONFIG } from '../config/firebase';

export interface Task {
    id: string;
    courseName: string;
    moduleTitle: string;
    status: 'pending' | 'completed' | 'missed';
    starsReward?: number;
    dueDate?: string;
    [key: string]: any;
}

export const TaskService = {
    async assignTask(taskData: any) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/tasks/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            if (!response.ok) throw new Error('Failed to assign task');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async getChildTasks(childId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/tasks/child/${childId}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async completeTask(taskId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/tasks/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId })
            });
            if (!response.ok) throw new Error('Failed to complete task');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async getMissedTasks(parentId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/tasks/parent/${parentId}/missed`);
            if (!response.ok) throw new Error('Failed to fetch missed tasks');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async reassignTask(taskId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/tasks/reassign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId })
            });
            if (!response.ok) throw new Error('Failed to reassign task');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    async deleteTask(taskId: string) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/tasks/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId })
            });
            if (!response.ok) throw new Error('Failed to delete task');
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};
