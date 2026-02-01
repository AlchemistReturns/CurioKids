import { CONFIG } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CourseService = {
    async getCourses() {
        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/courses`);
            let coursesData = [];
            if (response.ok) {
                coursesData = await response.json();
            } else {
                console.warn("Failed to fetch courses from backend");
            }

            const allCourses = [...coursesData];

            // Centralized Data Enrichment (Age Parsing)
            const enrichedCourses = allCourses.map(course => {
                let minAge = 0;
                let maxAge = 99;
                let tag = course.ageTag || (course.id === 'logic_lumo' ? '6-8' : '3-5');

                try {
                    // Robust Regex Parsing
                    const rangeMatch = tag.match(/(\d+)\s*-\s*(\d+)/);
                    const plusMatch = tag.match(/(\d+)\s*\+/);
                    const singleMatch = tag.match(/(\d+)/);

                    if (rangeMatch) {
                        minAge = parseInt(rangeMatch[1], 10);
                        maxAge = parseInt(rangeMatch[2], 10);
                    } else if (plusMatch) {
                        minAge = parseInt(plusMatch[1], 10);
                        maxAge = 99;
                    } else if (singleMatch) {
                        minAge = parseInt(singleMatch[1], 10);
                        maxAge = minAge + 2;
                    }
                } catch (e) {
                    console.warn("Age parse error", e);
                }

                if (course.id === 'balance_buddies') {
                    tag = '6-9'; // Fix missing age tag
                    minAge = 6;
                    maxAge = 9;
                }

                return {
                    ...course,
                    ageTag: tag,
                    minAge,
                    maxAge
                };
            });

            // Inject Arcade Playground if missing (Mock)
            const stats = enrichedCourses.map(c => c.title);
            console.log("Current Courses:", stats);

            if (!enrichedCourses.find(c => c.title === 'Arcade Playground')) {
                enrichedCourses.push({
                    id: 'arcade_playground',
                    title: 'Arcade Playground',
                    description: 'Pop balloons and learn letters! 🎈',
                    icon: 'game-controller',
                    color: '#ff4081',
                    ageTag: '3+',
                    minAge: 3,
                    maxAge: 99,
                    isTest: false, // Treat as real course
                    modules: [] // Will need to mock modules potentially if fetched separately
                });
            }

            return enrichedCourses;
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getModules(courseId: string) { // Fixed implicit any
        if (courseId === 'arcade_playground') {
            return [{
                id: 'arcade_mod_1',
                title: 'Bubble Fun',
                order: 1
            }];
        }

        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/courses/${courseId}/modules`);
            if (!response.ok) throw new Error('Failed to fetch modules');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getLessons(courseId: string, moduleId: string) { // Fixed implicit any
        if (courseId === 'arcade_playground') {
            return [{
                id: 'arcade_lesson_1',
                title: 'Alphabet Pop',
                type: 'bubble_pop',
                points: 50,
                stars: 3,
                order: 1
            }];
        }

        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/courses/${courseId}/modules/${moduleId}/lessons`);
            if (!response.ok) throw new Error('Failed to fetch lessons');
            return await response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    async getLesson(courseId: string, moduleId: string, lessonId: string) { // Fixed implicit any
        if (courseId === 'arcade_playground' && lessonId === 'arcade_lesson_1') {
            return {
                id: 'arcade_lesson_1',
                title: 'Alphabet Pop',
                type: 'bubble_pop',
                points: 50,
                stars: 3,
                order: 1,
                content: 'Pop bubbles!'
            };
        }

        try {
            const response = await fetch(`${CONFIG.BACKEND_URL}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
            if (!response.ok) throw new Error('Failed to fetch lesson');
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    // --- Enrollment Logic (Mock / Local Storage) ---

    // --- Enrollment Logic (Backend Integrated) ---

    async getEnrolledCourses(childId: string): Promise<string[]> {
        try {
            // Fetch from backend via UserService (reusing progress endpoint)
            const response = await fetch(`${CONFIG.BACKEND_URL}/users/${childId}/progress`);
            if (response.ok) {
                const data = await response.json();
                return data.enrolledCourses || [];
            }
            return [];
        } catch (e) {
            console.warn("Failed to load enrollments", e);
            return [];
        }
    },

    // Note: This signature changes slightly in usage, we need parentId now.
    // For backward compatibility or ease, we might need to pass parentId from UI.
    // I will update the UI to pass parentId.
    async toggleEnrollment(parentId: string, childId: string, courseId: string, isEnrolled: boolean) {
        try {
            if (isEnrolled) {
                // If currently enrolled (true), we want to TOGGLE to UNENROLL
                // Wait, the arg isEnrolled usually means "Target State" or "Current State"?
                // UI Logic: handleToggleEnrollment checks list, if in list -> remove, else -> add.
                // Let's assume the UI passes the NEW DESIRED STATE?
                // Actually, looking at previous code: `const newStatus = !isEnrolled; toggleEnrollment(... newStatus)`
                // So the `isEnrolled` arg IS the target state.

                // However, to keep it clean, let's look at the UI code again.
                // UI: `const isEnrolled = list.includes(id); toggle(..., !isEnrolled)`
                // So `isEnrolled` param IS the target state (true = want to enroll).
                if (isEnrolled) {
                    await import('./UserService').then(m => m.UserService.enrollChild(parentId, childId, courseId));
                } else {
                    await import('./UserService').then(m => m.UserService.unenrollChild(childId, courseId));
                }
            } else {
                // Target is FALSE (Unenroll)
                await import('./UserService').then(m => m.UserService.unenrollChild(childId, courseId));
            }

            // Return updated list
            return await this.getEnrolledCourses(childId);
        } catch (e) {
            console.error("Failed to save enrollment", e);
            throw e;
        }
    }
};
