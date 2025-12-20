const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, doc, setDoc } = require("firebase/firestore");
require('dotenv').config();

// Ensure your .env file has these keys!
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const courses = [
    // --- COURSE 1: Fun with Numbers ---
    {
        id: "fun_numbers",
        title: "Fun with Numbers",
        description: "Learn counting and basic math with fun visuals!",
        icon: "calculator",
        color: "#4CAF50",
        modules: [
            {
                title: "Counting 1-10",
                order: 1,
                lessons: [
                    {
                        title: "Numbers 1 to 5",
                        type: "lesson",
                        content: "Let's count! 1, 2, 3, 4, 5. Can you count your fingers?",
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Quiz: 1 to 5",
                        type: "exercise",
                        question: "How many fingers do you have on one hand?",
                        answer: "5",
                        points: 20, stars: 2, order: 2
                    }
                ]
            }
        ]
    },

    // --- COURSE 2: Alphabet Adventure ---
    {
        id: "alphabet_abc",
        title: "Alphabet Adventure",
        description: "Explore the ABCs and learn new words.",
        icon: "book",
        color: "#2196F3",
        modules: [
            {
                title: "A to E",
                order: 1,
                lessons: [
                    {
                        title: "Letter A",
                        type: "lesson",
                        content: "A is for Apple, Ant, and Alligator.",
                        points: 10, stars: 1, order: 1
                    }
                ]
            }
        ]
    },

    // --- COURSE 3: Logic Land with Lumo (Levels 1-10) ---
    {
        id: "logic_lumo",
        title: "Logic Land with Lumo",
        description: "Help Lumo the Robot fix the Logic Castle! 🏰🤖",
        icon: "hardware-chip",
        color: "#673AB7",
        modules: [
            // --- LEVEL 1: PATTERNS ---
            {
                title: "Level 1: Rainbow Bridge 🌈",
                order: 1,
                lessons: [
                    {
                        title: "Intro: Meet Lumo",
                        type: "story_intro",
                        content: "Hi! I’m Lumo! 🤖 The Rainbow Bridge is broken. 😢 To fix it, we must find patterns. Can you help me?",
                        points: 5, stars: 1, order: 1
                    },
                    {
                        title: "Pattern Parade",
                        type: "logic_pattern",
                        question: "What comes next in the line?",
                        data: { sequence: ["🔴", "🟡", "🔴", "🟡", "?"], options: ["🔵", "🔴", "🟡"], correctAnswer: "🔴" },
                        points: 10, stars: 1, order: 2
                    },
                    {
                        title: "Shape Shifter",
                        type: "logic_pattern",
                        question: "Look closely! Which shape fits?",
                        data: { sequence: ["🟦", "🔺", "🟦", "🔺", "?"], options: ["🟦", "🟩", "🔺"], correctAnswer: "🟦" },
                        points: 10, stars: 1, order: 3
                    },
                    {
                        title: "Fix the Bridge (Drag & Drop)",
                        type: "logic_drag",
                        question: "Drag the correct tile to fix the bridge!",
                        data: {
                            holeIndex: 4,
                            sequence: ["🔴", "🟡", "🔴", "🟡", "?"],
                            draggableOptions: ["🔴", "🟢", "🔵"],
                            correctAnswer: "🔴",
                            successText: "Bridge fixed! Lumo can cross! 🌈"
                        },
                        points: 20,
                        stars: 2,
                        order: 5
                    }

                ]
            },

            // --- LEVEL 2: NUMBER LOGIC ---
            {
                title: "Level 2: Number Forest 🌳",
                order: 2,
                lessons: [
                    {
                        title: "Counting Steps",
                        type: "logic_pattern",
                        question: "Lumo takes steps! 1, 2, 3...",
                        data: { sequence: ["1", "2", "3", "?"], options: ["4", "5", "1"], correctAnswer: "4" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Big Jumps (2s)",
                        type: "logic_pattern",
                        question: "Jump by 2s! 2, 4, 6...",
                        data: { sequence: ["2", "4", "6", "?"], options: ["7", "8", "10"], correctAnswer: "8" },
                        points: 15, stars: 2, order: 2
                    }
                ]
            },

            // --- LEVEL 3: PREDICTION ---
            {
                title: "Level 3: Story Time 📖",
                order: 3,
                lessons: [
                    {
                        title: "Weather Watch",
                        type: "logic_pattern",
                        question: "Clouds bring rain. What happens next?",
                        data: { sequence: ["☁️", "🌧️", "🌱", "?"], options: ["🌻", "⛄", "🚗"], correctAnswer: "🌻" },
                        points: 10, stars: 1, order: 1
                    }
                ]
            },

            // --- LEVEL 4: CLASSIFICATION ---
            {
                title: "Level 4: Odd One Out 🧐",
                order: 4,
                lessons: [
                    {
                        title: "Color Spy",
                        type: "logic_sorting",
                        question: "Wait... one of these is different!",
                        data: { items: ["🟦", "🟥", "🟦", "🟦"], correctAnswer: "🟥", explanation: "Red is sneaky!" },
                        points: 10, stars: 1, order: 1
                    },
                    {
                        title: "Hungry Lumo",
                        type: "logic_sorting",
                        question: "Which one can Lumo EAT?",
                        data: { items: ["🚗", "🍎", "🧸", "⚽"], correctAnswer: "🍎", explanation: "Yum! An Apple!" },
                        points: 10, stars: 1, order: 2
                    }
                ]
            },

            // --- LEVEL 5: COMPARISON ---
            {
                title: "Level 5: Big & Small 🐘",
                order: 5,
                lessons: [
                    {
                        title: "Find the Biggest",
                        type: "logic_sorting",
                        question: "Who is the giant here?",
                        data: { items: ["🐜", "🐘", "🐈"], correctAnswer: "🐘", explanation: "The Elephant is huge!" },
                        points: 10, stars: 1, order: 1
                    }
                ]
            },

            // --- LEVEL 6: GROUPING ---
            {
                title: "Level 6: Toy Box 🧸",
                order: 6,
                lessons: [
                    {
                        title: "Toys vs Food",
                        type: "logic_sorting",
                        question: "Tap the TOY!",
                        data: { items: ["🥦", "🥪", "🧸", "🍎"], correctAnswer: "🧸", explanation: "The bear is a toy!" },
                        points: 10, stars: 1, order: 1
                    }
                ]
            },

            // --- LEVEL 7: DIRECTION ---
            {
                title: "Level 7: Maze Master 🧭",
                order: 7,
                lessons: [
                    {
                        title: "Go Right",
                        type: "logic_pattern",
                        question: "Lumo wants to go RIGHT. Which arrow?",
                        data: { sequence: ["🤖", "❓", "🏰"], options: ["⬆️", "➡️", "⬅️"], correctAnswer: "➡️" },
                        points: 10, stars: 1, order: 1
                    }
                ]
            },

            // --- LEVEL 8: SEQUENCING ---
            {
                title: "Level 8: Time Machine 🔄",
                order: 8,
                lessons: [
                    {
                        title: "Morning Routine",
                        type: "logic_sequencing",
                        question: "Put the morning in order!",
                        data: {
                            correctOrder: ["☀️", "🪥", "🎒"],
                            scrambled: ["🪥", "🎒", "☀️"],
                            labels: ["Wake Up", "Brush", "School"]
                        },
                        points: 20, stars: 3, order: 1
                    },
                    {
                        title: "Growing a Flower",
                        type: "logic_sequencing",
                        question: "How does life grow?",
                        data: {
                            correctOrder: ["🌱", "🌧️", "🌻"],
                            scrambled: ["🌻", "🌱", "🌧️"],
                            labels: ["Seed", "Water", "Bloom"]
                        },
                        points: 20, stars: 3, order: 2
                    }
                ]
            },

            // --- LEVEL 9: CAUSE & EFFECT ---
            {
                title: "Level 9: If-Then Logic 🧠",
                order: 9,
                lessons: [
                    {
                        title: "Rainy Day",
                        type: "logic_sorting",
                        question: "IF it rains ☔, THEN we need...",
                        data: { items: ["🕶️", "☂️", "🧢"], correctAnswer: "☂️", explanation: "We need an umbrella!" },
                        points: 15, stars: 2, order: 1
                    }
                ]
            },

            // --- LEVEL 10: THE BOSS LEVEL (Harder & Mixed) ---
            {
                title: "Level 10: The Logic Castle 🏰",
                order: 10,
                lessons: [
                    {
                        title: "The Gatekeeper's Riddle",
                        type: "logic_pattern",
                        question: "SOLVE THE MASTER PATTERN!",
                        // Harder Pattern: AAB AAB
                        data: { sequence: ["🔴", "🔴", "🟦", "🔴", "🔴", "?"], options: ["🔴", "🟦", "🟩"], correctAnswer: "🟦" },
                        points: 30, stars: 3, order: 1
                    },
                    {
                        title: "The Treasure Vault",
                        type: "logic_sorting",
                        question: "Find the thing that is HOT!",
                        data: { items: ["❄️", "🍦", "🔥", "⛄"], correctAnswer: "🔥", explanation: "Fire is hot!" },
                        points: 30, stars: 3, order: 2
                    },
                    {
                        title: "Unlock the Throne",
                        type: "logic_sequencing",
                        question: "Order the Life of a Butterfly!",
                        // Harder: 4 Steps
                        data: {
                            correctOrder: ["🥚", "🐛", "🧶", "🦋"],
                            scrambled: ["🦋", "🥚", "🧶", "🐛"],
                            labels: ["Egg", "Caterpillar", "Cocoon", "Butterfly"]
                        },
                        points: 50, stars: 3, order: 3
                    },
                    {
                        title: "Victory Celebration",
                        type: "story_intro",
                        content: "YOU DID IT! 🏆 The Logic Castle is open! Lumo is so proud of you!",
                        points: 100, stars: 5, order: 4
                    }
                ]
            }
        ]
    }
];

async function seed() {
    console.log("Seeding courses...");

    for (const course of courses) {
        // 1. Create/Update Course
        await setDoc(doc(firestore, "courses", course.id), {
            title: course.title,
            description: course.description,
            icon: course.icon,
            color: course.color,
        });
        console.log(`✅ Course: ${course.title}`);

        for (const module of course.modules) {
            // 2. Create Module
            // We use addDoc here for simplicity, but in a real 'update' scenario, 
            // you might want to query for existing modules to avoid duplicates if re-seeding often.
            // For now, assume a fresh seed or acceptable duplicates in sub-collections.
            const moduleRef = await addDoc(collection(firestore, "courses", course.id, "modules"), {
                title: module.title,
                order: module.order
            });
            console.log(`  - Module: ${module.title}`);

            for (const lesson of module.lessons) {
                // 3. Create Lesson
                await addDoc(collection(firestore, "courses", course.id, "modules", moduleRef.id, "lessons"), {
                    title: lesson.title,
                    type: lesson.type,
                    content: lesson.content || "",
                    question: lesson.question || "",
                    answer: lesson.answer || "",
                    data: lesson.data || null,
                    points: lesson.points,
                    stars: lesson.stars,
                    order: lesson.order
                });
            }
        }
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);
}

seed().catch(console.error);