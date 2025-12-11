const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, doc, setDoc } = require("firebase/firestore");

// Hardcoded config to avoid RN dependencies in Node script
const firebaseConfig = {
    apiKey: "AIzaSyCfSeRMLdUy7unyxhxfnbna3LJwy8mePLw",
    authDomain: "curiokids-c256c.firebaseapp.com",
    projectId: "curiokids-c256c",
    storageBucket: "curiokids-c256c.firebasestorage.app",
    messagingSenderId: "166177413672",
    appId: "1:166177413672:web:f8d72a355628eeaa1c331d",
    measurementId: "G-EQ6P1DHRR0"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const courses = [
    {
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
                        points: 10,
                        stars: 1,
                        order: 1
                    },
                    {
                        title: "Quiz: 1 to 5",
                        type: "exercise",
                        question: "How many fingers do you have on one hand?",
                        answer: "5",
                        points: 20,
                        stars: 2,
                        order: 2
                    },
                    {
                        title: "Numbers 6 to 10",
                        type: "lesson",
                        content: "Now let's go higher! 6, 7, 8, 9, 10.",
                        points: 10,
                        stars: 1,
                        order: 3
                    }
                ]
            },
            {
                title: "Simple Addition",
                order: 2,
                lessons: [
                    {
                        title: "What is Addition?",
                        type: "lesson",
                        content: "Addition means putting things together. 1 apple + 1 apple = 2 apples!",
                        points: 15,
                        stars: 1,
                        order: 1
                    }
                ]
            }
        ]
    },
    {
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
                        points: 10,
                        stars: 1,
                        order: 1
                    },
                    {
                        title: "Letter B",
                        type: "lesson",
                        content: "B is for Ball, Bear, and Banana.",
                        points: 10,
                        stars: 1,
                        order: 2
                    }
                ]
            }
        ]
    }
];

async function seed() {
    console.log("Seeding courses...");

    for (const course of courses) {
        const courseRef = await addDoc(collection(firestore, "courses"), {
            title: course.title,
            description: course.description,
            icon: course.icon,
            color: course.color,
        });
        console.log(`Created Course: ${course.title} (${courseRef.id})`);

        for (const module of course.modules) {
            const moduleRef = await addDoc(collection(firestore, "courses", courseRef.id, "modules"), {
                title: module.title,
                order: module.order
            });
            console.log(`  - Created Module: ${module.title}`);

            for (const lesson of module.lessons) {
                await addDoc(collection(firestore, "courses", courseRef.id, "modules", moduleRef.id, "lessons"), {
                    title: lesson.title,
                    type: lesson.type,
                    content: lesson.content || "",
                    question: lesson.question || "",
                    answer: lesson.answer || "",
                    points: lesson.points,
                    stars: lesson.stars,
                    order: lesson.order
                });
                console.log(`    -- Created Lesson: ${lesson.title}`);
            }
        }
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch(console.error);
