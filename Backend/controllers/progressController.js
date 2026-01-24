const { firestore } = require('../config/firebase');
const admin = require('firebase-admin');

// Helper to check same day or consecutive day
const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const isYesterday = (d1, d2) => {
    const yesterday = new Date(d2);
    yesterday.setDate(d2.getDate() - 1);
    return isSameDay(d1, yesterday);
};

exports.markItemComplete = async (req, res) => {
    try {
        const { userId, itemId, points, stars } = req.body;

        if (!userId || !itemId || points === undefined || stars === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const progressRef = firestore.collection('child_progress').doc(userId);
        const userRef = firestore.collection('users').doc(userId);

        const progressSnap = await progressRef.get();
        const now = new Date();

        if (!progressSnap.exists) {
            await progressRef.set({
                totalPoints: stars, // Points = Stars
                stars: stars,
                completedLessons: [itemId],
                streak: 1,
                lastActivity: now.toISOString(),
                badges: [],
                completedCourses: [],
                moduleScores: {}
            });

            await userRef.update({
                totalPoints: points
            });
        } else {
            const data = progressSnap.data();
            const completedLessons = data.completedLessons || [];

            // Streak Logic
            let currentStreak = data.streak || 0;
            const lastActivity = data.lastActivity ? new Date(data.lastActivity) : null;

            if (lastActivity) {
                if (isSameDay(lastActivity, now)) {
                    // Already played today, maintain streak
                } else if (isYesterday(lastActivity, now)) {
                    currentStreak += 1; // Continued streak
                } else {
                    currentStreak = 1; // Broken streak
                }
            } else {
                currentStreak = 1;
            }

            if (!completedLessons.includes(itemId)) {
                const updateData = {
                    totalPoints: admin.firestore.FieldValue.increment(stars), // Points are now just Stars
                    stars: admin.firestore.FieldValue.increment(stars),
                    completedLessons: admin.firestore.FieldValue.arrayUnion(itemId),
                    streak: currentStreak,
                    lastActivity: now.toISOString()
                };

                // If moduleId is provided, update the score for that module
                if (req.body.moduleId) {
                    const moduleId = req.body.moduleId;
                    // Note: This increments the score for the module. 
                    // If you want to SET it, use dot notation without increment, but here we accumulate stars/points per module.
                    updateData[`moduleScores.${moduleId}`] = admin.firestore.FieldValue.increment(points); // Using points as score
                }

                await progressRef.update(updateData);

                await userRef.update({
                    totalPoints: admin.firestore.FieldValue.increment(points)
                });
            } else {
                // Even if lesson is repeated, we should probably update streak? 
                // Logic says "markItemComplete", usually implies keeping up the habit.
                // But let's only update streak if not completed? 
                // Actually, user might replay. Let's update streak regardless of completion if they are active.
                await progressRef.update({
                    streak: currentStreak,
                    lastActivity: now.toISOString()
                });

                console.log(`Item ${itemId} already completed. Points not awarded, but streak updated.`);
                return res.status(200).json({ message: 'Item already completed', awarded: false, streak: currentStreak });
            }
        }

        res.status(200).json({ message: 'Progress updated successfully', awarded: true });
    } catch (error) {
        console.error("Error updating child progress:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.completeCourse = async (req, res) => {
    try {
        const { userId, courseId, courseName, points: pointsArg } = req.body;
        // Award variable points for course completion, default 100
        const points = pointsArg || 100;

        if (!userId || !courseId) {
            return res.status(400).json({ error: 'Missing userId or courseId' });
        }

        const progressRef = firestore.collection('child_progress').doc(userId);
        const userRef = firestore.collection('users').doc(userId);

        // Placeholder badge logic
        const badge = {
            id: `badge_${courseId}`,
            name: `${courseName || 'Course'} Master`,
            dateEarned: new Date().toISOString(),
            image: 'badge_placeholder.png' // Placeholder as requested
        };

        const progressSnap = await progressRef.get();
        if (!progressSnap.exists) {
            // Should exist if they are completing a course, but handle anyway
            await progressRef.set({
                totalPoints: points,
                stars: points,
                completedCourses: [courseId],
                badges: [badge],
                lastActivity: new Date().toISOString(),
                streak: 1,
                moduleScores: {}
            });
            await userRef.update({ totalPoints: points });
        } else {
            const data = progressSnap.data();
            const completedCourses = data.completedCourses || [];

            if (!completedCourses.includes(courseId)) {
                await progressRef.update({
                    totalPoints: admin.firestore.FieldValue.increment(points), // Points = Stars
                    stars: admin.firestore.FieldValue.increment(points), // Also track in stars field explicitly
                    completedCourses: admin.firestore.FieldValue.arrayUnion(courseId),
                    badges: admin.firestore.FieldValue.arrayUnion(badge),
                    lastActivity: new Date().toISOString()
                });
                await userRef.update({
                    totalPoints: admin.firestore.FieldValue.increment(points)
                });
            } else {
                // SPECIAL LOGIC FOR TEST COURSE: Allow multiple completions for stars
                if (courseId === 'test_course_id_1') {
                    await progressRef.update({
                        totalPoints: admin.firestore.FieldValue.increment(points),
                        stars: admin.firestore.FieldValue.increment(points),
                        lastActivity: new Date().toISOString()
                    });
                    await userRef.update({
                        totalPoints: admin.firestore.FieldValue.increment(points)
                    });

                    return res.status(200).json({ message: 'Test course re-completed! Stars added.', badge: badge });
                }

                return res.status(200).json({ message: 'Course already completed' });
            }
        }

        res.status(200).json({ message: 'Course completed!', badge });

    } catch (error) {
        console.error("Error competing course:", error);
        res.status(500).json({ error: error.message });
    }
};
