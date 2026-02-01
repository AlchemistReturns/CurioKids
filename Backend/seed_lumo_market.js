
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

const courses = [
    // --- COURSE 4: Lumo's Market Adventure ---
    {
        id: "lumo_market",
        title: "Lumo's Market Adventure",
        description: "Shop with Lumo and learn about Money! ৳ 🛒",
        icon: "cart",
        color: "#FF9800",
        modules: [
            // Lesson 1
            {
                title: "Lesson 1: Bangla Market Play 🍌",
                order: 1,
                lessons: [
                    {
                        title: "Find 5 Taka",
                        type: "logic_sorting",
                        question: "Show me the 5 Taka coin!",
                        data: { items: ["coin_5", "coin_2", "coin_1"], correctAnswer: "coin_5", explanation: "That is 5 Taka!" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Buy a Candy",
                        type: "logic_sorting",
                        question: "A candy costs 2 Taka. Pay with:",
                        data: { items: ["coin_2", "coin_5", "note_10"], correctAnswer: "coin_2", explanation: "Correct! 2 Taka." },
                        points: 10, stars: 1, order: 2
                    },
                    {
                        title: "Big Money",
                        type: "logic_sorting",
                        question: "Which coin has the BIGGEST value?",
                        data: { items: ["coin_5", "coin_2", "coin_1"], correctAnswer: "coin_5", explanation: "5 is the biggest!" },
                        points: 10, stars: 1, order: 3
                    }
                ]
            },
            // Lesson 2
            {
                title: "Lesson 2: Make 10 💰",
                order: 2,
                lessons: [
                    {
                        title: "Find 10",
                        type: "logic_sorting",
                        question: "Show me the 10 Taka note!",
                        data: { items: ["note_10", "coin_5", "coin_1"], correctAnswer: "note_10", explanation: "That is the ৳10 note!" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Two Fives",
                        type: "logic_sorting",
                        question: "You have two 5 Taka coins. How much is that?",
                        data: { items: ["note_10", "coin_5", "note_20"], correctAnswer: "note_10", explanation: "5 + 5 is 10!" },
                        points: 10, stars: 1, order: 2
                    }
                ]
            },
            // Lesson 3
            {
                title: "Lesson 3: Price Puzzle 🏷️",
                order: 3,
                lessons: [
                    {
                        title: "Total Cost",
                        type: "logic_sorting",
                        question: "A Pen costs ৳6. An Eraser costs ৳4. Total?",
                        data: { items: ["note_10", "coin_5", "coin_2"], correctAnswer: "note_10", explanation: "6 + 4 = 10!" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Buy 2 Chocolates",
                        type: "logic_sorting",
                        question: "One chocolate is ৳5. You buy 2. Total?",
                        data: { items: ["note_10", "coin_5", "note_20"], correctAnswer: "note_10", explanation: "5 + 5 = 10!" },
                        points: 10, stars: 1, order: 2
                    }
                ]
            },
            // Lesson 4
            {
                title: "Lesson 4: Piggy Bank 🐷",
                order: 4,
                lessons: [
                    {
                        title: "Saving Goal",
                        type: "logic_sorting",
                        question: "You want ৳20. You have ৳10. How much more do you need?",
                        data: { items: ["note_10", "coin_5", "note_50"], correctAnswer: "note_10", explanation: "10 + 10 = 20!" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Count the Notes",
                        type: "logic_sorting",
                        question: "You have two ৳10 Notes. What is the total?",
                        data: { items: ["note_20", "note_10", "note_50"], correctAnswer: "note_20", explanation: "10 + 10 = 20!" },
                        points: 10, stars: 1, order: 2
                    }
                ]
            },
            // Lesson 5 - Using Images mostly
            {
                title: "Lesson 5: Note or Coin? 🪙",
                order: 5,
                lessons: [
                    {
                        title: "Identify Coin",
                        type: "logic_sorting",
                        question: "Which one is a COIN?",
                        data: { items: ["coin_1", "note_20", "note_50"], correctAnswer: "coin_1", explanation: "That is a Coin!" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Identify Note",
                        type: "logic_sorting",
                        question: "Which one is a NOTE?",
                        data: { items: ["note_50", "coin_2", "coin_5"], correctAnswer: "note_50", explanation: "That is a Note!" },
                        points: 10, stars: 1, order: 2
                    }
                ]
            },
            // Lesson 6
            {
                title: "Lesson 6: My Mini Invoice 🧾",
                order: 6,
                lessons: [
                    {
                        title: "Total Bill",
                        type: "logic_sorting",
                        question: "A Pen costs ৳3. Eraser ৳2. Total?",
                        data: { items: ["coin_5", "coin_2", "coin_1"], correctAnswer: "coin_5", explanation: "3 + 2 = 5!" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Calculate Change",
                        type: "logic_sorting",
                        question: "The bill is ৳10. You pay ৳20. Change?",
                        data: { items: ["note_10", "coin_5", "note_20"], correctAnswer: "note_10", explanation: "20 - 10 = 10!" },
                        points: 10, stars: 1, order: 2
                    }
                ]
            }
        ]
    }
];

async function seed() {
    console.log("Seeding ONLY Lumo's Market Adventure (via Admin SDK)...");

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
            const existingModulesSnapshot = await firestore.collection("courses").doc(course.id).collection("modules").get();
            for (const moduleDoc of existingModulesSnapshot.docs) {
                // Delete all lessons in this module first
                const lessonsSnapshot = await firestore.collection("courses").doc(course.id).collection("modules").doc(moduleDoc.id).collection("lessons").get();
                for (const lessonDoc of lessonsSnapshot.docs) {
                    await lessonDoc.ref.delete();
                }
                // Then delete the module
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
                        answer: lesson.answer || "",
                        data: lesson.data || {},
                        points: lesson.points || 0,
                        stars: lesson.stars || 0,
                        order: lesson.order
                    };

                    Object.keys(lessonData).forEach(key => lessonData[key] === undefined && delete lessonData[key]);

                    await firestore.collection("courses").doc(course.id).collection("modules").doc(moduleRef.id).collection("lessons").add(lessonData);
                }
            } catch (error) {
                console.error(`❌ Failed to create module ${module.title}:`, error);
            }
        }
    }

    console.log("🎉 Seeding complete for Lumo's Market Adventure!");
    process.exit(0);
}

seed().catch(console.error);
