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

            // Test Course Injection
            const testCourse = {
                id: 'test_course_id_1',
                title: 'TEST',
                description: 'Click to complete instantly!',
                icon: 'flask',
                color: '#9C27B0',
                isTest: true,
                stars: 50,
                ageTag: '9+'
            };

            const allCourses = [...coursesData, testCourse];

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

    async getEnrolledCourses(childId: string): Promise<string[]> {
        try {
            const json = await AsyncStorage.getItem(`enrollments_${childId}`);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.warn("Failed to load enrollments", e);
            return [];
        }
    },

    async toggleEnrollment(childId: string, courseId: string, isEnrolled: boolean) {
        try {
            const current = await this.getEnrolledCourses(childId);
            const newSet = new Set(current);
            if (isEnrolled) {
                newSet.add(courseId);
            } else {
                newSet.delete(courseId);
            }
            await AsyncStorage.setItem(`enrollments_${childId}`, JSON.stringify(Array.from(newSet)));
            return Array.from(newSet);
        } catch (e) {
            console.error("Failed to save enrollment", e);
            throw e;
        }
    }
};
