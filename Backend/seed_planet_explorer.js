
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const firestore = admin.firestore();

const courses = [
    {
        id: "planet_explorer",
        title: "Planet Explorer",
        description: "Blast off with Captain Lumo to explore the Solar System! 🚀🪐",
        icon: "rocket",
        color: "#3F51B5",
        modules: [
            // Module 1: Blast Off!
            {
                title: "Module 1: Blast Off! 🚀",
                order: 1,
                lessons: [
                    {
                        title: "Meet Captain Lumo",
                        type: "story_intro",
                        content: "Hi! I'm Captain Lumo. Are you ready to explore space with me?",
                        data: { image: "lumo_astronaut" },
                        points: 5, stars: 1, order: 1
                    },
                    {
                        title: "Our Home",
                        type: "story",
                        content: "This is Earth. It is our home. It looks blue and green from space!",
                        data: { image: "earth" },
                        points: 5, stars: 1, order: 2
                    },
                    {
                        title: "Find Earth",
                        type: "logic_sorting",
                        question: "Which one is Planet Earth?",
                        data: { items: ["earth", "mars", "mercury"], correctAnswer: "earth", explanation: "Correct! That's our home!" },
                        points: 10, stars: 1, order: 3
                    }
                ]
            },
            // Module 2: The Inner Planets
            {
                title: "Module 2: Hot Planets 🔥",
                order: 2,
                lessons: [
                    {
                        title: "Mercury",
                        type: "story",
                        content: "This is Mercury. It is the closest planet to the Sun. It is very rocky!",
                        data: { image: "mercury" },
                        points: 5, stars: 1, order: 1
                    },
                    {
                        title: "Venus",
                        type: "story",
                        content: "This is Venus. It is very hot and cloudy. It is the brightest planet in the night sky.",
                        data: { image: "venus" },
                        points: 5, stars: 1, order: 2
                    },
                    {
                        title: "Find Mercury",
                        type: "logic_sorting",
                        question: "Show me Mercury, the closest planet to the Sun!",
                        data: { items: ["venus", "mercury", "earth"], correctAnswer: "mercury", explanation: "Yes! Mercury is closest to the Sun." },
                        points: 10, stars: 1, order: 3
                    },
                    {
                        title: "Mars",
                        type: "story",
                        content: "This is Mars. It is called the Red Planet because of its red dust!",
                        data: { image: "mars" },
                        points: 5, stars: 1, order: 4
                    },
                    {
                        title: "Red Planet",
                        type: "logic_sorting",
                        question: "Which one is the Red Planet?",
                        data: { items: ["earth", "mars", "venus"], correctAnswer: "mars", explanation: "Correct! Mars is red." },
                        points: 10, stars: 1, order: 5
                    }
                ]
            },
            // Module 3: Gas Giants
            {
                title: "Module 3: The Giants 🪐",
                order: 3,
                lessons: [
                    {
                        title: "Jupiter",
                        type: "story",
                        content: "This is Jupiter. It is the BIGGEST planet in the solar system!",
                        data: { image: "jupiter" },
                        points: 5, stars: 1, order: 1
                    },
                    {
                        title: "Find the Giant",
                        type: "logic_sorting",
                        question: "Which planet is the biggest?",
                        data: { items: ["mars", "jupiter", "earth"], correctAnswer: "jupiter", explanation: "Wow! Jupiter is huge!" },
                        points: 10, stars: 1, order: 2
                    },
                    {
                        title: "Saturn",
                        type: "story",
                        content: "This is Saturn. Look at its beautiful rings! They are made of ice and rock.",
                        data: { image: "saturn" },
                        points: 5, stars: 1, order: 3
                    },
                    {
                        title: "Ring Planet",
                        type: "logic_sorting",
                        question: "Which planet has big beautiful rings?",
                        data: { items: ["jupiter", "saturn", "neptune"], correctAnswer: "saturn", explanation: "Yes! Saturn has amazing rings." },
                        points: 10, stars: 1, order: 4
                    }
                ]
            },
            // Module 4: Ice Giants
            {
                title: "Module 4: Ice Giants ❄️",
                order: 4,
                lessons: [
                    {
                        title: "Uranus",
                        type: "story",
                        content: "This is Uranus. It is an icy blue planet that spins on its side!",
                        data: { image: "uranus" },
                        points: 5, stars: 1, order: 1
                    },
                    {
                        title: "Neptune",
                        type: "story",
                        content: "This is Neptune. It is very far away, cold, and stormy.",
                        data: { image: "neptune" },
                        points: 5, stars: 1, order: 2
                    },
                    {
                        title: "Far Away",
                        type: "logic_sorting",
                        question: "Which planet is very cold and blue?",
                        data: { items: ["mars", "neptune", "venus"], correctAnswer: "neptune", explanation: "Brrr! Neptune is cold." },
                        points: 10, stars: 1, order: 3
                    },
                    {
                        title: "Mission Complete",
                        type: "story_outro",
                        content: "Great job Explorer! You learned about all the planets. See you next time!",
                        data: { image: "lumo_astronaut" },
                        points: 20, stars: 3, order: 4
                    }
                ]
            }
        ]
    }
];

async function seed() {
    console.log("Seeding Planet Explorer Course...");

    for (const course of courses) {
        // 1. Create/Update Course
        console.log(`Setting course: ${course.id}`);
        try {
            await firestore.collection("courses").doc(course.id).set({
                title: course.title,
                description: course.description,
                icon: course.icon,
                color: course.color,
            });
            console.log(`✅ Course: ${course.title}`);
        } catch (error) {
            console.error(`❌ Failed to set course ${course.title}:`, error);
        }

        // Delete existing modules to prevent duplicates
        try {
            // Note: This deletes all modules for the course to get a fresh start
            const existingModulesSnapshot = await firestore.collection("courses").doc(course.id).collection("modules").get();
            for (const moduleDoc of existingModulesSnapshot.docs) {
                const lessonsSnapshot = await firestore.collection("courses").doc(course.id).collection("modules").doc(moduleDoc.id).collection("lessons").get();
                for (const lessonDoc of lessonsSnapshot.docs) {
                    await lessonDoc.ref.delete();
                }
                await moduleDoc.ref.delete();
            }
        } catch (error) {
            console.error("Error deleting existing modules:", error);
        }

        for (const module of course.modules) {
            // 2. Create Module
            try {
                const moduleRef = await firestore.collection("courses").doc(course.id).collection("modules").add({
                    title: module.title,
                    order: module.order
                });
                console.log(`  - Module: ${module.title}`);

                for (const lesson of module.lessons) {
                    // 3. Create Lesson
                    const lessonData = {
                        title: lesson.title,
                        type: lesson.type,
                        content: lesson.content || "",
                        question: lesson.question || "",
                        data: lesson.data || {},
                        points: lesson.points || 0,
                        stars: lesson.stars || 0,
                        order: lesson.order
                    };

                    await firestore.collection("courses").doc(course.id).collection("modules").doc(moduleRef.id).collection("lessons").add(lessonData);
                }
            } catch (error) {
                console.error(`❌ Failed to create module ${module.title}:`, error);
            }
        }
    }

    console.log("🎉 Seeding complete for Planet Explorer!");
    process.exit(0);
}

seed().catch(console.error);
