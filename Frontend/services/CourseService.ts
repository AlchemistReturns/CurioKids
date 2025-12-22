import { CONFIG } from '../config/firebase';

export const CourseService = {
    async getCourses() {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/courses`);
            if (!response.ok) throw new Error('Failed to fetch courses');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getModules(courseId) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/courses/${courseId}/modules`);
            if (!response.ok) throw new Error('Failed to fetch modules');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getLessons(courseId, moduleId) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/courses/${courseId}/modules/${moduleId}/lessons`);
            if (!response.ok) throw new Error('Failed to fetch lessons');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getLesson(courseId, moduleId, lessonId) {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
            if (!response.ok) throw new Error('Failed to fetch lesson');
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    }
};
